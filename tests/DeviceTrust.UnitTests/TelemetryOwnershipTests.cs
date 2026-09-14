using AcingIU.DeviceTrust.Api.Models;
using AcingIU.DeviceTrust.Api.Services;
using Xunit;

namespace AcingIU.DeviceTrust.UnitTests;

public class TelemetryOwnershipTests
{
    private static readonly Guid OwnerA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid OwnerB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid AdminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private const string Hw = "HW-TELEMETRY-1";

    private static TelemetrySubmitRequest Req(string hw = Hw) => new()
    {
        HwIdentifier = hw,
        SocModel = "SM-TEST",
        SelinuxStatus = "Enforcing",
        BootloaderLocked = true,
        PartitionsUnmodified = true,
        KnoxWarrantyFuseIntact = true,
        IsRooted = false
    };

    private static TrustService Svc(FakeDeviceRepository repo) => new(repo, new TrustScoreEngine());

    [Fact]
    public async Task Owner_can_update_own_device_telemetry()
    {
        var repo = new FakeDeviceRepository
        {
            Record = new DeviceOwnershipRecord
            {
                OwnerUserId = OwnerA,
                Response = new TrustScoreResponse
                {
                    DeviceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    HwIdentifier = Hw,
                    SocModel = "SM-OLD",
                    TrustScore = 40,
                    UpdatedAt = DateTimeOffset.UtcNow
                }
            }
        };

        var result = await Svc(repo).SubmitTelemetryAsync(Req(), OwnerA, isPrivileged: false, null, default);

        Assert.Equal(DeviceAccessOutcome.Allowed, result.Outcome);
        Assert.NotNull(result.Device);
        Assert.Single(repo.Upserts);
        Assert.Equal(OwnerA, repo.Record!.OwnerUserId); // preserved
    }

    [Fact]
    public async Task Cross_owner_telemetry_update_denied()
    {
        var repo = new FakeDeviceRepository
        {
            Record = new DeviceOwnershipRecord
            {
                OwnerUserId = OwnerB,
                Response = new TrustScoreResponse
                {
                    DeviceId = Guid.NewGuid(),
                    HwIdentifier = Hw,
                    SocModel = "SM-TEST",
                    TrustScore = 90,
                    UpdatedAt = DateTimeOffset.UtcNow
                }
            }
        };

        var result = await Svc(repo).SubmitTelemetryAsync(Req(), OwnerA, isPrivileged: false, null, default);

        Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
        Assert.Empty(repo.Upserts);
        Assert.Equal(90, repo.Record!.Response.TrustScore); // unchanged
    }

    [Fact]
    public async Task Unknown_hw_registers_as_new_with_caller_owner()
    {
        var repo = new FakeDeviceRepository { Record = null };

        var result = await Svc(repo).SubmitTelemetryAsync(Req(), OwnerA, isPrivileged: false, null, default);

        Assert.Equal(DeviceAccessOutcome.Allowed, result.Outcome);
        Assert.Equal(OwnerA, repo.Record!.OwnerUserId);
        Assert.Single(repo.Upserts);
    }

    [Fact]
    public async Task Null_owner_legacy_row_denied_to_non_privileged()
    {
        var repo = new FakeDeviceRepository
        {
            Record = new DeviceOwnershipRecord
            {
                OwnerUserId = null,
                Response = new TrustScoreResponse
                {
                    DeviceId = Guid.NewGuid(),
                    HwIdentifier = Hw,
                    SocModel = "SM-TEST",
                    TrustScore = 50,
                    UpdatedAt = DateTimeOffset.UtcNow
                }
            }
        };

        var result = await Svc(repo).SubmitTelemetryAsync(Req(), OwnerA, isPrivileged: false, null, default);

        Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
        Assert.Empty(repo.Upserts);
    }

    [Fact]
    public async Task Privileged_admin_can_update_telemetry_without_reassigning_owner()
    {
        var repo = new FakeDeviceRepository
        {
            Record = new DeviceOwnershipRecord
            {
                OwnerUserId = OwnerB,
                Response = new TrustScoreResponse
                {
                    DeviceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    HwIdentifier = Hw,
                    SocModel = "SM-TEST",
                    TrustScore = 10,
                    UpdatedAt = DateTimeOffset.UtcNow
                }
            }
        };

        var result = await Svc(repo).SubmitTelemetryAsync(Req(), AdminId, isPrivileged: true, null, default);

        Assert.Equal(DeviceAccessOutcome.Allowed, result.Outcome);
        Assert.Equal(OwnerB, repo.Record!.OwnerUserId); // not reassigned to Admin
    }

