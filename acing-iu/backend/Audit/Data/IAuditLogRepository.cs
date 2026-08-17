using AcingIU.Audit.Models;

namespace AcingIU.Audit.Data;

public interface IAuditLogRepository
{
    Task<IReadOnlyList<AuditLogRecord>> GetRecentAsync(
        string? eventType,
        string? severity,
        long? beforeId,
        int limit,
        CancellationToken cancellationToken);
}
