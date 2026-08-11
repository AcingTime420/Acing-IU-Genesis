using System;

namespace AcingIU.Shared.Models
{
    public class DeviceTrustState
    {
        public Guid DeviceId { get; set; }
        public Guid UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Platform { get; set; } = "Android";
        public string OsVersion { get; set; } = string.Empty;
        public string AppVersion { get; set; } = string.Empty;
        
        // SM-S938U Verizon Telemetry & Attestation Status
        public int KnoxWarrantyVoid { get; set; } // 0 = Valid, 1 = Tripped
        public string SelinuxStatus { get; set; } = "Enforcing";
        public bool TimaRkpActive { get; set; } = true;
        public string BootloaderStatus { get; set; } = "Locked";
        public string ApPartitionHash { get; set; } = string.Empty;
        public string CpPartitionHash { get; set; } = string.Empty;
        public bool CarrierBaselineMatched { get; set; } = true;
        
        // CTIA 3.8.2 RF Signal Performance parameters
        public decimal? CTIATrpDbm { get; set; }
        public decimal? CTIATisDbm { get; set; }

        public int CalculatedTrustScore { get; set; }
        public bool IsQuarantined { get; set; }
        public DateTime LastSeen { get; set; } = DateTime.UtcNow;
    }

    public class SecurityPolicy
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int MinTrustScore { get; set; } = 70;
        public bool RequireMfa { get; set; } = true;
        public string AllowedRoles { get; set; } = "Admin";
        public bool IsActive { get; set; } = true;
    }

    public class AuditLogEntry
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid? UserId { get; set; }
        public Guid? DeviceId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Status { get; set; } = "SUCCESS";
        public string DetailsJson { get; set; } = "{}";
        public string IpAddress { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
