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

    private static DeviceOwnershipRecord Seed(Guid? owner, string hw = Hw, int score = 40) => new()
    {
        OwnerUserId = owner,
        Response = new TrustScoreResponse
        {
            DeviceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            HwIdentifier = hw,
            SocModel = "SM-OLD",
            TrustScore = score,
            UpdatedAt = DateTimeOffset.UtcNow
        }
    };

    [Fact]
    public async Task Owner_can_update_enrolled_device()
    {
        var repo = new FakeDeviceRepository { Record = Seed(OwnerA) };
        var result = await Svc(repo).SubmitTelemetryAsync(Req(), OwnerA, false, null, default);
        Assert.Equal(DeviceAccessOutcome.Allowed, result.Outcome);
        Assert.Equal(OwnerA, repo.Record!.OwnerUserId);
        Assert.Contains(repo.Audits, a => a.EventType == "trust.telemetry.submit" && a.Resource == "/api/trust/telemetry/submit");
    }

    [Fact]
    public async Task Cross_owner_update_rejected()
    {
        var repo = new FakeDeviceRepository { Record = Seed(OwnerB, score: 90) };
        var result = await Svc(repo).SubmitTelemetryAsync(Req(), OwnerA, false, null, default);
        Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
        Assert.Equal(90, repo.Record!.Response.TrustScore);
        Assert.Contains(repo.Audits, a =>
            a.EventType == "trust.telemetry.access_denied" && a.Resource == "/api/trust/telemetry/submit");
    }

    [Fact]
    public async Task Unknown_device_rejected_no_enrollment()
    {
        var repo = new FakeDeviceRepository { Record = null };
        var result = await Svc(repo).SubmitTelemetryAsync(Req(), OwnerA, false, null, default);
        Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
        Assert.Null(repo.Record);
        Assert.Single(repo.MutationAttempts);
    }

    [Fact]
    public async Task Null_owner_legacy_denied_to_non_privileged()
    {
        var repo = new FakeDeviceRepository { Record = Seed(null) };
        var result = await Svc(repo).SubmitTelemetryAsync(Req(), OwnerA, false, null, default);
        Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
    }

    [Fact]
    public async Task Privileged_can_update_without_reassigning_owner()
    {
        var repo = new FakeDeviceRepository { Record = Seed(OwnerB) };
        var result = await Svc(repo).SubmitTelemetryAsync(Req(), AdminId, true, null, default);
        Assert.Equal(DeviceAccessOutcome.Allowed, result.Outcome);
        Assert.Equal(OwnerB, repo.Record!.OwnerUserId);
    }

    [Fact]
    public async Task Success_audit_failure_propagates_no_200()
    {
        var repo = new FakeDeviceRepository { Record = Seed(OwnerA), FailSuccessAudit = true };
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Svc(repo).SubmitTelemetryAsync(Req(), OwnerA, false, null, default));
        // Score not committed in real DB; fake throws before mutate completes after check —
        // Fake throws after authz passes; ensure no success audit recorded.
        Assert.DoesNotContain(repo.Audits, a => a.EventType == "trust.telemetry.submit");
    }

    [Fact]
    public async Task Denial_audit_failure_still_returns_not_found()
    {
        var repo = new FakeDeviceRepository { Record = Seed(OwnerB), FailDenialAudit = true };
        var result = await Svc(repo).SubmitTelemetryAsync(Req(), OwnerA, false, null, default);
        Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
    }

    [Fact]
    public async Task Concurrent_callers_on_unenrolled_both_rejected()
    {
        // Models fail-closed enrollment: neither concurrent submitter can create the row.
        var repo = new FakeDeviceRepository { Record = null };
        var svc = Svc(repo);
        var t1 = svc.SubmitTelemetryAsync(Req(), OwnerA, false, null, default);
        var t2 = svc.SubmitTelemetryAsync(Req(), OwnerB, false, null, default);
        var results = await Task.WhenAll(t1, t2);
        Assert.All(results, r => Assert.Equal(DeviceAccessOutcome.NotFound, r.Outcome));
        Assert.Null(repo.Record);
    }

    [Fact]
    public async Task Concurrent_owner_and_cross_owner_only_owner_mutates()
    {
        var repo = new FakeDeviceRepository { Record = Seed(OwnerA, score: 10) };
        var svc = Svc(repo);
        var tOwner = svc.SubmitTelemetryAsync(Req(), OwnerA, false, null, default);
        var tOther = svc.SubmitTelemetryAsync(Req(), OwnerB, false, null, default);
        var results = await Task.WhenAll(tOwner, tOther);
        Assert.Contains(results, r => r.Outcome == DeviceAccessOutcome.Allowed);
        Assert.Contains(results, r => r.Outcome == DeviceAccessOutcome.NotFound);
        Assert.Equal(OwnerA, repo.Record!.OwnerUserId);
    }
}

public class ReadDenialAuditAttributionTests
{
    private static readonly Guid OwnerA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid OwnerB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public async Task Read_denial_uses_devices_resource_and_event()
    {
        var repo = new FakeDeviceRepository
        {
            Record = new DeviceOwnershipRecord
            {
                OwnerUserId = OwnerB,
                Response = new TrustScoreResponse
                {
                    DeviceId = Guid.NewGuid(),
                    HwIdentifier = "HW-X",
                    SocModel = "S",
                    TrustScore = 90,
                    UpdatedAt = DateTimeOffset.UtcNow
                }
            }
        };
        await new TrustService(repo, new TrustScoreEngine())
            .GetDeviceForCallerAsync("HW-X", OwnerA, false, null, default);

        Assert.Contains(repo.Audits, a =>
            a.EventType == "trust.device.access_denied" && a.Resource == "/api/trust/devices");
    }
}
