using System.Security.Claims;
using AcingIU.DeviceTrust.Api.Controllers;
using AcingIU.DeviceTrust.Api.Models;
using AcingIU.DeviceTrust.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace AcingIU.DeviceTrust.UnitTests;

public class DeviceOwnershipAuthorizationTests
{
    private static readonly Guid OwnerA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid OwnerB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid AdminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private const string OwnedHw = "HW-OWNER-A";
    private const string UnknownHw = "HW-DOES-NOT-EXIST";
    private const string OtherHw = "HW-OTHER-NONEMPTY";

    private static TrustService CreateService(FakeDeviceRepository repo) =>
        new(repo, new TrustScoreEngine());

    private static DeviceOwnershipRecord OwnedBy(Guid owner, string hw = OwnedHw) => new()
    {
        OwnerUserId = owner,
        Response = new TrustScoreResponse
        {
            DeviceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            HwIdentifier = hw,
            SocModel = "SM-TEST",
            TrustScore = 90,
            UpdatedAt = DateTimeOffset.UtcNow
        }
    };

    [Fact]
    public async Task Owner_can_retrieve_owned_device()
    {
        var repo = new FakeDeviceRepository { Record = OwnedBy(OwnerA) };
        var result = await CreateService(repo).GetDeviceForCallerAsync(OwnedHw, OwnerA, false, "t-owner", default);
        Assert.Equal(DeviceAccessOutcome.Allowed, result.Outcome);
        Assert.Equal(OwnedHw, result.Device!.HwIdentifier);
    }

    [Fact]
    public async Task User_A_cannot_retrieve_user_B_device()
    {
        var repo = new FakeDeviceRepository { Record = OwnedBy(OwnerB) };
        var result = await CreateService(repo).GetDeviceForCallerAsync(OwnedHw, OwnerA, false, "t-cross", default);
        Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
        Assert.Single(repo.DeniedAudits);
    }

    [Fact]
    public async Task Unknown_device_returns_not_found()
    {
        var result = await CreateService(new FakeDeviceRepository { Record = null })
            .GetDeviceForCallerAsync(UnknownHw, OwnerA, false, null, default);
        Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
    }

    [Fact]
    public async Task Cross_owner_and_unknown_share_not_found_outcome()
    {
        var cross = await CreateService(new FakeDeviceRepository { Record = OwnedBy(OwnerB) })
            .GetDeviceForCallerAsync(OwnedHw, OwnerA, false, null, default);
        var missing = await CreateService(new FakeDeviceRepository { Record = null })
            .GetDeviceForCallerAsync(UnknownHw, OwnerA, false, null, default);
        Assert.Equal(DeviceAccessOutcome.NotFound, cross.Outcome);
        Assert.Equal(cross.Outcome, missing.Outcome);
    }

    [Fact]
    public async Task Repository_returns_null_when_hwId_does_not_exactly_match()
    {
        var repo = new FakeDeviceRepository { Record = OwnedBy(OwnerA, OtherHw) };
        Assert.Null(await repo.GetByHwIdAsync(OwnedHw));
        Assert.NotNull(await repo.GetByHwIdAsync(OtherHw));
        Assert.Null(await repo.GetByHwIdAsync(OtherHw.ToLowerInvariant()));
    }

    [Fact]
    public async Task Privileged_admin_can_retrieve_any_device()
    {
        var result = await CreateService(new FakeDeviceRepository { Record = OwnedBy(OwnerB) })
            .GetDeviceForCallerAsync(OwnedHw, AdminId, true, null, default);
        Assert.Equal(DeviceAccessOutcome.Allowed, result.Outcome);
    }

    [Fact]
    public async Task Device_with_null_owner_denied_to_non_privileged()
    {
        var repo = new FakeDeviceRepository
        {
            Record = new DeviceOwnershipRecord
            {
                OwnerUserId = null,
                Response = new TrustScoreResponse
                {
                    DeviceId = Guid.NewGuid(),
                    HwIdentifier = OwnedHw,
                    SocModel = "SM-TEST",
                    TrustScore = 50,
                    UpdatedAt = DateTimeOffset.UtcNow
                }
            }
        };
        var result = await CreateService(repo).GetDeviceForCallerAsync(OwnedHw, OwnerA, false, null, default);
        Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
    }

    [Fact]
    public async Task Controller_missing_subject_returns_401()
    {
        var result = await CreateController(null).GetDevice(OwnedHw, default);
        Assert.Equal(401, Assert.IsType<ObjectResult>(result).StatusCode);
    }

    [Fact]
    public async Task Controller_malformed_subject_returns_401()
    {
        var identity = new ClaimsIdentity(new[] { new Claim("sub", "not-a-guid") }, "Bearer");
        var result = await CreateController(new ClaimsPrincipal(identity)).GetDevice(OwnedHw, default);
        Assert.Equal(401, Assert.IsType<ObjectResult>(result).StatusCode);
    }

    [Fact]
    public async Task Controller_cross_owner_receives_404_not_403()
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("sub", OwnerA.ToString("D")),
            new Claim(ClaimTypes.Role, "User")
        }, "Bearer");
        var result = await CreateController(new ClaimsPrincipal(identity), OwnedBy(OwnerB)).GetDevice(OwnedHw, default);
        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, obj.StatusCode);
        Assert.Equal("Device not registered.", Assert.IsType<ProblemBody>(obj.Value).Detail);
    }

    [Fact]
    public async Task SubmitTelemetry_missing_subject_returns_401()
    {
        var result = await CreateController(null).SubmitTelemetry(new TelemetrySubmitRequest
        {
            HwIdentifier = OwnedHw,
            SocModel = "SM-TEST",
            SelinuxStatus = "Enforcing"
        }, default);
        Assert.Equal(401, Assert.IsType<ObjectResult>(result).StatusCode);
    }

    private static TrustController CreateController(ClaimsPrincipal? user, DeviceOwnershipRecord? record = null)
    {
        var repo = new FakeDeviceRepository { Record = record };
        return new TrustController(CreateService(repo))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = user ?? new ClaimsPrincipal(new ClaimsIdentity())
                }
            }
        };
    }
}
