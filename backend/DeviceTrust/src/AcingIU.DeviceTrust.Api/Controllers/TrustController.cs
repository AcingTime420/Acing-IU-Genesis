using System.Security.Claims;
using AcingIU.DeviceTrust.Api.Models;
using AcingIU.DeviceTrust.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcingIU.DeviceTrust.Api.Controllers;

[ApiController]
[Route("api/trust")]
[Produces("application/json")]
public sealed class TrustController : ControllerBase
{
    private readonly ITrustService _trust;

    public TrustController(ITrustService trust) => _trust = trust;

    /// <summary>Submit authenticated device telemetry and receive a computed trust score.</summary>
    [HttpPost("telemetry/submit")]
    [Authorize]
    [ProducesResponseType(typeof(TrustScoreResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> SubmitTelemetry([FromBody] TelemetrySubmitRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ProblemResult(400, "Validation failed", "Invalid telemetry payload.");

        var callerId = GetCallerId();
        if (!callerId.HasValue)
            return ProblemResult(401, "Unauthorized", "A valid subject identifier is required.");

        var existingOwnerId = await _trust.GetOwnerUserIdAsync(request.HwIdentifier, ct);
        if (existingOwnerId.HasValue && !CanAccess(existingOwnerId.Value, callerId.Value))
            return ProblemResult(404, "Not Found", "Device not registered.");

        var effectiveOwnerId = existingOwnerId ?? callerId;
        var result = await _trust.SubmitTelemetryAsync(request, effectiveOwnerId, HttpContext.TraceIdentifier, ct);
        return Ok(result);
    }

    /// <summary>Get a trust score for an authorized device owner or privileged operator.</summary>
    [HttpGet("devices/{hwId}")]
    [Authorize]
    [ProducesResponseType(typeof(TrustScoreResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDevice(string hwId, CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (!callerId.HasValue)
            return ProblemResult(401, "Unauthorized", "A valid subject identifier is required.");

        var ownerId = await _trust.GetOwnerUserIdAsync(hwId, ct);
        if (!ownerId.HasValue || !CanAccess(ownerId.Value, callerId.Value))
            return ProblemResult(404, "Not Found", "Device not registered.");

        var device = await _trust.GetDeviceAsync(hwId, ct);
        if (device is null)
            return ProblemResult(404, "Not Found", "Device not registered.");

        var threshold = TrustScoreEngine.DefaultThreshold;
        device.Threshold = threshold;
        device.Allowed = device.TrustScore >= threshold;
        return Ok(device);
    }

    /// <summary>List recently seen devices for privileged operational roles.</summary>
    [HttpGet("devices")]
    [Authorize(Roles = "Admin,Operator")]
    [ProducesResponseType(typeof(IReadOnlyList<DeviceListItem>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListDevices(CancellationToken ct)
    {
        var list = await _trust.ListDevicesAsync(ct);
        return Ok(list);
    }

    private Guid? GetCallerId()
    {
        var subject = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(subject, out var userId) ? userId : null;
    }

    private bool CanAccess(Guid ownerId, Guid callerId) =>
        ownerId == callerId || User.IsInRole("Admin") || User.IsInRole("Operator");

    private ObjectResult ProblemResult(int status, string title, string detail) =>
        StatusCode(status, new ProblemBody
        {
            Type = $"https://acing.iu/problems/{status}",
            Title = title,
            Status = status,
            Detail = detail,
            TraceId = HttpContext.TraceIdentifier
        });
}
