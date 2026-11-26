using System.Text;
using System.Text.Json;
using Npgsql;

namespace HumanAuthority;

public sealed record CreateDocumentRequest
{
    public required string Title { get; init; }
    public required string Content { get; init; }
}

public sealed record CreateProposalRequest
{
    public required Guid DocumentId { get; init; }
    public required long ExpectedVersion { get; init; }
    public required string Text { get; init; }
    public required int TtlSeconds { get; init; }
}

public sealed record DecisionRequest
{
    public required string Decision { get; init; }
}

public sealed record RevokeRequest
{
    public required string Reason { get; init; }
}

public sealed record ExecuteRequest
{
    public required Guid ProposalId { get; init; }
    public required Guid GrantId { get; init; }
    public required Guid DocumentId { get; init; }
    public required string Operation { get; init; }
    public required string Text { get; init; }
    public required long ExpectedVersion { get; init; }
}

public sealed record DocumentDto(Guid Id, Guid OwnerId, string Title, string Content, long Version, DateTime CreatedAt);
public sealed record ProposalDto(Guid Id, Guid AgentId, string AgentName, Guid DocumentId, string Operation,
    string Text, long ExpectedVersion, DateTime ExpiresAt, bool SingleUse, DateTime CreatedAt);
public sealed record DecisionDto(Guid ProposalId, string Decision, Guid? GrantId);
public sealed record GrantDto(Guid Id, Guid ProposalId, Guid DocumentId, Guid AgentId, DateTime ExpiresAt,
    bool SingleUse, string State, DateTime CreatedAt);
public sealed record AttemptDto(Guid Id, Guid ProposalId, Guid GrantId, Guid DocumentId, string Operation,
    string Text, long ExpectedVersion, string Outcome, string Reason, long? DocumentVersion, DateTime CreatedAt);
public sealed record EvidenceDto(Guid Id, Guid? DocumentId, Guid RequesterId, Guid? ApproverId, Guid? ProposalId,
    Guid? GrantId, Guid? AttemptId, string Action, string? Decision, string Outcome, JsonElement Details, DateTime CreatedAt);

public sealed class AuthorityRequestException(int status, string code) : Exception
{
    public int Status { get; } = status;
    public string Code { get; } = code;
}

public static class AuthorityValidation
{
    private static readonly UTF8Encoding StrictUtf8 = new(false, true);
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static void Require(bool valid)
    {
        if (!valid) throw new AuthorityRequestException(400, "invalid_request");
    }

    public static Guid Id(string value)
    {
        Require(Guid.TryParse(value, out var id) && id != Guid.Empty);
        return id;
    }

    public static bool Text(string? value, int min, int max) =>
        value is not null && !value.Contains('\0') && value.EnumerateRunes().Count() >= min
        && value.EnumerateRunes().Count() <= max && ValidUtf8(value);

    public static bool Bytes(string? value, int min, int max)
    {
        if (value is null || value.Contains('\0')) return false;
        try
        {
            var count = StrictUtf8.GetByteCount(value);
            return count >= min && count <= max;
        }
        catch (EncoderFallbackException) { return false; }
    }

    private static bool ValidUtf8(string value)
    {
        try { StrictUtf8.GetByteCount(value); return true; }
        catch (EncoderFallbackException) { return false; }
    }

    public static AuthorityActor Actor(HttpContext context, string? kind = null)
    {
        var actor = AuthorityActor.From(context);
        if (kind is not null && actor.Kind != kind)
            throw new AuthorityRequestException(403, "forbidden");
        return actor;
    }

    public static string Key(Microsoft.Extensions.Primitives.StringValues values)
    {
        Require(values.Count == 1 && Text(values[0], 1, 200));
        return values[0]!;
    }
}

internal sealed class AuthoritySession(NpgsqlConnection connection, NpgsqlTransaction? transaction = null)
{
    public async Task<List<T>> Query<T>(string sql, Func<NpgsqlDataReader, T> map, params object?[] values)
    {
        await using var command = Command(sql, values);
        await using var reader = await command.ExecuteReaderAsync(CancellationToken.None);
        var rows = new List<T>();
        while (await reader.ReadAsync(CancellationToken.None))
            rows.Add(map(reader));
        return rows;
    }

