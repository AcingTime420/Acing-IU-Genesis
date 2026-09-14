using AcingIU.DeviceTrust.Api.Data;
using AcingIU.DeviceTrust.Api.Models;

namespace AcingIU.DeviceTrust.Api.Services;

public interface ITrustService
{
    /// <summary>
    /// Submit telemetry with object-level ownership. New devices are attributed to the caller.
    /// Existing devices: owner or Admin/Operator may update telemetry; owner_user_id is never
    /// reassigned by this path. Cross-owner and unauthorized null-owner → NotFound (anti-enum).
    /// </summary>
    Task<TelemetrySubmitResult> SubmitTelemetryAsync(
        TelemetrySubmitRequest req,
        Guid callerUserId,
        bool isPrivileged,
        string? traceId,
        CancellationToken ct = default);

    Task<DeviceAccessResult> GetDeviceForCallerAsync(
        string hwId,
        Guid callerUserId,
        bool isPrivileged,
        string? traceId,
        CancellationToken ct = default);

    Task<IReadOnlyList<DeviceListItem>> ListDevicesAsync(CancellationToken ct = default);
}

public sealed class TrustService : ITrustService
{
    private readonly IDeviceRepository _repo;
    private readonly ITrustScoreEngine _engine;

    public TrustService(IDeviceRepository repo, ITrustScoreEngine engine)
    {
        _repo = repo;
        _engine = engine;
    }

    public async Task<TelemetrySubmitResult> SubmitTelemetryAsync(
        TelemetrySubmitRequest req,
        Guid callerUserId,
        bool isPrivileged,
        string? traceId,
        CancellationToken ct = default)
    {
        var existing = await _repo.GetByHwIdAsync(req.HwIdentifier, ct);

        if (existing is not null)
        {
            var isOwner = existing.OwnerUserId.HasValue && existing.OwnerUserId.Value == callerUserId;
            // Null-owner legacy rows: fail-closed for non-privileged (no silent claim via telemetry).
            // Ownership reassignment is intentionally not part of this workflow.
            if (!isPrivileged && !isOwner)
            {
                await TryWriteDenialAuditAsync(
                    callerUserId,
                    "telemetry_ownership_or_role",
                    traceId,
                    ct);
                return TelemetrySubmitResult.NotFound();
            }
        }

        var (score, breakdown) = _engine.Compute(req);
        var threshold = await _repo.GetTrustThresholdAsync(ct);

        // INSERT uses caller as owner for new rows. ON CONFLICT does not modify owner_user_id
        // (preserve existing attribution). Pass null when privileged is updating a null-owner row
        // so INSERT path is not relevant and conflict path still preserves null.
        Guid? ownerForInsert = existing is null
            ? callerUserId
            : existing.OwnerUserId; // may be null; conflict branch ignores this parameter

        var result = await _repo.UpsertTelemetryAsync(req, score, ownerForInsert, ct);
        result.Breakdown = breakdown;
        result.Threshold = threshold;
        result.Allowed = score >= threshold;

        // Audit uses DeviceId (stable, non-secret) — not raw hardware identifier.
        await TryWriteAuditAsync(
            "trust.telemetry.submit",
            result.Allowed ? "INFO" : "WARNING",
            callerUserId.ToString("D"),
            "/api/trust/telemetry/submit",
            new { deviceId = result.DeviceId, score, threshold, result.Allowed },
            traceId,
            ct);

        return TelemetrySubmitResult.Ok(result);
    }

    public async Task<DeviceAccessResult> GetDeviceForCallerAsync(
        string hwId,
        Guid callerUserId,
        bool isPrivileged,
        string? traceId,
        CancellationToken ct = default)
    {
        var record = await _repo.GetByHwIdAsync(hwId, ct);
        if (record is null)
            return DeviceAccessResult.NotFound();

        var isOwner = record.OwnerUserId.HasValue && record.OwnerUserId.Value == callerUserId;
        if (!isPrivileged && !isOwner)
        {
            // Anti-enumeration: same outcome as unknown. Audit failure must not change HTTP path.
            await TryWriteDenialAuditAsync(callerUserId, "ownership_or_role", traceId, ct);
            return DeviceAccessResult.NotFound();
        }

        var threshold = await _repo.GetTrustThresholdAsync(ct);
        record.Response.Threshold = threshold;
        record.Response.Allowed = record.Response.TrustScore >= threshold;
        return DeviceAccessResult.Ok(record.Response);
    }

    public Task<IReadOnlyList<DeviceListItem>> ListDevicesAsync(CancellationToken ct = default) =>
        _repo.ListAsync(50, ct);

    private async Task TryWriteDenialAuditAsync(
        Guid callerUserId, string reason, string? traceId, CancellationToken ct)
    {
        await TryWriteAuditAsync(
            "trust.device.access_denied",
            "WARNING",
            callerUserId.ToString("D"),
            "/api/trust/devices",
            new { reason, privileged = false },
            traceId,
            ct);
    }

    /// <summary>
    /// Best-effort audit. Failures are swallowed so denial responses stay indistinguishable
    /// from unknown-device 404s. Operators must monitor DB health for audit table availability.
    /// </summary>
    private async Task TryWriteAuditAsync(
        string eventType, string severity, string actor, string? resource, object? payload, string? traceId, CancellationToken ct)
    {
        try
        {
            await _repo.WriteAuditAsync(eventType, severity, actor, resource, payload, traceId, ct);
        }
        catch
        {
            // Residual risk: denial may go unlogged until audit storage recovers.
        }
    }
}
