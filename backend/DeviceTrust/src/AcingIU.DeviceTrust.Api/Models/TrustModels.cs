using System.ComponentModel.DataAnnotations;

namespace AcingIU.DeviceTrust.Api.Models;

public sealed class TelemetrySubmitRequest
{
    [Required, MaxLength(100)]
    public string HwIdentifier { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string SocModel { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string SelinuxStatus { get; set; } = "Enforcing";

    public bool BootloaderLocked { get; set; } = true;
    public bool PartitionsUnmodified { get; set; } = true;
    public bool KnoxWarrantyFuseIntact { get; set; } = true;
    public bool IsRooted { get; set; } = false;
}

public sealed class TrustScoreResponse
{
    public Guid DeviceId { get; set; }
    public string HwIdentifier { get; set; } = string.Empty;
    public string SocModel { get; set; } = string.Empty;
    public int TrustScore { get; set; }
    public bool Allowed { get; set; }
    public int Threshold { get; set; }
    public TrustBreakdown Breakdown { get; set; } = new();
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class TrustBreakdown
{
    public int SelinuxPoints { get; set; }
    public int BootloaderPoints { get; set; }
    public int PartitionPoints { get; set; }
    public int KnoxPoints { get; set; }
    public int RootPenalty { get; set; }
}

public sealed class DeviceListItem
{
    public Guid Id { get; set; }
    public string HwIdentifier { get; set; } = string.Empty;
    public string SocModel { get; set; } = string.Empty;
    public int TrustScore { get; set; }
    public string SelinuxStatus { get; set; } = string.Empty;
    public bool KnoxWarrantyFuseBlown { get; set; }
    public DateTimeOffset? LastSeenAt { get; set; }
}

public sealed class DeviceOwnershipRecord
{
    public TrustScoreResponse Response { get; set; } = new();
    public Guid? OwnerUserId { get; set; }
}

public enum DeviceAccessOutcome
{
    NotFound,
    Allowed
}

public sealed class DeviceAccessResult
{
    public DeviceAccessOutcome Outcome { get; init; }
    public TrustScoreResponse? Device { get; init; }

    public static DeviceAccessResult NotFound() => new() { Outcome = DeviceAccessOutcome.NotFound };
    public static DeviceAccessResult Ok(TrustScoreResponse device) =>
        new() { Outcome = DeviceAccessOutcome.Allowed, Device = device };
}

/// <summary>
/// Repository-level telemetry mutation outcome. Rejected covers unknown device,
/// cross-owner, and null-owner non-privileged — no ownership data is exposed.
/// </summary>
public enum TelemetryMutationOutcome
{
    Updated,
    Rejected
}

public sealed class TelemetryMutationResult
{
    public TelemetryMutationOutcome Outcome { get; init; }
    public TrustScoreResponse? Device { get; init; }

    public static TelemetryMutationResult Updated(TrustScoreResponse device) =>
        new() { Outcome = TelemetryMutationOutcome.Updated, Device = device };

    public static TelemetryMutationResult Rejected() =>
        new() { Outcome = TelemetryMutationOutcome.Rejected };
}

public sealed class TelemetrySubmitResult
{
    public DeviceAccessOutcome Outcome { get; init; }
    public TrustScoreResponse? Device { get; init; }

    public static TelemetrySubmitResult NotFound() => new() { Outcome = DeviceAccessOutcome.NotFound };
    public static TelemetrySubmitResult Ok(TrustScoreResponse device) =>
        new() { Outcome = DeviceAccessOutcome.Allowed, Device = device };
}

public sealed class ProblemBody
{
    public string Type { get; set; } = "about:blank";
    public string Title { get; set; } = string.Empty;
    public int Status { get; set; }
    public string? Detail { get; set; }
    public string? TraceId { get; set; }
}
