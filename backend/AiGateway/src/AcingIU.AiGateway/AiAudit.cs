namespace AcingIU.AiGateway;

/// <summary>
/// Sanitized audit metadata. Prompt, model output, tool arguments, credentials, and
/// exception messages are intentionally absent from this contract.
/// </summary>
public sealed record AiAuditEvent(
    string EventType,
    Guid ActorId,
    Guid CorrelationId,
    string Provider,
    string UseCase,
    string ReasonCode,
    DateTimeOffset OccurredAt,
    string? Action = null,
    string? Resource = null,
    Guid? ApproverId = null,
    string? Detail = null);

public interface IAiAuditSink
{
    Task WriteAsync(AiAuditEvent auditEvent, CancellationToken cancellationToken);
}