    [Fact]
    public async Task Cross_owner_and_unknown_share_not_found_outcome()
    {
        var cross = await Svc(new FakeDeviceRepository
        {
            Record = new DeviceOwnershipRecord
            {
                OwnerUserId = OwnerB,
                Response = new TrustScoreResponse { HwIdentifier = Hw, TrustScore = 90, DeviceId = Guid.NewGuid(), SocModel = "S", UpdatedAt = DateTimeOffset.UtcNow }
            }
        }).SubmitTelemetryAsync(Req(), OwnerA, false, null, default);

        var miss = await Svc(new FakeDeviceRepository { Record = null })
            .SubmitTelemetryAsync(Req("HW-UNKNOWN"), OwnerA, false, null, default);

        // Unknown registers successfully (new device); cross-owner is NotFound.
        Assert.Equal(DeviceAccessOutcome.NotFound, cross.Outcome);
        Assert.Equal(DeviceAccessOutcome.Allowed, miss.Outcome);
    }

    [Fact]
    public async Task Audit_failure_on_cross_owner_still_returns_not_found()
    {
        var repo = new FakeDeviceRepository
        {
            FailAuditWrites = true,
            Record = new DeviceOwnershipRecord
            {
                OwnerUserId = OwnerB,
                Response = new TrustScoreResponse
                {
                    DeviceId = Guid.NewGuid(),
                    HwIdentifier = Hw,
                    SocModel = "SM-TEST",
                    TrustScore = 90,
                    UpdatedAt = DateTimeOffset.UtcNow
                }
            }
        };

        var result = await Svc(repo).SubmitTelemetryAsync(Req(), OwnerA, false, null, default);
        Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
    }
}

public class AuditFailureAndThresholdTests
{
    private static readonly Guid OwnerA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid OwnerB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private const string Hw = "HW-OWNER-A";

    [Fact]
    public async Task GetDevice_audit_failure_still_returns_not_found_like_unknown()
    {
        var crossRepo = new FakeDeviceRepository
        {
            FailAuditWrites = true,
            Record = new DeviceOwnershipRecord
            {
                OwnerUserId = OwnerB,
                Response = new TrustScoreResponse
                {
                    DeviceId = Guid.NewGuid(),
                    HwIdentifier = Hw,
                    SocModel = "SM-TEST",
                    TrustScore = 90,
                    UpdatedAt = DateTimeOffset.UtcNow
                }
            }
        };
        var missRepo = new FakeDeviceRepository { FailAuditWrites = true, Record = null };

        var cross = await new TrustService(crossRepo, new TrustScoreEngine())
            .GetDeviceForCallerAsync(Hw, OwnerA, false, null, default);
        var miss = await new TrustService(missRepo, new TrustScoreEngine())
            .GetDeviceForCallerAsync("HW-MISS", OwnerA, false, null, default);

        Assert.Equal(DeviceAccessOutcome.NotFound, cross.Outcome);
        Assert.Equal(cross.Outcome, miss.Outcome);
        Assert.Null(cross.Device);
        Assert.Null(miss.Device);
    }

    [Fact]
    public async Task GetDevice_uses_configured_threshold_not_only_default()
    {
        var repo = new FakeDeviceRepository
        {
            ConfiguredThreshold = 95, // differs from DefaultThreshold (80)
            Record = new DeviceOwnershipRecord
            {
                OwnerUserId = OwnerA,
                Response = new TrustScoreResponse
                {
                    DeviceId = Guid.NewGuid(),
                    HwIdentifier = Hw,
                    SocModel = "SM-TEST",
                    TrustScore = 90,
                    UpdatedAt = DateTimeOffset.UtcNow
                }
            }
        };

        var result = await new TrustService(repo, new TrustScoreEngine())
            .GetDeviceForCallerAsync(Hw, OwnerA, false, null, default);

        Assert.Equal(DeviceAccessOutcome.Allowed, result.Outcome);
        Assert.Equal(95, result.Device!.Threshold);
        Assert.False(result.Device.Allowed); // 90 < 95
    }
}
