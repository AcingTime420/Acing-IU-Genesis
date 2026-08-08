using AcingIU.DeviceTrust.Api.Models;

namespace AcingIU.DeviceTrust.Api.Services;

public interface ITrustScoreEngine
{
    (int Score, TrustBreakdown Breakdown) Compute(TelemetrySubmitRequest telemetry);
}

/// <summary>
/// Weighted trust score per Master Plan S3:
///   SELinux Enforcing: +40
///   Locked Bootloader: +30
///   Verifiably Unmodified Partitions: +20
///   Dynamic KNOX Fuse intact: +10
/// Rooted devices receive a full zeroing penalty for safety.
/// </summary>
public sealed class TrustScoreEngine : ITrustScoreEngine
{
    public const int DefaultThreshold = 80;

    public (int Score, TrustBreakdown Breakdown) Compute(TelemetrySubmitRequest t)
    {
        var b = new TrustBreakdown();

        if (t.IsRooted)
        {
            b.RootPenalty = -100;
            return (0, b);
        }

        if (string.Equals(t.SelinuxStatus, "Enforcing", StringComparison.OrdinalIgnoreCase))
            b.SelinuxPoints = 40;

        if (t.BootloaderLocked)
            b.BootloaderPoints = 30;

        if (t.PartitionsUnmodified)
            b.PartitionPoints = 20;

        if (t.KnoxWarrantyFuseIntact)
            b.KnoxPoints = 10;

        var score = b.SelinuxPoints + b.BootloaderPoints + b.PartitionPoints + b.KnoxPoints;
        score = Math.Clamp(score, 0, 100);
        return (score, b);
    }
}
