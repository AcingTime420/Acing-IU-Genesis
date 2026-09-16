using AcingIU.DeviceTrust.Api.Data;
using AcingIU.DeviceTrust.Api.Models;

namespace AcingIU.DeviceTrust.Api.Services;

public interface ITrustService
{
    /// <summary>
    /// Submit telemetry for an already-enrolled device.
    /// Does not register unknown hardware IDs (enrollment is a separate authorized workflow).
    /// Ownership is enforced atomically in the repository UPDATE; owner_user_id is never reassigned.
    /// Success requires a durable audit row in the same transaction.
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
        var (score, breakdown) = _engine.Compute(req);
        var threshold = await _repo.GetTrustThresholdAsync(ct);
        var scoreAllowed = score >= threshold;

        // Atomic authorized UPDATE + required success audit (no service-layer check-then-write).
        var mutation = await _repo.TryAuthorizedTelemetryUpdateWithAuditAsync(
            req, score, callerUserId, isPrivileged, threshold, scoreAllowed, traceId, ct);

        if (mutation.Outcome != TelemetryMutationOutcome.Updated || mutation.Device is null)
        {
            // Best-effort denial audit only — must not alter 404 shape.
            await TryWriteDenialAuditAsync(
                eventType: "trust.telemetry.access_denied",
                resource: "/api/trust/telemetry/submit",
                callerUserId,
                reason: "ownership_or_unenrolled",
                traceId,
                ct);
            return TelemetrySubmitResult.NotFound();
        }

        mutation.Device.Breakdown = breakdown;
        return TelemetrySubmitResult.Ok(mutation.Device);
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
            await TryWriteDenialAuditAsync(
                eventType: "trust.device.access_denied",
                resource: "/api/trust/devices",
                callerUserId,
                reason: "ownership_or_role",
                traceId,
                ct);
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
        string eventType,
        string resource,
        Guid callerUserId,
        string reason,
        string? traceId,
        CancellationToken ct)
    {
        try
        {
            await _repo.WriteAuditAsync(
                eventType,
                "WARNING",
                callerUserId.ToString("D"),
                resource,
                new { reason, privileged = false },
                traceId,
                ct);
        }
        catch
        {
            // Denial-path only: preserve indistinguishable 404 if audit storage is down.
        }
    }
}
