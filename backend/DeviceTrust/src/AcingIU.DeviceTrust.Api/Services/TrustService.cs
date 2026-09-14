using AcingIU.DeviceTrust.Api.Data;
using AcingIU.DeviceTrust.Api.Models;

namespace AcingIU.DeviceTrust.Api.Services;

public interface ITrustService
{
    Task<TrustScoreResponse> SubmitTelemetryAsync(TelemetrySubmitRequest req, Guid? ownerUserId, string? traceId, CancellationToken ct = default);

    /// <summary>
    /// Object-level authorized device read. Ownership is enforced in this service layer;
    /// repository data alone must not be returned to non-owners.
    /// </summary>
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

    public async Task<TrustScoreResponse> SubmitTelemetryAsync(TelemetrySubmitRequest req, Guid? ownerUserId, string? traceId, CancellationToken ct = default)
    {
        var (score, breakdown) = _engine.Compute(req);
        var threshold = await _repo.GetTrustThresholdAsync(ct);

        var result = await _repo.UpsertTelemetryAsync(req, score, ownerUserId, ct);
        result.Breakdown = breakdown;
        result.Threshold = threshold;
        result.Allowed = score >= threshold;

        await _repo.WriteAuditAsync(
            "trust.telemetry.submit",
            result.Allowed ? "INFO" : "WARNING",
            ownerUserId?.ToString() ?? "unknown",
            "/api/trust/telemetry/submit",
            new { score, threshold, result.Allowed },
            traceId,
            ct);

        return result;
    }

    public async Task<DeviceAccessResult> GetDeviceForCallerAsync(
        string hwId,
        Guid callerUserId,
        bool isPrivileged,
        string? traceId,
        CancellationToken ct = default)
    {
        // Repository may return the row; service decides visibility (defense in depth).
        var record = await _repo.GetByHwIdAsync(hwId, ct);
        if (record is null)
            return DeviceAccessResult.NotFound();

        var isOwner = record.OwnerUserId.HasValue && record.OwnerUserId.Value == callerUserId;
        if (!isPrivileged && !isOwner)
        {
            // Anti-enumeration: same outcome as unknown device. Do not log hwId.
            await _repo.WriteAuditAsync(
                "trust.device.access_denied",
                "WARNING",
                callerUserId.ToString("D"),
                "/api/trust/devices",
                new { reason = "ownership_or_role", privileged = false },
                traceId,
                ct);
            return DeviceAccessResult.NotFound();
        }

        var threshold = TrustScoreEngine.DefaultThreshold;
        record.Response.Threshold = threshold;
        record.Response.Allowed = record.Response.TrustScore >= threshold;
        return DeviceAccessResult.Ok(record.Response);
    }

    public Task<IReadOnlyList<DeviceListItem>> ListDevicesAsync(CancellationToken ct = default) =>
        _repo.ListAsync(50, ct);
}
