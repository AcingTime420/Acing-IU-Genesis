using System.Security.Claims;
using AcingIU.DeviceTrust.Api.Data;
using AcingIU.DeviceTrust.Api.Models;

namespace AcingIU.DeviceTrust.Api.Services;

public interface ITrustService
{
    Task<TelemetrySubmitResult> SubmitTelemetryAsync(TelemetrySubmitRequest req, Guid callerUserId, bool isPrivileged, string? traceId, CancellationToken ct = default);
    Task<DeviceAccessResult> GetDeviceForCallerAsync(string hwId, Guid callerUserId, bool isPrivileged, string? traceId, CancellationToken ct = default);
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

    public async Task<TelemetrySubmitResult> SubmitTelemetryAsync(TelemetrySubmitRequest req, Guid callerUserId, bool isPrivileged, string? traceId, CancellationToken ct = default)
    {
        var (score, breakdown) = _engine.Compute(req);
        var threshold = await _repo.GetTrustThresholdAsync(ct);
        var allowed = score >= threshold;

        var result = await _repo.TryAuthorizedTelemetryUpdateWithAuditAsync(req, score, callerUserId, isPrivileged, threshold, allowed, traceId, ct);
        if (result.Outcome != TelemetryMutationOutcome.Updated || result.Device is null)
        {
            await TryWriteDenialAuditAsync("trust.telemetry.access_denied", "/api/trust/telemetry/submit", callerUserId, isPrivileged, "ownership_or_unenrolled", traceId, ct);
            return TelemetrySubmitResult.NotFound();
        }
        result.Device.Breakdown = breakdown;
        return TelemetrySubmitResult.Ok(result.Device);
    }

    public async Task<DeviceAccessResult> GetDeviceForCallerAsync(string hwId, Guid callerUserId, bool isPrivileged, string? traceId, CancellationToken ct = default)
    {
        var record = await _repo.GetByHwIdAsync(hwId, ct);
        if (record is null)
        {
            await TryWriteDenialAuditAsync("trust.device.access_denied", "/api/trust/devices", callerUserId, isPrivileged, "unknown_device", traceId, ct);
            return DeviceAccessResult.NotFound();
        }

        if (!isPrivileged && (!record.OwnerUserId.HasValue || record.OwnerUserId.Value != callerUserId))
        {
            await TryWriteDenialAuditAsync("trust.device.access_denied", "/api/trust/devices", callerUserId, isPrivileged, "ownership_or_role", traceId, ct);
            return DeviceAccessResult.NotFound();
        }

        record.Response.Threshold = await _repo.GetTrustThresholdAsync(ct);
        record.Response.Allowed = record.Response.TrustScore >= record.Response.Threshold;
        return DeviceAccessResult.Ok(record.Response);
    }

    public Task<IReadOnlyList<DeviceListItem>> ListDevicesAsync(CancellationToken ct = default) =>
        _repo.ListAsync(50, ct);

    private async Task TryWriteDenialAuditAsync(string eventType, string resource, Guid callerUserId, bool isPrivileged, string reason, string? traceId, CancellationToken ct)
    {
        try
        {
            await _repo.WriteAuditAsync(eventType, "WARNING", callerUserId.ToString("D"), resource, new { reason, privileged = isPrivileged }, traceId, ct);
        }
        catch
        {
        }
    }
}
