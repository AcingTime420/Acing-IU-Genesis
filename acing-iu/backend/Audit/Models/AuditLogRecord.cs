namespace AcingIU.Audit.Models;

public sealed record AuditLogRecord(
    long Id,
    string EventType,
    string Severity,
    string Actor,
    string? ResourceAccessed,
    string? Payload,
    string? TraceId,
    DateTimeOffset CreatedAt);
