using AcingIU.DeviceTrust.Api.Data;
using AcingIU.DeviceTrust.Api.Models;

namespace AcingIU.DeviceTrust.Api.Services;

public interface ITrustService
{
    Task<TrustScoreResponse> SubmitTelemetryAsync(TelemetrySubmitRequest req, Guid? ownerUserId, string? traceId, CancellationToken ct = default);
    Task<TrustScoreResponse?> GetDeviceAsync(string hwId, CancellationToken ct = default);
    Task<Guid?> GetOwnerUserIdAsync(string hwId, CancellationToken ct = default);
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
            ownerUserId?.ToString() ?? req.HwIdentifier,
            "/api/trust/telemetry/submit",
            new { req.HwIdentifier, score, threshold, result.Allowed },
            traceId,
            ct);

        return result;
    }

    public Task<TrustScoreResponse?> GetDeviceAsync(string hwId, CancellationToken ct = default) =>
        _repo.GetByHwIdAsync(hwId, ct);

    public Task<Guid?> GetOwnerUserIdAsync(string hwId, CancellationToken ct = default) =>
        _repo.GetOwnerUserIdAsync(hwId, ct);

    public Task<IReadOnlyList<DeviceListItem>> ListDevicesAsync(CancellationToken ct = default) =>
        _repo.ListAsync(50, ct);
}
