using AcingIU.DeviceTrust.Api.Data;
using AcingIU.DeviceTrust.Api.Models;
using AcingIU.DeviceTrust.Api.Services;

namespace AcingIU.DeviceTrust.UnitTests;

/// <summary>
/// In-memory repository modeling atomic authorized UPDATE (no INSERT on telemetry).
/// </summary>
public sealed class FakeDeviceRepository : IDeviceRepository
{
    public DeviceOwnershipRecord? Record { get; set; }
    public List<(string EventType, string Resource, string PayloadJson)> Audits { get; } = new();
    public List<(Guid Caller, bool Privileged, string Hw)> MutationAttempts { get; } = new();
    public bool FailSuccessAudit { get; set; }
    public bool FailDenialAudit { get; set; }
    public int ConfiguredThreshold { get; set; } = TrustScoreEngine.DefaultThreshold;

    public Task<TelemetryMutationResult> TryAuthorizedTelemetryUpdateWithAuditAsync(
        TelemetrySubmitRequest req,
        int score,
        Guid callerUserId,
        bool isPrivileged,
        int threshold,
        bool scoreAllowed,
        string? traceId,
        CancellationToken ct = default)
    {
        MutationAttempts.Add((callerUserId, isPrivileged, req.HwIdentifier));

        if (Record is null ||
            !string.Equals(Record.Response.HwIdentifier, req.HwIdentifier, StringComparison.Ordinal))
        {
            // Unknown / unenrolled — no insert.
            return Task.FromResult(TelemetryMutationResult.Rejected());
        }

        var isOwner = Record.OwnerUserId.HasValue && Record.OwnerUserId.Value == callerUserId;
        if (!isPrivileged && !isOwner)
            return Task.FromResult(TelemetryMutationResult.Rejected());

        if (FailSuccessAudit)
            throw new InvalidOperationException("Simulated success-audit failure");

        // Atomic success: mutate + audit together.
        Record.Response.SocModel = req.SocModel;
        Record.Response.TrustScore = score;
        Record.Response.UpdatedAt = DateTimeOffset.UtcNow;
        Record.Response.Threshold = threshold;
        Record.Response.Allowed = scoreAllowed;
        // Owner never reassigned.

        Audits.Add(("trust.telemetry.submit", "/api/trust/telemetry/submit",
            System.Text.Json.JsonSerializer.Serialize(new { deviceId = Record.Response.DeviceId, score, threshold, allowed = scoreAllowed })));

        return Task.FromResult(TelemetryMutationResult.Updated(new TrustScoreResponse
        {
            DeviceId = Record.Response.DeviceId,
            HwIdentifier = Record.Response.HwIdentifier,
            SocModel = Record.Response.SocModel,
            TrustScore = Record.Response.TrustScore,
            Threshold = threshold,
            Allowed = scoreAllowed,
            UpdatedAt = Record.Response.UpdatedAt
        }));
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
        if (FailDenialAudit)
            throw new InvalidOperationException("Simulated denial-audit failure");

        var json = payload is null ? "" : System.Text.Json.JsonSerializer.Serialize(payload);
        Audits.Add((eventType, resource ?? "", json));
        return Task.CompletedTask;
    }

    public Task<int> GetTrustThresholdAsync(CancellationToken ct = default) =>
        Task.FromResult(ConfiguredThreshold);
}
