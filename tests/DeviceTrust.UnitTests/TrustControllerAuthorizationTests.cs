using System.Security.Claims;
using AcingIU.DeviceTrust.Api.Controllers;
using AcingIU.DeviceTrust.Api.Models;
using AcingIU.DeviceTrust.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace AcingIU.DeviceTrust.UnitTests;

public sealed class TrustControllerAuthorizationTests
{
    [Fact]
    public async Task GetDevice_AllowsTheRecordedOwner()
    {
        var ownerId = Guid.NewGuid();
        var controller = CreateController(new StubTrustService(ownerId), ownerId, "User");

        var result = await controller.GetDevice("device-owner", CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetDevice_ReturnsSafeNotFoundForDifferentAuthenticatedUser()
    {
        var controller = CreateController(new StubTrustService(Guid.NewGuid()), Guid.NewGuid(), "User");

        var result = await controller.GetDevice("device-protected", CancellationToken.None);

        var notFound = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status404NotFound, notFound.StatusCode);
    }

    [Theory]
    [InlineData("Admin")]
    [InlineData("Operator")]
    public async Task GetDevice_AllowsApprovedPrivilegedRolesAcrossOwners(string role)
    {
        var controller = CreateController(new StubTrustService(Guid.NewGuid()), Guid.NewGuid(), role);

        var result = await controller.GetDevice("device-privileged", CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    private static TrustController CreateController(ITrustService trust, Guid callerId, string role)
    {
        var context = new DefaultHttpContext();
        context.TraceIdentifier = "test-trace";
        context.User = new ClaimsPrincipal(new ClaimsIdentity(
            new[]
            {
                new Claim(ClaimTypes.NameIdentifier, callerId.ToString()),
                new Claim(ClaimTypes.Role, role)
            },
            "test"));

        return new TrustController(trust)
        {
            ControllerContext = new ControllerContext { HttpContext = context }
        };
    }

    private sealed class StubTrustService : ITrustService
    {
        private readonly Guid _ownerId;

        public StubTrustService(Guid ownerId) => _ownerId = ownerId;

        public Task<TrustScoreResponse> SubmitTelemetryAsync(TelemetrySubmitRequest req, Guid? ownerUserId, string? traceId, CancellationToken ct = default) =>
            Task.FromResult(new TrustScoreResponse());

        public Task<TrustScoreResponse?> GetDeviceAsync(string hwId, CancellationToken ct = default) =>
            Task.FromResult<TrustScoreResponse?>(new TrustScoreResponse { HwIdentifier = hwId, TrustScore = 90 });

        public Task<Guid?> GetOwnerUserIdAsync(string hwId, CancellationToken ct = default) =>
            Task.FromResult<Guid?>(_ownerId);

        public Task<IReadOnlyList<DeviceListItem>> ListDevicesAsync(CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<DeviceListItem>>(Array.Empty<DeviceListItem>());
    }
}
