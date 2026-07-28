using AcingIU.DeviceTrust.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcingIU.DeviceTrust.Api.Controllers;

[ApiController]
[AllowAnonymous]
public sealed class HealthController : ControllerBase
{
    private readonly IDbConnectionFactory _db;

    public HealthController(IDbConnectionFactory db) => _db = db;

    [HttpGet("/health/live")]
    public IActionResult Live() =>
        Ok(new { status = "ok", service = "acing-device-trust", version = "1.0.0-s3" });

    [HttpGet("/health/ready")]
    public async Task<IActionResult> Ready(CancellationToken ct)
    {
        try
        {
            await using var conn = await _db.CreateOpenConnectionAsync(ct);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT 1";
            await cmd.ExecuteScalarAsync(ct);
            return Ok(new { status = "ready", service = "acing-device-trust", postgres = "up" });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { status = "not_ready", detail = ex.Message });
        }
    }
}
