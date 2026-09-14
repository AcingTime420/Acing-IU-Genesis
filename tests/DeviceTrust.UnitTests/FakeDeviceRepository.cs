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
    public List<(Guid? Owner, string Hw, int Score)> Upserts { get; } = new();
    public bool FailAuditWrites { get; set; }
    public int ConfiguredThreshold { get; set; } = TrustScoreEngine.DefaultThreshold;

    public Task<TrustScoreResponse> UpsertTelemetryAsync(
        TelemetrySubmitRequest req, int score, Guid? ownerUserId, CancellationToken ct = default)
    {
        Upserts.Add((ownerUserId, req.HwIdentifier, score));

        // Simulate ON CONFLICT: preserve existing owner when row exists.
        Guid? effectiveOwner = ownerUserId;
        Guid deviceId = Guid.NewGuid();
        if (Record is not null &&
            string.Equals(Record.Response.HwIdentifier, req.HwIdentifier, StringComparison.Ordinal))
        {
            effectiveOwner = Record.OwnerUserId; // never reassign on ordinary upsert
            deviceId = Record.Response.DeviceId;
        }

        var response = new TrustScoreResponse
        {
            DeviceId = deviceId,
            HwIdentifier = req.HwIdentifier,
            SocModel = req.SocModel,
            TrustScore = score,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        Record = new DeviceOwnershipRecord { Response = response, OwnerUserId = effectiveOwner };
        return Task.FromResult(response);
    }

    public Task<DeviceOwnershipRecord?> GetByHwIdAsync(string hwId, CancellationToken ct = default)
    {
        if (Record is null)
            return Task.FromResult<DeviceOwnershipRecord?>(null);

        if (!string.Equals(Record.Response.HwIdentifier, hwId, StringComparison.Ordinal))
            return Task.FromResult<DeviceOwnershipRecord?>(null);

        return Task.FromResult<DeviceOwnershipRecord?>(Record);
    }

    public Task<IReadOnlyList<DeviceListItem>> ListAsync(int limit = 50, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<DeviceListItem>>(Array.Empty<DeviceListItem>());

    public Task WriteAuditAsync(
        string eventType, string severity, string actor, string? resource, object? payload, string? traceId, CancellationToken ct = default)
    {
        if (FailAuditWrites)
            throw new InvalidOperationException("Simulated audit storage failure");

        if (eventType == "trust.device.access_denied")
        {
            var json = payload is null ? null : System.Text.Json.JsonSerializer.Serialize(payload);
            DeniedAudits.Add((eventType, json ?? ""));
        }
        return Task.CompletedTask;
    }

    public Task<int> GetTrustThresholdAsync(CancellationToken ct = default) =>
        Task.FromResult(ConfiguredThreshold);
}