    public async Task<T?> One<T>(string sql, Func<NpgsqlDataReader, T> map, params object?[] values) where T : class =>
        (await Query(sql, map, values)).SingleOrDefault();

    public async Task Execute(string sql, params object?[] values)
    {
        await using var command = Command(sql, values);
        await command.ExecuteNonQueryAsync(CancellationToken.None);
    }

    public async Task<T> Scalar<T>(string sql, params object?[] values)
    {
        await using var command = Command(sql, values);
        return (T)(await command.ExecuteScalarAsync(CancellationToken.None))!;
    }

    private NpgsqlCommand Command(string sql, object?[] values)
    {
        var command = new NpgsqlCommand(sql, connection, transaction);
        foreach (var value in values)
            command.Parameters.Add(new NpgsqlParameter { Value = value ?? DBNull.Value });
        return command;
    }

    public Task Audit(Guid? documentId, Guid requesterId, Guid? approverId, Guid? proposalId,
        Guid? grantId, Guid? attemptId, string action, string? decision, string outcome, object details) =>
        Execute("""
            INSERT INTO genesis_authority.evidence
                (document_id,requester_id,approver_id,proposal_id,grant_id,attempt_id,action,decision,outcome,details)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
            """, documentId, requesterId, approverId, proposalId, grantId, attemptId, action, decision, outcome,
            JsonSerializer.Serialize(details, AuthorityValidation.Json));

    public async Task<bool> Enabled(Guid actorId, string kind)
    {
        var actors = await Query("""
            SELECT kind,enabled FROM genesis_authority.principals WHERE id=$1 FOR SHARE
            """, reader => (Kind: reader.GetString(0), Enabled: reader.GetBoolean(1)), actorId);
        return actors.Count == 1 && actors[0].Kind == kind && actors[0].Enabled;
    }
}

internal static class AuthorityRows
{
    public const string DocumentColumns = "id,owner_id,title,content,version,created_at";
    public const string ProposalColumns = """
        p.id,p.agent_id,a.display_name,p.document_id,p.operation,p.text,p.expected_version,
        p.expires_at,p.single_use,p.created_at
        """;
    public const string GrantColumns = """
        id,proposal_id,document_id,agent_id,expires_at,single_use,
        CASE WHEN state='active' AND expires_at<=clock_timestamp() THEN 'expired' ELSE state END,created_at
        """;
    public const string AttemptColumns = """
        id,proposal_id,grant_id,document_id,operation,text,expected_version,outcome,reason,document_version,created_at
        """;

    public static DocumentDto Document(NpgsqlDataReader r) =>
        new(r.GetGuid(0), r.GetGuid(1), r.GetString(2), r.GetString(3), r.GetInt64(4), r.GetDateTime(5));
    public static ProposalDto Proposal(NpgsqlDataReader r) =>
        new(r.GetGuid(0), r.GetGuid(1), r.GetString(2), r.GetGuid(3), r.GetString(4), r.GetString(5),
            r.GetInt64(6), r.GetDateTime(7), r.GetBoolean(8), r.GetDateTime(9));
    public static GrantDto Grant(NpgsqlDataReader r) =>
        new(r.GetGuid(0), r.GetGuid(1), r.GetGuid(2), r.GetGuid(3), r.GetDateTime(4), r.GetBoolean(5),
            r.GetString(6), r.GetDateTime(7));
    public static AttemptDto Attempt(NpgsqlDataReader r) =>
        new(r.GetGuid(0), r.GetGuid(1), r.GetGuid(2), r.GetGuid(3), r.GetString(4), r.GetString(5),
            r.GetInt64(6), r.GetString(7), r.GetString(8), r.IsDBNull(9) ? null : r.GetInt64(9), r.GetDateTime(10));
    public static EvidenceDto Evidence(NpgsqlDataReader r) =>
        new(r.GetGuid(0), NullableGuid(r, 1), r.GetGuid(2), NullableGuid(r, 3), NullableGuid(r, 4),
            NullableGuid(r, 5), NullableGuid(r, 6), r.GetString(7), r.IsDBNull(8) ? null : r.GetString(8),
            r.GetString(9), JsonSerializer.Deserialize<JsonElement>(r.GetString(10)), r.GetDateTime(11));
    public static Guid? NullableGuid(NpgsqlDataReader r, int index) => r.IsDBNull(index) ? null : r.GetGuid(index);
}
