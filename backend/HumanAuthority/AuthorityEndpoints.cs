using System.Data;
using System.Security.Cryptography;
using System.Text.Json;
using static HumanAuthority.AuthorityValidation;
using static HumanAuthority.AuthorityRows;

namespace HumanAuthority;

public static class AuthorityEndpoints
{
    public static void MapAuthorityEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/v1/authority");
        group.MapPost("/documents", CreateDocument);
        group.MapGet("/documents/{id}", GetDocument);
        group.MapGet("/documents/{id}/evidence", GetEvidence);
        group.MapPost("/proposals", CreateProposal);
        group.MapGet("/proposals/{id}", GetProposal);
        group.MapPost("/proposals/{id}/decision", Decide);
        group.MapGet("/grants/{id}", GetGrant);
        group.MapPost("/grants/{id}/revoke", Revoke);
        group.MapPost("/execute", Execute);
        group.MapGet("/attempts/by-key", GetAttemptByKey);
        group.MapGet("/attempts/{id}", GetAttempt);
    }

    private static async Task<IResult> CreateDocument(HttpContext context, CreateDocumentRequest body, AuthorityDatabase database)
    {
        var actor = Actor(context, "human");
        Require(Text(body.Title, 1, 200) && Bytes(body.Content, 0, 1048576));
        await using var connection = await database.Open();
        await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.ReadCommitted, CancellationToken.None);
        var session = new AuthoritySession(connection, transaction);
        if (!await session.Enabled(actor.Id, "human")) throw new AuthorityRequestException(401, "unauthorized");
        var document = (await session.One($"""
            INSERT INTO genesis_authority.documents(owner_id,title,content) VALUES ($1,$2,$3)
            RETURNING {DocumentColumns}
            """, Document, actor.Id, body.Title, body.Content))!;
        await session.Audit(document.Id, actor.Id, null, null, null, null, "document_created", null, "created",
            new { title = body.Title, version = document.Version });
        await transaction.CommitAsync(CancellationToken.None);
        return Results.Json(document, statusCode: 201);
    }

    private static async Task<IResult> GetDocument(HttpContext context, string id, AuthorityDatabase database)
    {
        var actor = Actor(context, "human");
        var documentId = Id(id);
        await using var connection = await database.Open();
        var session = new AuthoritySession(connection);
        var document = await session.One($"""
            SELECT {DocumentColumns} FROM genesis_authority.documents WHERE id=$1 AND owner_id=$2
            """, Document, documentId, actor.Id);
        return document is null ? Missing() : Results.Ok(document);
    }

    private static async Task<IResult> GetEvidence(HttpContext context, string id, AuthorityDatabase database)
    {
        var actor = Actor(context, "human");
        var documentId = Id(id);
        await using var connection = await database.Open();
        var session = new AuthoritySession(connection);
        if (!await session.Scalar<bool>("SELECT EXISTS(SELECT 1 FROM genesis_authority.documents WHERE id=$1 AND owner_id=$2)",
            documentId, actor.Id)) return Missing();
        var evidence = await session.Query("""
            SELECT id,document_id,requester_id,approver_id,proposal_id,grant_id,attempt_id,
                action,decision,outcome,details::text,created_at
            FROM genesis_authority.evidence WHERE document_id=$1 ORDER BY created_at,id
            """, Evidence, documentId);
        return Results.Ok(evidence);
    }

    private static async Task<IResult> CreateProposal(HttpContext context, CreateProposalRequest body, AuthorityDatabase database)
    {
        var actor = Actor(context, "agent");
        Require(body.DocumentId != Guid.Empty && body.ExpectedVersion >= 0 && Bytes(body.Text, 1, 8192)
            && body.TtlSeconds is >= 1 and <= 600);
        await using var connection = await database.Open();
        await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.ReadCommitted, CancellationToken.None);
        var session = new AuthoritySession(connection, transaction);
        var document = await LockDocument(session, body.DocumentId);
        if (document is null) return Missing();
        if (!await session.Enabled(actor.Id, "agent")) throw new AuthorityRequestException(401, "unauthorized");
        var proposalId = await session.Scalar<Guid>("""
            WITH stamp AS (SELECT clock_timestamp() AS value)
            INSERT INTO genesis_authority.proposals
                (agent_id,document_id,text,expected_version,expires_at,created_at)
            SELECT $1,$2,$3,$4,stamp.value+make_interval(secs=>$5),stamp.value FROM stamp
            RETURNING id
            """, actor.Id, body.DocumentId, body.Text, body.ExpectedVersion, body.TtlSeconds);
        var proposal = (await LoadProposal(session, proposalId))!;
        await session.Audit(proposal.DocumentId, actor.Id, null, proposal.Id, null, null,
            "proposal_created", null, "proposed", new
            {
                actionTuple = new { proposal.DocumentId, proposal.Operation, proposal.Text, proposal.ExpectedVersion },
                proposal.ExpiresAt, proposal.SingleUse
            });
        await transaction.CommitAsync(CancellationToken.None);
        return Results.Json(proposal, statusCode: 201);
    }

    private static async Task<IResult> GetProposal(HttpContext context, string id, AuthorityDatabase database)
    {
        var actor = Actor(context);
        var proposalId = Id(id);
        await using var connection = await database.Open();
        var session = new AuthoritySession(connection);
        var proposal = await session.One($"""
            SELECT {ProposalColumns}
            FROM genesis_authority.proposals p JOIN genesis_authority.principals a ON a.id=p.agent_id
            JOIN genesis_authority.documents d ON d.id=p.document_id
            WHERE p.id=$1 AND (($2='agent' AND p.agent_id=$3) OR ($2='human' AND d.owner_id=$3))
            """, Proposal, proposalId, actor.Kind, actor.Id);
        return proposal is null ? Missing() : Results.Ok(proposal);
    }

    private static async Task<IResult> Decide(HttpContext context, string id, DecisionRequest body, AuthorityDatabase database)
    {
        var actor = Actor(context, "human");
        var proposalId = Id(id);
        Require(body.Decision is "approved" or "rejected");
        await using var connection = await database.Open();
        await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.ReadCommitted, CancellationToken.None);
        var session = new AuthoritySession(connection, transaction);
        var proposal = await LoadProposal(session, proposalId);
        if (proposal is null) return Missing();
        var document = await LockDocument(session, proposal.DocumentId);
        if (document is null || document.OwnerId != actor.Id) return Missing();
        if (!await session.Enabled(actor.Id, "human")) throw new AuthorityRequestException(401, "unauthorized");
        // The document lock serializes the first approval before a decision row exists.
        var existing = await session.One("""
            SELECT d.proposal_id,d.decision,g.id FROM genesis_authority.decisions d
            LEFT JOIN genesis_authority.grants g ON g.proposal_id=d.proposal_id WHERE d.proposal_id=$1
            """, r => new DecisionDto(r.GetGuid(0), r.GetString(1), NullableGuid(r, 2)), proposalId);
        if (existing is not null)
        {
            if (existing.Decision != body.Decision) throw new AuthorityRequestException(409, "decision_conflict");
            return Results.Ok(existing);
        }
        if (body.Decision == "approved")
        {
            if (!await session.Enabled(proposal.AgentId, "agent"))
                throw new AuthorityRequestException(409, "decision_conflict");
            if (!await session.Scalar<bool>("SELECT clock_timestamp() < $1", proposal.ExpiresAt))
                throw new AuthorityRequestException(409, "proposal_expired");
        }
        await session.Execute("""
            INSERT INTO genesis_authority.decisions(proposal_id,approver_id,decision) VALUES ($1,$2,$3)
            """, proposalId, actor.Id, body.Decision);
        Guid? grantId = null;
        if (body.Decision == "approved")
            grantId = await session.Scalar<Guid>("""
                INSERT INTO genesis_authority.grants(proposal_id,document_id,agent_id,expires_at)
                VALUES ($1,$2,$3,$4) RETURNING id
                """, proposalId, proposal.DocumentId, proposal.AgentId, proposal.ExpiresAt);
        await session.Audit(proposal.DocumentId, actor.Id, actor.Id, proposalId, grantId, null,
            "proposal_decided", body.Decision, body.Decision, new
            {
                proposal.AgentId,
                actionTuple = new { proposal.DocumentId, proposal.Operation, proposal.Text, proposal.ExpectedVersion },
                proposal.ExpiresAt, proposal.SingleUse
            });
        await transaction.CommitAsync(CancellationToken.None);
        return Results.Ok(new DecisionDto(proposalId, body.Decision, grantId));
    }

    private static async Task<IResult> GetGrant(HttpContext context, string id, AuthorityDatabase database)
    {
        var actor = Actor(context, "human");
        var grantId = Id(id);
        await using var connection = await database.Open();
        var session = new AuthoritySession(connection);
        var grant = await session.One($"""
            SELECT {GrantColumns} FROM genesis_authority.grants
            WHERE id=$1 AND EXISTS (SELECT 1 FROM genesis_authority.documents d
                WHERE d.id=document_id AND d.owner_id=$2)
            """, Grant, grantId, actor.Id);
        return grant is null ? Missing() : Results.Ok(grant);
    }

    private static async Task<IResult> Revoke(HttpContext context, string id, RevokeRequest body, AuthorityDatabase database)
    {
        var actor = Actor(context, "human");
        var grantId = Id(id);
        Require(Text(body.Reason, 1, 500));
        await using var connection = await database.Open();
        await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.ReadCommitted, CancellationToken.None);
        var session = new AuthoritySession(connection, transaction);
        var target = await session.One("""
            SELECT p.document_id,p.id FROM genesis_authority.grants g
            JOIN genesis_authority.proposals p ON p.id=g.proposal_id WHERE g.id=$1
            """, r => new RevokeTarget(r.GetGuid(0), r.GetGuid(1)), grantId);
        if (target is null) return Missing();
        var document = await LockDocument(session, target.DocumentId);
        if (document is null || document.OwnerId != actor.Id) return Missing();
        var grant = await LockGrant(session, target.ProposalId);
        if (grant is null || grant.Id != grantId) return Missing();
        if (!await session.Enabled(actor.Id, "human")) throw new AuthorityRequestException(401, "unauthorized");
        if (grant.State is not ("consumed" or "revoked"))
        {
            await session.Execute("UPDATE genesis_authority.grants SET state='revoked' WHERE id=$1", grant.Id);
            await session.Execute("""
                INSERT INTO genesis_authority.revocations(grant_id,requester_id,reason) VALUES ($1,$2,$3)
                """, grant.Id, actor.Id, body.Reason);
            var proposal = (await LoadProposal(session, grant.ProposalId))!;
            await session.Audit(document.Id, actor.Id, actor.Id, grant.ProposalId, grant.Id, null,
                "grant_revoked", null, "revoked", new
                {
                    reason = body.Reason,
                    actionTuple = new { proposal.DocumentId, proposal.Operation, proposal.Text, proposal.ExpectedVersion }
                });
            grant = await LoadGrant(session, grant.Id);
        }
        await transaction.CommitAsync(CancellationToken.None);
        return Results.Ok(grant);
    }

    private static async Task<IResult> Execute(HttpContext context, ExecuteRequest body, AuthorityDatabase database)
    {
        var actor = Actor(context, "agent");
        Require(body.ProposalId != Guid.Empty && body.GrantId != Guid.Empty && body.DocumentId != Guid.Empty
            && body.ExpectedVersion >= 0 && Bytes(body.Text, 1, 8192) && Text(body.Operation, 0, 200));
        var key = Key(context.Request.Headers["Idempotency-Key"]);
        var fingerprint = SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(body, Json));
        // No accepted execution operation observes RequestAborted.
        await using var connection = await database.Open();
        await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.ReadCommitted, CancellationToken.None);
        var session = new AuthoritySession(connection, transaction);
        await session.Execute("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", $"{actor.Id:D}:execute:{key}");
        var cached = await session.One("""
            SELECT fingerprint,response_status,response_body::text FROM genesis_authority.idempotency
            WHERE principal_id=$1 AND operation='execute' AND key=$2
            """, r => new CachedResult((byte[])r.GetValue(0), r.GetInt32(1), r.GetString(2)), actor.Id, key);
        if (cached is not null)
        {
            if (!await session.Enabled(actor.Id, "agent")) throw new AuthorityRequestException(401, "unauthorized");
            if (!CryptographicOperations.FixedTimeEquals(cached.Fingerprint, fingerprint))
                throw new AuthorityRequestException(409, "idempotency_conflict");
            await transaction.CommitAsync(CancellationToken.None);
            return Historical(cached.Body, cached.Status);
        }

        var proposal = await LoadProposal(session, body.ProposalId);
        // Unknown/foreign proposals never associate owner evidence or lock supplied targets.
        var ownProposal = proposal is not null && proposal.AgentId == actor.Id;
        DocumentDto? document = null;
        GrantDto? grant = null;
        DecisionRecord? decision = null;
        if (ownProposal)
        {
            document = await LockDocument(session, proposal!.DocumentId);
            grant = await LockGrant(session, proposal.Id);
            decision = await session.One("""
                SELECT approver_id,decision FROM genesis_authority.decisions WHERE proposal_id=$1
                """, r => new DecisionRecord(r.GetGuid(0), r.GetString(1)), proposal.Id);
        }
        // Stable principal locks prevent disablement/role changes during the decisive operation.
        var principals = await session.Query("""
            SELECT id,kind,enabled FROM genesis_authority.principals
            WHERE id=ANY($1) ORDER BY id FOR SHARE
            """, r => new PrincipalState(r.GetGuid(0), r.GetString(1), r.GetBoolean(2)),
            new Guid[] { actor.Id, decision?.ApproverId ?? actor.Id });
        if (!principals.Any(p => p.Id == actor.Id && p.Kind == "agent" && p.Enabled))
            throw new AuthorityRequestException(401, "unauthorized");
        var currentTime = await session.Scalar<DateTime>("SELECT clock_timestamp()");
        var denial = Denial(body, actor, proposal, document, grant, decision, principals, currentTime);
        long? documentVersion = null;
        if (denial is null)
        {
            documentVersion = await session.Scalar<long>("""
                UPDATE genesis_authority.documents SET content=content || $1 || chr(10),version=version+1
                WHERE id=$2 RETURNING version
                """, proposal!.Text, proposal.DocumentId);
            await session.Execute("UPDATE genesis_authority.grants SET state='consumed' WHERE id=$1", grant!.Id);
        }
        var allowed = denial is null;
        var attempt = (await session.One($"""
            INSERT INTO genesis_authority.attempts
                (requester_id,proposal_id,grant_id,document_id,operation,text,expected_version,outcome,reason,document_version)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING {AttemptColumns}
            """, Attempt, actor.Id, body.ProposalId, body.GrantId, body.DocumentId, body.Operation,
            body.Text, body.ExpectedVersion, allowed ? "allowed" : "denied",
            allowed ? "authorized" : "authorization_denied", documentVersion))!;
        await session.Audit(ownProposal ? proposal!.DocumentId : null, actor.Id,
            ownProposal ? decision?.ApproverId : null, ownProposal ? proposal!.Id : null,
            ownProposal ? grant?.Id : null, attempt.Id, "execute", ownProposal ? decision?.Decision : null,
            attempt.Outcome, new { reason = denial ?? "authorized", actionTuple = body });
        var responseStatus = allowed ? 200 : 403;
        var responseBody = await session.Scalar<string>("""
            INSERT INTO genesis_authority.idempotency
                (principal_id,operation,key,fingerprint,attempt_id,response_status,response_body)
            VALUES ($1,'execute',$2,$3,$4,$5,$6::jsonb) RETURNING response_body::text
            """, actor.Id, key, fingerprint, attempt.Id, responseStatus, JsonSerializer.Serialize(attempt, Json));
        await transaction.CommitAsync(CancellationToken.None);
        return Historical(responseBody, responseStatus);
    }

    private static string? Denial(ExecuteRequest body, AuthorityActor actor, ProposalDto? proposal,
        DocumentDto? document, GrantDto? grant, DecisionRecord? decision, List<PrincipalState> principals, DateTime time)
    {
        if (proposal is null) return "proposal_not_found";
        if (proposal.AgentId != actor.Id) return "proposal_agent_mismatch";
        if (document is null) return "document_not_found";
        if (decision is null || decision.Decision != "approved") return "approval_required";
        if (decision.ApproverId != document.OwnerId) return "approver_not_current_owner";
        if (!principals.Any(p => p.Id == decision.ApproverId && p.Kind == "human" && p.Enabled))
            return "approver_not_enabled_human";
        if (grant is null) return "grant_not_found";
        if (grant.Id != body.GrantId) return "grant_mismatch";
        if (grant.ProposalId != proposal.Id || grant.DocumentId != proposal.DocumentId
            || grant.AgentId != actor.Id || grant.ExpiresAt != proposal.ExpiresAt || !grant.SingleUse)
            return "grant_tuple_mismatch";
        if (body.DocumentId != proposal.DocumentId) return "document_mismatch";
        if (body.Operation != "append" || body.Operation != proposal.Operation) return "operation_mismatch";
        if (!string.Equals(body.Text, proposal.Text, StringComparison.Ordinal)) return "text_mismatch";
        if (body.ExpectedVersion != proposal.ExpectedVersion) return "expected_version_mismatch";
        if (grant.State is "consumed" or "revoked") return $"grant_{grant.State}";
        if (grant.ExpiresAt <= time || proposal.ExpiresAt <= time) return "grant_expired";
        if (grant.State != "active") return "grant_not_active";
        if (document.Version != proposal.ExpectedVersion) return "document_version_mismatch";
        if (document.Version == long.MaxValue) return "document_version_limit";
        if (!Bytes(document.Content + proposal.Text + "\n", 0, 1048576)) return "document_content_limit";
        return null;
    }

    private static async Task<IResult> GetAttemptByKey(HttpContext context, AuthorityDatabase database)
    {
        var actor = Actor(context, "agent");
        var key = Key(context.Request.Query["key"]);
        await using var connection = await database.Open();
        var session = new AuthoritySession(connection);
        var result = await session.One("""
            SELECT response_body::text FROM genesis_authority.idempotency
            WHERE principal_id=$1 AND operation='execute' AND key=$2
            """, r => new BodyRecord(r.GetString(0)), actor.Id, key);
        return result is null ? Missing() : Historical(result.Body, 200);
    }

    private static async Task<IResult> GetAttempt(HttpContext context, string id, AuthorityDatabase database)
    {
        var actor = Actor(context);
        var attemptId = Id(id);
        await using var connection = await database.Open();
        var session = new AuthoritySession(connection);
        var attempt = await session.One($"""
            SELECT {AttemptColumns} FROM genesis_authority.attempts
            WHERE id=$1 AND (($2='agent' AND requester_id=$3) OR
                ($2='human' AND EXISTS (SELECT 1 FROM genesis_authority.evidence e
                    JOIN genesis_authority.documents d ON d.id=e.document_id
                    WHERE e.attempt_id=genesis_authority.attempts.id AND d.owner_id=$3)))
            """, Attempt, attemptId, actor.Kind, actor.Id);
        return attempt is null ? Missing() : Results.Ok(attempt);
    }

    private static Task<DocumentDto?> LockDocument(AuthoritySession session, Guid id) =>
        session.One($"SELECT {DocumentColumns} FROM genesis_authority.documents WHERE id=$1 FOR UPDATE", Document, id);
    private static Task<ProposalDto?> LoadProposal(AuthoritySession session, Guid id) =>
        session.One($"""
            SELECT {ProposalColumns} FROM genesis_authority.proposals p
            JOIN genesis_authority.principals a ON a.id=p.agent_id WHERE p.id=$1
            """, Proposal, id);
    private static Task<GrantDto?> LoadGrant(AuthoritySession session, Guid id) =>
        session.One($"SELECT {GrantColumns} FROM genesis_authority.grants WHERE id=$1", Grant, id);
    private static Task<GrantDto?> LockGrant(AuthoritySession session, Guid proposalId) =>
        session.One($"SELECT {GrantColumns} FROM genesis_authority.grants WHERE proposal_id=$1 FOR UPDATE", Grant, proposalId);
    private static IResult Missing() => Results.Json(new { error = "not_found" }, statusCode: 404);
    private static IResult Historical(string body, int status) => Results.Content(body, "application/json", statusCode: status);

    private sealed record CachedResult(byte[] Fingerprint, int Status, string Body);
    private sealed record BodyRecord(string Body);
    private sealed record DecisionRecord(Guid ApproverId, string Decision);
    private sealed record PrincipalState(Guid Id, string Kind, bool Enabled);
    private sealed record RevokeTarget(Guid DocumentId, Guid ProposalId);
}
