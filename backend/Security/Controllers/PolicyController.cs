using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using AcingIU.Shared.Models;
using AcingOS.Security;

namespace AcingIU.Security.Controllers
{
    [ApiController]
    [Route("api/policies")]
    public class PolicyController : ControllerBase
    {
        private readonly AcingPolicyEngine _policyEngine;

        public PolicyController(AcingPolicyEngine policyEngine)
        {
            _policyEngine = policyEngine;
        }

        [HttpGet]
        public IActionResult GetPolicies()
        {
            return StatusCode(StatusCodes.Status501NotImplemented, new
            {
                Status = "DISABLED_PENDING_VALIDATION",
                Message = "Policy simulation and device-changing controls are unavailable until Authorized Device Lab requirements are independently verified."
            });
        }

        [Authorize(Roles = "Admin,Operator")]
        [HttpPost("evaluate")]
        public IActionResult EvaluatePolicy([FromBody] EvaluationRequest request)
        {
            return StatusCode(StatusCodes.Status501NotImplemented, new
            {
                Status = "DISABLED_PENDING_VALIDATION",
                Message = "The current policy evaluator is non-operational and cannot authorize device-changing actions.",
                Result = _policyEngine.Evaluate(request)
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public IActionResult UpdatePolicy(Guid id, [FromBody] SecurityPolicy updated)
        {
            return StatusCode(StatusCodes.Status501NotImplemented, new
            {
                PolicyId = id,
                Status = "DISABLED_PENDING_VALIDATION",
                Message = "Policy updates are disabled until authenticated server-side governance is implemented and validated."
            });
        }
    }
}
