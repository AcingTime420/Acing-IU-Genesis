using AcingIU.DeviceTrust.Api.Data;
using AcingIU.DeviceTrust.Api.Models;
using AcingIU.DeviceTrust.Api.Services;

namespace AcingIU.DeviceTrust.UnitTests;

/// <summary>
/// In-memory repository for unit and WebApplicationFactory tests.
/// Returns a record only when the requested hwId exactly matches (ordinal).
/// </summary>
public sealed class FakeDeviceRepository : IDeviceRepository
{
    public DeviceOwnershipRecord? Record { get; set; }
    public List<(string EventType, string PayloadJson)> DeniedAudits { get; } = new();
    public List<(Guid? Owner, string Hw)> Upserts { get; } = new();

    public Task<TrustScoreResponse> UpsertTelemetryAsync(
        TelemetrySubmitRequest req, int score, Guid? ownerUserId, CancellationToken ct = default)
    {
        Upserts.Add((ownerUserId, req.HwIdentifier));
        var response = new TrustScoreResponse
        {
            DeviceId = Guid.NewGuid(),
            HwIdentifier = req.HwIdentifier,
            SocModel = req.SocModel,
            TrustScore = score,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        Record = new DeviceOwnershipRecord { Response = response, OwnerUserId = ownerUserId };
        return Task.FromResult(response);
    }

    public Task<DeviceOwnershipRecord?> GetByHwIdAsync(string hwId, CancellationToken ct = default)
    {
        if (Record is null)
            return Task.FromResult<DeviceOwnershipRecord?>(null);

        // Exact ordinal match only — no length bypass, no case folding.
        if (!string.Equals(Record.Response.HwIdentifier, hwId, StringComparison.Ordinal))
            return Task.FromResult<DeviceOwnershipRecord?>(null);

        return Task.FromResult<DeviceOwnershipRecord?>(Record);
    }

    public Task<IReadOnlyList<DeviceListItem>> ListAsync(int limit = 50, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<DeviceListItem>>(Array.Empty<DeviceListItem>());

    public Task WriteAuditAsync(
        string eventType, string severity, string actor, string? resource, object? payload, string? traceId, CancellationToken ct = default)
    {
        if (eventType == "trust.device.access_denied")
        {
            var json = payload is null ? null : System.Text.Json.JsonSerializer.Serialize(payload);
            DeniedAudits.Add((eventType, json ?? ""));
        }
        return Task.CompletedTask;
    }

    public Task<int> GetTrustThresholdAsync(CancellationToken ct = default) =>
        Task.FromResult(TrustScoreEngine.DefaultThreshold);
}
