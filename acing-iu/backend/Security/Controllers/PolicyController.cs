using Microsoft.AspNetCore.Mvc;
using System;
using AcingIU.Shared.Models;

namespace AcingIU.Security.Controllers
{
    [ApiController]
    [Route("api/policies")]
    public class PolicyController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetPolicies()
        {
            return Ok(new[] {
                new SecurityPolicy {
                    Id = Guid.NewGuid(),
                    Name = "SM-S938U Verizon Baseline Protection",
                    Description = "Knox Integrity, Locked Bootloader & CTIA 3.8.2 Signal thresholds.",
                    MinTrustScore = 85,
                    RequireMfa = true,
                    AllowedRoles = "Admin,Operator",
                    IsActive = true
                }
            });
        }

        [HttpPut("{id}")]
        public IActionResult UpdatePolicy(Guid id, [FromBody] SecurityPolicy updated)
        {
            return Ok(new {
                PolicyId = id,
                Status = "UPDATED",
                Message = "Security Policy parameters updated successfully."
            });
        }
    }
}
