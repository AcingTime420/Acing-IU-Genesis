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

    /// <summary>Submit telemetry for an enrolled device; unknown devices are not enrolled.</summary>
    [HttpPost("telemetry/submit")]
    [Authorize]
    [ProducesResponseType(typeof(TrustScoreResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemBody), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemBody), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemBody), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SubmitTelemetry([FromBody] TelemetrySubmitRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ProblemResult(400, "Validation failed", "Invalid telemetry payload.");

        if (!TryGetCallerUserId(out var callerId))
            return ProblemResult(401, "Unauthorized", "Invalid token subject.");

        var privileged = User.IsInRole("Admin") || User.IsInRole("Operator");
        return await DatabaseBoundary(async () =>
        {
            var result = await _trust.SubmitTelemetryAsync(request, callerId, privileged, HttpContext.TraceIdentifier, ct);
            if (result.Outcome != DeviceAccessOutcome.Allowed || result.Device is null)
                return ProblemResult(404, "Not Found", "Device not registered.");
            return Ok(result.Device);
        });
    }

    /// <summary>Get trust score for an owned device, or any device for Admin and Operator.</summary>
    [HttpGet("devices/{hwId}")]
    [Authorize]
    [ProducesResponseType(typeof(TrustScoreResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemBody), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemBody), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDevice(string hwId, CancellationToken ct)
    {
        if (!TryGetCallerUserId(out var callerId))
            return ProblemResult(401, "Unauthorized", "Invalid token subject.");

        var privileged = User.IsInRole("Admin") || User.IsInRole("Operator");
        return await DatabaseBoundary(async () =>
        {
            var access = await _trust.GetDeviceForCallerAsync(hwId, callerId, privileged, HttpContext.TraceIdentifier, ct);
            if (access.Outcome != DeviceAccessOutcome.Allowed || access.Device is null)
                return ProblemResult(404, "Not Found", "Device not registered.");
            return Ok(access.Device);
        });
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

    private JsonResult ProblemResult(int status, string title, string detail) =>
        new(new ProblemBody
        {
            Type = $"https://acing.iu/problems/{status}",
            Title = title,
            Status = status,
            Detail = detail,
            TraceId = HttpContext.TraceIdentifier
        }) { StatusCode = status, ContentType = "application/problem+json" };

    private async Task<IActionResult> DatabaseBoundary(Func<Task<IActionResult>> operation)
    {
        try { return await operation(); }
        catch (Npgsql.NpgsqlException)
        {
            return ProblemResult(503, "Unavailable", "Device trust is unavailable.");
        }
        catch (TimeoutException)
        {
            return ProblemResult(503, "Unavailable", "Device trust is unavailable.");
        }
    }

    private bool TryGetCallerUserId(out Guid userId)
    {
        userId = default;
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return !string.IsNullOrWhiteSpace(sub) && Guid.TryParse(sub, out userId) && userId != Guid.Empty;
    }
}
