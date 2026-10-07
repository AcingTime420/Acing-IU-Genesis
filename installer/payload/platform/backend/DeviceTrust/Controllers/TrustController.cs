using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using AcingIU.Shared.Models;
using AcingOS.DeviceTrust;

namespace AcingIU.DeviceTrust.Controllers
{
    [ApiController]
    [Route("api/devices")]
    public class TrustController : ControllerBase
    {
        private readonly FirmwareCenter _firmwareCenter;

        public TrustController(FirmwareCenter firmwareCenter)
        {
            _firmwareCenter = firmwareCenter;
        }

        [HttpPost("validate-super")]
        public IActionResult ValidateSuperImage([FromBody] List<PartitionTelemetry> telemetry)
        {
            var result = _firmwareCenter.ValidateSuperImage(telemetry);
            return Ok(result);
        }

        [HttpPost("register")]
        public IActionResult RegisterDevice([FromBody] DeviceRegistrationRequest request)
        {
            var deviceId = Guid.NewGuid();
            
            // Perform zero-trust evaluation against the Knox-Inspired Acing Matrix
            int trustScore = 100;
            bool quarantined = false;

            if (request.KnoxWarrantyVoid != 0)
            {
                trustScore = 0;
                quarantined = true;
            }
            else
            {
                if (request.SelinuxStatus != "Enforcing") trustScore -= 20;
                if (!request.TimaRkpActive) trustScore -= 20;
                if (request.BootloaderStatus != "Locked") trustScore -= 30;
                if (!request.CarrierBaselineMatched) trustScore -= 15;
                
                // Validate CTIA Signal limits
                if (request.CTIATrpDbm.HasValue && request.CTIATrpDbm.Value < 23.0m) trustScore -= 15;
                if (request.CTIATisDbm.HasValue && request.CTIATisDbm.Value > -90.0m) trustScore -= 15;
            }

            if (trustScore < 40)
            {
                quarantined = true;
            }

            var state = new DeviceTrustState
            {
                DeviceId = deviceId,
                UserId = request.UserId,
                Name = request.Name,
                Platform = request.Platform,
                OsVersion = request.OsVersion,
                AppVersion = request.AppVersion,
                KnoxWarrantyVoid = request.KnoxWarrantyVoid,
                SelinuxStatus = request.SelinuxStatus,
                TimaRkpActive = request.TimaRkpActive,
                BootloaderStatus = request.BootloaderStatus,
                ApPartitionHash = request.ApPartitionHash,
                CpPartitionHash = request.CpPartitionHash,
                CarrierBaselineMatched = request.CarrierBaselineMatched,
                CTIATrpDbm = request.CTIATrpDbm,
                CTIATisDbm = request.CTIATisDbm,
                CalculatedTrustScore = Math.Max(0, trustScore),
                IsQuarantined = quarantined,
                LastSeen = DateTime.UtcNow
            };

            return Ok(new {
                DeviceId = state.DeviceId,
                TrustScore = state.CalculatedTrustScore,
                IsQuarantined = state.IsQuarantined,
                ComplianceState = state.IsQuarantined ? "Quarantined" : (state.CalculatedTrustScore >= 85 ? "Trusted" : "Elevated"),
                CertificateSerial = $"CERT-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}"
            });
        }
    }

    public class DeviceRegistrationRequest
    {
        public Guid UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Platform { get; set; } = "Android";
        public string OsVersion { get; set; } = string.Empty;
        public string AppVersion { get; set; } = string.Empty;
        public int KnoxWarrantyVoid { get; set; }
        public string SelinuxStatus { get; set; } = "Enforcing";
        public bool TimaRkpActive { get; set; } = true;
        public string BootloaderStatus { get; set; } = "Locked";
        public string ApPartitionHash { get; set; } = string.Empty;
        public string CpPartitionHash { get; set; } = string.Empty;
        public bool CarrierBaselineMatched { get; set; } = true;
        public decimal? CTIATrpDbm { get; set; }
        public decimal? CTIATisDbm { get; set; }
    }
}
