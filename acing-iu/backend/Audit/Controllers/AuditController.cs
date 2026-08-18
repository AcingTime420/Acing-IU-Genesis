using AcingIU.Audit.Data;
using AcingIU.Audit.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcingIU.Audit.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize(Roles = "Admin,Operator")]
public sealed class AuditController(IAuditLogRepository auditLogRepository) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<AuditLogRecord>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<AuditLogRecord>>> GetAuditLogs(
        [FromQuery] string? eventType,
        [FromQuery] string? severity,
        [FromQuery] long? beforeId,
        [FromQuery] int limit = 100,
        CancellationToken cancellationToken = default)
    {
        if (limit is < 1 or > 500)
        {
            return ValidationProblem("limit must be between 1 and 500.");
        }
        if (beforeId is <= 0)
        {
            return ValidationProblem("beforeId must be a positive audit record identifier.");
        }
        var records = await auditLogRepository.GetRecentAsync(eventType, severity, beforeId, limit, cancellationToken);
        return Ok(records);
    }
}
