using System;
using System.Collections.Generic;
using System.Linq;
using AcingIU.Shared.Models;

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
        public string ActionType { get; set; } = string.Empty; // "SYSTEM_MODIFICATION", "PARTITION_WIPE", "FIRMWARE_FLASH", "KEY_ROTATION"
        public string TargetComponent { get; set; } = string.Empty; // "super.img", "/persistent", "/bootloader"
    }

    public class EvaluationResult
    {
        public bool IsApproved { get; set; }
        public string Outcome { get; set; } = "DENIED";
        public string DiagnosticMessage { get; set; } = string.Empty;
        public List<string> FailureReasons { get; set; } = new List<string>();
        public int RequiredTrustScore { get; set; }
        public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;
    }

    public class AcingPolicyEngine
    {
        private static readonly Dictionary<string, SecurityPolicy> ActionPolicies = new()
        {
            {
                "SYSTEM_MODIFICATION", new SecurityPolicy
                {
                    Name = "System Partition Modification",
                    Description = "Allows updates or changes to dynamic partitions inside super.img",
                    MinTrustScore = 80,
                    RequireMfa = true,
                    AllowedRoles = "Admin,Operator",
                    IsActive = true
                }
            },
            {
                "PARTITION_WIPE", new SecurityPolicy
                {
                    Name = "FRP and Cache Partition Wiping",
                    Description = "Forces clean wipe on persistent, cache, or dynamic pools.",
                    MinTrustScore = 90,
                    RequireMfa = true,
                    AllowedRoles = "Admin",
                    IsActive = true
                }
            },
            {
                "FIRMWARE_FLASH", new SecurityPolicy
                {
                    Name = "Firmware Update Flashing",
                    Description = "Flash verified signed Verizon baseline image to AP/CP blocks.",
                    MinTrustScore = 85,
                    RequireMfa = true,
                    AllowedRoles = "Admin,Operator",
                    IsActive = true
                }
            },
            {
                "KEY_ROTATION", new SecurityPolicy
                {
                    Name = "Security Matrix Key Rotation",
                    Description = "Regenerate decentralized cryptographic certificates and keys.",
                    MinTrustScore = 95,
                    RequireMfa = true,
                    AllowedRoles = "Admin",
                    IsActive = true
                }
            }
        };

        public EvaluationResult Evaluate(EvaluationRequest request)
        {
            var result = new EvaluationResult();

            if (request.IsQuarantined)
            {
                result.IsApproved = false;
                result.Outcome = "DENIED_QUARANTINED";
                result.FailureReasons.Add("Device is currently in quarantine due to critical baseline violations.");
                result.DiagnosticMessage = "Conditional Access Denied: Device is in quarantine state.";
                return result;
            }

            // Find matching policy, or fall back to default baseline protection policy
            if (!ActionPolicies.TryGetValue(request.ActionType.ToUpper(), out var policy))
            {
                policy = new SecurityPolicy
                {
                    Name = "Default Fallback Baseline Protection",
                    Description = "Baseline check for unregistered operations.",
                    MinTrustScore = 75,
                    RequireMfa = true,
                    AllowedRoles = "Admin,Operator,User",
                    IsActive = true
                };
            }

            result.RequiredTrustScore = policy.MinTrustScore;

            if (!policy.IsActive)
            {
                result.IsApproved = true;
                result.Outcome = "APPROVED_BYPASSED";
                result.DiagnosticMessage = $"Access approved automatically because policy '{policy.Name}' is currently inactive.";
                return result;
            }

            // 1. Verify Trust Score threshold
            if (request.CurrentTrustScore < policy.MinTrustScore)
            {
                result.FailureReasons.Add($"Device trust score ({request.CurrentTrustScore}) is below the required baseline threshold of {policy.MinTrustScore} for policy: '{policy.Name}'");
            }

            // 2. Verify Multi-Factor Authentication
            if (policy.RequireMfa && !request.IsMfaVerified)
            {
                result.FailureReasons.Add($"Multi-Factor Authentication (MFA) verification is required for policy: '{policy.Name}'");
            }

            // 3. Verify Role authorization
            var allowedRolesList = policy.AllowedRoles.Split(',')
                .Select(r => r.Trim())
                .ToList();

            if (!allowedRolesList.Contains(request.UserRole, StringComparer.OrdinalIgnoreCase))
            {
                result.FailureReasons.Add($"User role '{request.UserRole}' is not authorized to execute this operation. Allowed roles: {policy.AllowedRoles}");
            }

            if (result.FailureReasons.Count == 0)
            {
                result.IsApproved = true;
                result.Outcome = "APPROVED";
                result.DiagnosticMessage = $"Access permitted. Device and credentials fully compliant with '{policy.Name}' policy.";
            }
            else
            {
                result.IsApproved = false;
                result.Outcome = "DENIED_COMPLIANCE_VIOLATION";
                result.DiagnosticMessage = $"Access blocked: Operation violates security rules defined under policy '{policy.Name}'.";
            }

            return result;
        }
    }
}
