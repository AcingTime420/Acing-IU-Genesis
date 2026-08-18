using AcingIU.Audit.Models;
using Npgsql;

namespace AcingIU.Audit.Data;

public sealed class PostgresAuditLogRepository(string connectionString) : IAuditLogRepository
{
    private const string Query = """
        SELECT id, event_type, severity, actor, resource_accessed, payload::text, trace_id, created_at
        FROM security_audit_logs
        WHERE (@eventType IS NULL OR event_type = @eventType)
          AND (@severity IS NULL OR severity = @severity)
          AND (@beforeId IS NULL OR id < @beforeId)
        ORDER BY id DESC
        LIMIT @limit;
        """;

    public async Task<IReadOnlyList<AuditLogRecord>> GetRecentAsync(
        string? eventType,
        string? severity,
        long? beforeId,
        int limit,
        CancellationToken cancellationToken)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(Query, connection);
        command.Parameters.AddWithValue("eventType", (object?)eventType ?? DBNull.Value);
        command.Parameters.AddWithValue("severity", (object?)severity ?? DBNull.Value);
        command.Parameters.AddWithValue("beforeId", (object?)beforeId ?? DBNull.Value);
        command.Parameters.AddWithValue("limit", limit);

        var records = new List<AuditLogRecord>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            records.Add(new AuditLogRecord(
                reader.GetInt64(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetString(3),
                reader.IsDBNull(4) ? null : reader.GetString(4),
                reader.IsDBNull(5) ? null : reader.GetString(5),
                reader.IsDBNull(6) ? null : reader.GetString(6),
                reader.GetFieldValue<DateTimeOffset>(7)));
        }
        return records;
    }
}
