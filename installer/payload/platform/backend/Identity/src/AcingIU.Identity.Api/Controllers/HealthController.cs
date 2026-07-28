using AcingIU.Identity.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;

namespace AcingIU.Identity.Api.Controllers;

[ApiController]
[AllowAnonymous]
public sealed class HealthController : ControllerBase
{
    private readonly IDbConnectionFactory _db;
    private readonly IConnectionMultiplexer _redis;

    public HealthController(IDbConnectionFactory db, IConnectionMultiplexer redis)
    {
        _db = db;
        _redis = redis;
    }

    [HttpGet("/health/live")]
    public IActionResult Live() =>
        Ok(new { status = "ok", service = "acing-identity", version = "1.0.0-s2" });

    [HttpGet("/health/ready")]
    public async Task<IActionResult> Ready(CancellationToken ct)
    {
        try
        {
            await using var conn = await _db.CreateOpenConnectionAsync(ct);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT 1";
            await cmd.ExecuteScalarAsync(ct);

            var pong = await _redis.GetDatabase().PingAsync();
            return Ok(new
            {
                status = "ready",
                service = "acing-identity",
                postgres = "up",
                redis = "up",
                redisLatencyMs = pong.TotalMilliseconds
            });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new
            {
                status = "not_ready",
                service = "acing-identity",
                detail = ex.Message
            });
        }
    }
}
