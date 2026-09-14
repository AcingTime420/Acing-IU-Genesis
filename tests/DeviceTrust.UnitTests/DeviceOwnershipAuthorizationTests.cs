using System.Security.Claims;
using AcingIU.DeviceTrust.Api.Controllers;
using AcingIU.DeviceTrust.Api.Data;
using AcingIU.DeviceTrust.Api.Models;
using AcingIU.DeviceTrust.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace AcingIU.DeviceTrust.UnitTests;

/// <summary>
/// AUTHZ-04 object-level authorization tests for GET /api/trust/devices/{hwId}.
/// Authorization is enforced in TrustService; repository returns are not sufficient for access.
/// </summary>
public class DeviceOwnershipAuthorizationTests
{
    private static readonly Guid OwnerA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid OwnerB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid AdminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private const string OwnedHw = "HW-OWNER-A";
    private const string UnknownHw = "HW-DOES-NOT-EXIST";

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
        var svc = CreateService(repo);

        var result = await svc.GetDeviceForCallerAsync(OwnedHw, OwnerA, isPrivileged: false, "t-owner", default);

        Assert.Equal(DeviceAccessOutcome.Allowed, result.Outcome);
        Assert.NotNull(result.Device);
        Assert.Equal(OwnedHw, result.Device!.HwIdentifier);
        Assert.Equal(90, result.Device.TrustScore);
        Assert.Empty(repo.DeniedAudits);
    }

    [Fact]
    public async Task User_A_cannot_retrieve_user_B_device()
    {
        var repo = new FakeDeviceRepository { Record = OwnedBy(OwnerB) };
        var svc = CreateService(repo);

        var result = await svc.GetDeviceForCallerAsync(OwnedHw, OwnerA, isPrivileged: false, "t-cross", default);

        Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
        Assert.Null(result.Device);
        Assert.Single(repo.DeniedAudits);
        Assert.Equal("trust.device.access_denied", repo.DeniedAudits[0].EventType);
        // Must not leak hardware identifier into audit payload
        Assert.DoesNotContain(OwnedHw, repo.DeniedAudits[0].PayloadJson ?? "", StringComparison.Ordinal);
    }

    [Fact]
    public async Task Unknown_device_returns_not_found()
    {
        var repo = new FakeDeviceRepository { Record = null };
        var svc = CreateService(repo);

        var result = await svc.GetDeviceForCallerAsync(UnknownHw, OwnerA, isPrivileged: false, "t-miss", default);

        Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
        Assert.Null(result.Device);
        Assert.Empty(repo.DeniedAudits);
    }

    [Fact]
    public async Task Cross_owner_and_unknown_share_not_found_outcome()
    {
        var cross = await CreateService(new FakeDeviceRepository { Record = OwnedBy(OwnerB) })
            .GetDeviceForCallerAsync(OwnedHw, OwnerA, false, null, default);
        var missing = await CreateService(new FakeDeviceRepository { Record = null })
            .GetDeviceForCallerAsync(UnknownHw, OwnerA, false, null, default);

        Assert.Equal(cross.Outcome, missing.Outcome);
        Assert.Equal(DeviceAccessOutcome.NotFound, cross.Outcome);
    }

    [Fact]
    public async Task Ordinary_user_does_not_get_admin_behavior_on_unowned_device()
    {
        var repo = new FakeDeviceRepository { Record = OwnedBy(OwnerB) };
        var svc = CreateService(repo);

        var asUser = await svc.GetDeviceForCallerAsync(OwnedHw, OwnerA, isPrivileged: false, null, default);
        var asAdmin = await svc.GetDeviceForCallerAsync(OwnedHw, AdminId, isPrivileged: true, null, default);

        Assert.Equal(DeviceAccessOutcome.NotFound, asUser.Outcome);
        Assert.Equal(DeviceAccessOutcome.Allowed, asAdmin.Outcome);
    }

    [Fact]
    public async Task Privileged_admin_can_retrieve_any_device()
    {
        var repo = new FakeDeviceRepository { Record = OwnedBy(OwnerB) };
        var svc = CreateService(repo);

        var result = await svc.GetDeviceForCallerAsync(OwnedHw, AdminId, isPrivileged: true, "t-admin", default);

        Assert.Equal(DeviceAccessOutcome.Allowed, result.Outcome);
        Assert.NotNull(result.Device);
        Assert.Empty(repo.DeniedAudits);
    }

    [Fact]
    public async Task Privileged_operator_can_retrieve_any_device()
    {
        var repo = new FakeDeviceRepository { Record = OwnedBy(OwnerA) };
        var svc = CreateService(repo);
        var operatorId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        var result = await svc.GetDeviceForCallerAsync(OwnedHw, operatorId, isPrivileged: true, "t-op", default);

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
        var svc = CreateService(repo);

        var result = await svc.GetDeviceForCallerAsync(OwnedHw, OwnerA, isPrivileged: false, null, default);

        Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
    }

    [Fact]
    public async Task Repository_row_alone_does_not_grant_access_without_service_check()
    {
        // Simulates a caller that obtained a repo row: service must still deny non-owners.
        var repo = new FakeDeviceRepository { Record = OwnedBy(OwnerB) };
        var record = await repo.GetByHwIdAsync(OwnedHw);
        Assert.NotNull(record); // data layer would return the row

        var svc = CreateService(repo);
        var result = await svc.GetDeviceForCallerAsync(OwnedHw, OwnerA, isPrivileged: false, null, default);
        Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
    }

    [Fact]
    public async Task Controller_missing_subject_returns_401()
    {
        var controller = CreateController(user: null);
        var result = await controller.GetDevice(OwnedHw, default);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(401, objectResult.StatusCode);
        var body = Assert.IsType<ProblemBody>(objectResult.Value);
        Assert.Equal("Invalid token subject.", body.Detail);
    }

    [Fact]
    public async Task Controller_malformed_subject_returns_401()
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("sub", "not-a-guid"),
            new Claim(ClaimTypes.Role, "User")
        }, authenticationType: "Bearer");
        var controller = CreateController(new ClaimsPrincipal(identity));

        var result = await controller.GetDevice(OwnedHw, default);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(401, objectResult.StatusCode);
    }

    [Fact]
    public async Task Controller_owner_receives_200()
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("sub", OwnerA.ToString("D")),
            new Claim(ClaimTypes.Role, "User")
        }, authenticationType: "Bearer");
        var controller = CreateController(new ClaimsPrincipal(identity), OwnedBy(OwnerA));

        var result = await controller.GetDevice(OwnedHw, default);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);
    }

    [Fact]
    public async Task Controller_cross_owner_receives_404_not_403()
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("sub", OwnerA.ToString("D")),
            new Claim(ClaimTypes.Role, "User")
        }, authenticationType: "Bearer");
        var controller = CreateController(new ClaimsPrincipal(identity), OwnedBy(OwnerB));

        var result = await controller.GetDevice(OwnedHw, default);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
        var body = Assert.IsType<ProblemBody>(objectResult.Value);
        Assert.Equal("Device not registered.", body.Detail);
    }

    [Fact]
    public async Task Controller_admin_role_can_read_unowned_device()
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("sub", AdminId.ToString("D")),
            new Claim(ClaimTypes.Role, "Admin")
        }, authenticationType: "Bearer");
        var controller = CreateController(new ClaimsPrincipal(identity), OwnedBy(OwnerB));

        var result = await controller.GetDevice(OwnedHw, default);

        Assert.IsType<OkObjectResult>(result);
    }

    private static TrustController CreateController(ClaimsPrincipal? user, DeviceOwnershipRecord? record = null)
    {
        var repo = new FakeDeviceRepository { Record = record };
        var svc = CreateService(repo);
        var controller = new TrustController(svc)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = user ?? new ClaimsPrincipal(new ClaimsIdentity()) // unauthenticated / no sub
                }
            }
        };
        return controller;
    }

    /// <summary>In-memory repository: returns configured ownership without DB.</summary>
    private sealed class FakeDeviceRepository : IDeviceRepository
    {
        public DeviceOwnershipRecord? Record { get; set; }
        public List<(string EventType, string PayloadJson)> DeniedAudits { get; } = new();

        public Task<TrustScoreResponse> UpsertTelemetryAsync(TelemetrySubmitRequest req, int score, Guid? ownerUserId, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<DeviceOwnershipRecord?> GetByHwIdAsync(string hwId, CancellationToken ct = default) =>
            Task.FromResult(Record is null ? null : Record.Response.HwIdentifier == hwId || Record.Response.HwIdentifier.Length > 0 ? Record : null);

        public Task<IReadOnlyList<DeviceListItem>> ListAsync(int limit = 50, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<DeviceListItem>>(Array.Empty<DeviceListItem>());

        public Task WriteAuditAsync(string eventType, string severity, string actor, string? resource, object? payload, string? traceId, CancellationToken ct = default)
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
}
