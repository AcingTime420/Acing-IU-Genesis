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

    /// <summary>Submit device telemetry and receive computed trust score.</summary>
    [HttpPost("telemetry/submit")]
    [Authorize]
    [ProducesResponseType(typeof(TrustScoreResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> SubmitTelemetry([FromBody] TelemetrySubmitRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ProblemResult(400, "Validation failed", "Invalid telemetry payload.");

        Guid? owner = null;
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (Guid.TryParse(sub, out var uid)) owner = uid;

        var result = await _trust.SubmitTelemetryAsync(request, owner, HttpContext.TraceIdentifier, ct);
        return Ok(result);
    }

    /// <summary>Get trust score for a hardware identifier.</summary>
    [HttpGet("devices/{hwId}")]
    [Authorize]
    [ProducesResponseType(typeof(TrustScoreResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDevice(string hwId, CancellationToken ct)
    {
        var device = await _trust.GetDeviceAsync(hwId, ct);
        if (device is null)
            return ProblemResult(404, "Not Found", "Device not registered.");

        var threshold = TrustScoreEngine.DefaultThreshold;
        device.Threshold = threshold;
        device.Allowed = device.TrustScore >= threshold;
        return Ok(device);
    }

    /// <summary>List recently seen devices.</summary>
    [HttpGet("devices")]
    [Authorize(Roles = "Admin,Operator")]
    [ProducesResponseType(typeof(IReadOnlyList<DeviceListItem>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListDevices(CancellationToken ct)
    {
        var list = await _trust.ListDevicesAsync(ct);
        return Ok(list);
    }

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
