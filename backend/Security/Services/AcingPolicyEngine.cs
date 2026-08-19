using System;
using System.Collections.Generic;

namespace AcingOS.Security
{
    public class EvaluationRequest
    {
        public Guid DeviceId { get; set; }
        public Guid UserId { get; set; }
        public int CurrentTrustScore { get; set; }
        public bool IsQuarantined { get; set; }
        public string UserRole { get; set; } = "User";
        public bool IsMfaVerified { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public string TargetComponent { get; set; } = string.Empty;
    }

    public class EvaluationResult
    {
        public bool IsApproved { get; set; }
        public string Outcome { get; set; } = "DENIED_NOT_SUPPORTED";
        public string DiagnosticMessage { get; set; } = string.Empty;
        public List<string> FailureReasons { get; set; } = new List<string>();
        public int RequiredTrustScore { get; set; }
        public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;
    }

    public class AcingPolicyEngine
    {
        /// <summary>
        /// Non-operational safety boundary. This class is not a device executor and never
        /// authorizes device-changing actions from request-supplied role, MFA, or trust fields.
        /// </summary>
        public EvaluationResult Evaluate(EvaluationRequest request)
        {
            return new EvaluationResult
            {
                IsApproved = false,
                Outcome = "DENIED_NOT_SUPPORTED",
                DiagnosticMessage = "Device-changing policy evaluation is disabled pending verified Authorized Device Lab controls.",
                FailureReasons = new List<string>
                {
                    "No verified device executor, server-side authorization binding, ownership consent, supported-device matrix, dry-run, audit, backup, or rollback evidence is available."
                }
            };
        }
    }
}
