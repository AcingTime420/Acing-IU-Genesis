using Microsoft.AspNetCore.Mvc;
using System;
using AcingIU.Shared.Models;
using AcingOS.Audit;

namespace AcingIU.Audit.Controllers
{
    [ApiController]
    [Route("api/audit")]
    public class AuditController : ControllerBase
    {
        private readonly IAuditService _auditService;

        public AuditController(IAuditService auditService)
        {
            _auditService = auditService;
        }

        [HttpGet]
        public IActionResult GetAuditLogs()
        {
            var logs = _auditService.GetAllLogs();
            return Ok(logs);
        }

        [HttpPost]
        public IActionResult CommitAuditLog([FromBody] AuditLogEntry entry)
        {
            _auditService.RecordEvent(
                entry.UserId,
                entry.DeviceId,
                entry.Action,
                entry.Status,
                entry.DetailsJson,
                entry.IpAddress
            );

            return CreatedAtAction(nameof(GetAuditLogs), new {
                LogId = entry.Id,
                Committed = true,
                Message = "Audit log persisted securely to PostgreSQL."
            });
        }
    }
}
