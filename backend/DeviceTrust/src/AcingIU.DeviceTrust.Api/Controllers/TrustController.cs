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

        // Fail closed: telemetry without a resolvable subject is rejected (no anonymous ownership).
        if (!TryGetCallerUserId(out var owner))
            return ProblemResult(401, "Unauthorized", "Invalid token subject.");

        var result = await _trust.SubmitTelemetryAsync(request, owner, HttpContext.TraceIdentifier, ct);
        return Ok(result);
    }

    /// <summary>
    /// Get trust score for a hardware identifier.
    /// Non-privileged callers may only read devices they own (AUTHZ-04).
    /// Unauthorized and unknown devices both return 404 (anti-enumeration).
    /// </summary>
    [HttpGet("devices/{hwId}")]
    [Authorize]
    [ProducesResponseType(typeof(TrustScoreResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemBody), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemBody), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDevice(string hwId, CancellationToken ct)
    {
        if (!TryGetCallerUserId(out var callerId))
            return ProblemResult(401, "Unauthorized", "Invalid token subject.");

        // Existing role model only: Admin and Operator (same as list endpoint).
        var isPrivileged = User.IsInRole("Admin") || User.IsInRole("Operator");

        var access = await _trust.GetDeviceForCallerAsync(
            hwId, callerId, isPrivileged, HttpContext.TraceIdentifier, ct);

        if (access.Outcome != DeviceAccessOutcome.Allowed || access.Device is null)
            return ProblemResult(404, "Not Found", "Device not registered.");

        return Ok(access.Device);
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

    /// <summary>Derive caller identity only from validated authentication claims — never from the request body.</summary>
    private bool TryGetCallerUserId(out Guid userId)
    {
        userId = default;
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(sub))
            return false;
        return Guid.TryParse(sub, out userId);
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
