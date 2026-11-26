using System;
using System.Collections.Generic;
using System.Linq;

namespace AcingOS.DeviceTrust
{
    public class SuperPartitionSpec
    {
        public string Name { get; set; } = string.Empty;
        public long ExpectedMinSize { get; set; } // in bytes
        public long ExpectedMaxSize { get; set; } // in bytes
        public string ApprovedHash { get; set; } = string.Empty;
    }

    public class PartitionTelemetry
    {
        public string Name { get; set; } = string.Empty;
        public long Size { get; set; }
        public string Hash { get; set; } = string.Empty;
    }

    public class SuperImageValidationResult
    {
        public bool IsValid { get; set; }
        public string StatusMessage { get; set; } = string.Empty;
        public List<string> Violations { get; set; } = new List<string>();
        public int PenaltyPoints { get; set; }
        public Dictionary<string, bool> PartitionStatus { get; set; } = new Dictionary<string, bool>();
    }

    public class FirmwareCenter
    {
        // Dynamic Partition Group specs for S938U Verizon (S938UVRU1AXB7 baseline)
        // Max size of the 'qti_dynamic_partitions' group inside super.img is typically ~9.5 GB (10,200,547,328 bytes)
        public const long MaxSuperGroupSize = 10200547328L;

        private static readonly Dictionary<string, SuperPartitionSpec> S938UVerizonSpecs = new()
        {
            { "system", new SuperPartitionSpec { Name = "system", ExpectedMinSize = 2500000000L, ExpectedMaxSize = 4500000000L, ApprovedHash = "3c59a35e1281e8c97ec59bfa11ef12345e6eb951fca28be8e09fa843110fae12" } },
            { "vendor", new SuperPartitionSpec { Name = "vendor", ExpectedMinSize = 800000000L, ExpectedMaxSize = 1500000000L, ApprovedHash = "a5732f98903141fa8ba245de190a980ca73cb9516efc4e8c8be9e09fa8430b22" } },
            { "product", new SuperPartitionSpec { Name = "product", ExpectedMinSize = 1000000000L, ExpectedMaxSize = 2500000000L, ApprovedHash = "b5722f98903141fa8ba245de190a980ca73cb9516efc4e8c8be9e09fa8430b21" } },
            { "odm", new SuperPartitionSpec { Name = "odm", ExpectedMinSize = 100000000L, ExpectedMaxSize = 500000000L, ApprovedHash = "c44cb89a09ab44dfbe0900ab55f84bc1e4772125c3e64f7ba2cea2ce85bbf1ea" } },
            { "system_ext", new SuperPartitionSpec { Name = "system_ext", ExpectedMinSize = 300000000L, ExpectedMaxSize = 900000000L, ApprovedHash = "d381c0bcfca2480ca9e9e10fae12089ba73cb9516efc4e8c8be9e09fa8430b21" } },
            { "vendor_dlkm", new SuperPartitionSpec { Name = "vendor_dlkm", ExpectedMinSize = 50000000L, ExpectedMaxSize = 200000000L, ApprovedHash = "e44cb89a09ab44dfbe0900ab55f84bc1e4772125c3e64f7ba2cea2ce85bbf1ee" } }
        };

        public SuperImageValidationResult ValidateSuperImage(List<PartitionTelemetry> telemetry)
        {
            var result = new SuperImageValidationResult();
            long totalGroupSize = 0;

            // Required partitions check
            var requiredPartitions = S938UVerizonSpecs.Keys.ToList();
            var detectedPartitions = telemetry.Select(p => p.Name.ToLower()).ToHashSet();

            foreach (var req in requiredPartitions)
            {
                var spec = S938UVerizonSpecs[req];
                var tele = telemetry.FirstOrDefault(p => p.Name.Equals(req, StringComparison.OrdinalIgnoreCase));

                if (tele == null)
                {
                    result.Violations.Add($"Critical partition missing in super.img: '{req}'");
                    result.PenaltyPoints += 30;
                    result.PartitionStatus[req] = false;
                    continue;
                }

                // Size boundary check
                if (tele.Size < spec.ExpectedMinSize || tele.Size > spec.ExpectedMaxSize)
                {
                    result.Violations.Add($"Partition '{req}' size {tele.Size} bytes out of S938U spec bounds ({spec.ExpectedMinSize} - {spec.ExpectedMaxSize} bytes)");
                    result.PenaltyPoints += 15;
                    result.PartitionStatus[req] = false;
                }
                else
                {
                    result.PartitionStatus[req] = true;
                }

                // Partition Hash check
                if (!string.Equals(tele.Hash, spec.ApprovedHash, StringComparison.OrdinalIgnoreCase))
                {
                    result.Violations.Add($"Partition '{req}' hash mismatch. System integrity compromised! Found: {tele.Hash}");
                    result.PenaltyPoints += 25;
                    result.PartitionStatus[req] = false;
                }

                totalGroupSize += tele.Size;
            }

            // Total group size bounds check
            if (totalGroupSize > MaxSuperGroupSize)
            {
                result.Violations.Add($"Total dynamic partitions size {totalGroupSize} exceeds the SM-S938U hardware super group partition allocation of {MaxSuperGroupSize} bytes");
                result.PenaltyPoints += 20;
            }

            // Extra unrecognized partitions could be malicious
            var extraPartitions = detectedPartitions.Except(requiredPartitions).ToList();
            if (extraPartitions.Count > 0)
            {
                result.Violations.Add($"Detected unknown/unregistered dynamic partitions in super.img: {string.Join(", ", extraPartitions)}");
                result.PenaltyPoints += 15;
            }

            if (result.Violations.Count == 0)
            {
                result.IsValid = true;
                result.StatusMessage = "Super.img partitions verified and match SM-S938U Verizon baseline specs perfectly.";
            }
            else
            {
                result.IsValid = false;
                result.StatusMessage = $"Super.img validation FAILED with {result.Violations.Count} violations. Dynamic group integrity at risk.";
            }

            return result;
        }
    }
}
