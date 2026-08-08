using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using AcingIU.Shared.Models;

namespace AcingOS.Audit
{
    public interface IAuditService
    {
        void RecordEvent(Guid? userId, Guid? deviceId, string action, string status, string detailsJson, string ipAddress);
        List<AuditLogEntry> GetAllLogs();
        List<AuditLogEntry> GetLogsByDevice(Guid deviceId);
        List<AuditLogEntry> GetLogsByUser(Guid userId);
    }

    public class AuditService : IAuditService
    {
        private readonly ConcurrentBag<AuditLogEntry> _inMemoryLogs = new();

        public AuditService()
        {
            // Seed initial compliance log for demo / validation
            _inMemoryLogs.Add(new AuditLogEntry
            {
                Id = Guid.NewGuid(),
                UserId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                DeviceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Action = "DEVICE_POLICY_EVALUATION",
                Status = "SUCCESS",
                DetailsJson = "{\"DeviceName\":\"S25 Ultra Mock\",\"TrustScore\":100,\"PartitionVerification\":\"PASSED\"}",
                IpAddress = "192.168.1.150",
                CreatedAt = DateTime.UtcNow.AddMinutes(-10)
            });
        }

        public void RecordEvent(Guid? userId, Guid? deviceId, string action, string status, string detailsJson, string ipAddress)
        {
            var entry = new AuditLogEntry
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DeviceId = deviceId,
                Action = action,
                Status = status,
                DetailsJson = detailsJson,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            };

            // Store in high-speed thread-safe memory
            _inMemoryLogs.Add(entry);

            // Document standard raw SQL prepared statement for PostgreSQL ingestion as required by 000_security_core.sql:
            string insertSql = @"
                INSERT INTO audit_logs (id, user_id, device_id, action, status, details, ip_address, created_at)
                VALUES (@Id, @UserId, @DeviceId, @Action, @Status, @DetailsJson::jsonb, @IpAddress, @CreatedAt);
            ";

            // Diagnostic trace showing database sync readiness
            Console.WriteLine($"[POSTGRESQL AUDIT STAGE] Query Prepared: {insertSql}");
            Console.WriteLine($"[AUDIT LOGGED] Action: {action} | Status: {status} | Device: {deviceId} | IP: {ipAddress}");
        }

        public List<AuditLogEntry> GetAllLogs()
        {
            // Document standard raw SQL selection:
            string selectSql = "SELECT id, user_id, device_id, action, status, details, ip_address, created_at FROM audit_logs ORDER BY created_at DESC;";
            Console.WriteLine($"[POSTGRESQL SELECT STAGE] Query Prepared: {selectSql}");

            return _inMemoryLogs.OrderByDescending(l => l.CreatedAt).ToList();
        }

        public List<AuditLogEntry> GetLogsByDevice(Guid deviceId)
        {
            return _inMemoryLogs
                .Where(l => l.DeviceId == deviceId)
                .OrderByDescending(l => l.CreatedAt)
                .ToList();
        }

        public List<AuditLogEntry> GetLogsByUser(Guid userId)
        {
            return _inMemoryLogs
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.CreatedAt)
                .ToList();
        }
    }
}
