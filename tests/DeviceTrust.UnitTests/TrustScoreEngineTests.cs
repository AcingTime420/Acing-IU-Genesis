using AcingIU.DeviceTrust.Api.Models;
using AcingIU.DeviceTrust.Api.Services;
using Xunit;

namespace AcingIU.DeviceTrust.UnitTests;

public class TrustScoreEngineTests
{
    private readonly TrustScoreEngine _engine = new();

    private static TelemetrySubmitRequest Base(
        string selinux = "Enforcing",
        bool bootloader = true,
        bool partitions = true,
        bool knox = true,
        bool rooted = false) => new()
    {
        HwIdentifier = "TEST-HW-001",
        SocModel = "SM-TEST",
        SelinuxStatus = selinux,
        BootloaderLocked = bootloader,
        PartitionsUnmodified = partitions,
        KnoxWarrantyFuseIntact = knox,
        IsRooted = rooted
    };

    [Fact]
    public void All_positive_signals_score_100()
    {
        var (score, b) = _engine.Compute(Base());
        Assert.Equal(100, score);
        Assert.Equal(40, b.SelinuxPoints);
        Assert.Equal(30, b.BootloaderPoints);
        Assert.Equal(20, b.PartitionPoints);
        Assert.Equal(10, b.KnoxPoints);
        Assert.Equal(0, b.RootPenalty);
    }

    [Fact]
    public void Rooted_device_scores_zero()
    {
        var (score, b) = _engine.Compute(Base(rooted: true));
        Assert.Equal(0, score);
        Assert.Equal(-100, b.RootPenalty);
    }

    [Fact]
    public void Only_selinux_enforcing_scores_40()
    {
        var (score, _) = _engine.Compute(Base(
            selinux: "Enforcing",
            bootloader: false,
            partitions: false,
            knox: false));
        Assert.Equal(40, score);
    }

    [Fact]
    public void Unknown_selinux_with_other_signals_scores_60()
    {
        var (score, _) = _engine.Compute(Base(
            selinux: "Unknown",
            bootloader: true,
            partitions: true,
            knox: true));
        Assert.Equal(60, score);
    }

    [Fact]
    public void Selinux_enforcing_is_case_insensitive()
    {
        var (score, b) = _engine.Compute(Base(selinux: "enforcing"));
        Assert.Equal(40, b.SelinuxPoints);
        Assert.Equal(100, score);
    }

    [Fact]
    public void Default_threshold_is_80()
    {
        Assert.Equal(80, TrustScoreEngine.DefaultThreshold);
    }
}
