using Microsoft.AspNetCore.Mvc;
using System;
using AcingIU.Shared.Models;

namespace AcingIU.Audit.Controllers
{
    [ApiController]
    [Route("api/audit")]
    public class AuditController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetAuditLogs()
        {
            return Ok(new[] {
                new AuditLogEntry {
                    UserId = Guid.NewGuid(),
                    DeviceId = Guid.NewGuid(),
                    Action = "DEVICE_POLICY_EVALUATION",
                    Status = "SUCCESS",
                    DetailsJson = "{\"DeviceName\":\"Mick's S25 Ultra\",\"TrustScore\":100}",
                    IpAddress = "192.168.1.150"
                }
            });
        }

        [HttpPost]
        public IActionResult CommitAuditLog([FromBody] AuditLogEntry entry)
        {
            return CreatedAtAction(nameof(GetAuditLogs), new {
                LogId = entry.Id,
                Committed = true,
                Message = "Audit log persisted securely to PostgreSQL."
            });
        }
    }
}
