using System.Data;
using System.Security.Cryptography;
using System.Text.Json;
using Npgsql;
using static HumanAuthority.AuthorityValidation;

namespace HumanAuthority;

/// <summary>
/// Additive Development/Test reimbursement authority. Membership is provisioned out of band;
/// neither a model nor an API caller can enroll itself or appoint itself manager.
/// Every effect, denial receipt and retry result commits in one PostgreSQL transaction.
/// </summary>
public static class ReimbursementEndpoints
{
    private const long MaximumMinor = 1_000_000_000_000;
    private const string RecordColumns = "id,organization_id,project_id,manager_id,category,amount_minor,currency,status,version,created_at";
    private const string ProposalColumns = "id,organization_id,reimbursement_id,agent_id,manager_id,project_id,category,amount_minor,max_amount_minor,currency,expected_version,expires_at,created_at";
    private const string AttemptColumns = "id,organization_id,requester_id,proposal_id,grant_id,reimbursement_id,outcome,reason,reimbursement_version,created_at";

    public static void MapReimbursementEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/v1/authority/reimbursements");
        group.MapPost("/records", CreateRecord);
        group.MapGet("/records/{id}", GetRecord);
        group.MapGet("/records/{id}/proposal-context", GetAgentContext);
        group.MapGet("/records/{id}/evidence", GetEvidence);
        group.MapPost("/proposals", Propose);
        group.MapGet("/proposals/{id}", GetProposal);
        group.MapPost("/proposals/{id}/decision", Decide);
        group.MapGet("/grants/{id}", GetGrant);
        group.MapPost("/grants/{id}/revoke", Revoke);
        group.MapPost("/execute", Execute);
        group.MapGet("/attempts/by-key", GetByKey);
    }

    private static bool Amount(long value) => value is >= 1 and <= MaximumMinor;
    private static bool Category(string? value) => Text(value, 1, 100) && !string.IsNullOrWhiteSpace(value);
    private static IResult Missing() => Results.Json(new { error = "not_found" }, statusCode: 404);
    private static IResult Historical(string body, int status) => Results.Content(body, "application/json", statusCode: status);

    private static ReimbursementDto Record(NpgsqlDataReader r) => new(r.GetGuid(0), r.GetGuid(1), r.GetGuid(2),
        r.GetGuid(3), r.GetString(4), r.GetInt64(5), r.GetString(6), r.GetString(7), r.GetInt64(8), r.GetDateTime(9));
    private static ReimbursementProposalDto Proposal(NpgsqlDataReader r) => new(r.GetGuid(0), r.GetGuid(1),
        r.GetGuid(2), r.GetGuid(3), r.GetGuid(4), r.GetGuid(5), r.GetString(6), r.GetInt64(7), r.GetInt64(8),
        r.GetString(9), r.GetInt64(10), r.GetDateTime(11), r.GetDateTime(12));
    private static ReimbursementGrantDto Grant(NpgsqlDataReader r) => new(r.GetGuid(0), r.GetGuid(1), r.GetString(2), r.GetDateTime(3));
    private static ReimbursementAttemptDto Attempt(NpgsqlDataReader r) => new(r.GetGuid(0),
        r.IsDBNull(1) ? null : r.GetGuid(1), r.GetGuid(2), r.GetGuid(3), r.GetGuid(4), r.GetGuid(5), r.GetString(6),
        r.GetString(7), r.IsDBNull(8) ? null : r.GetInt64(8), r.GetDateTime(9));
    private static Task<ReimbursementDto?> LockRecord(AuthoritySession s, Guid id) =>
        s.One($"SELECT {RecordColumns} FROM genesis_reimbursements.reimbursements WHERE id=$1 FOR UPDATE", Record, id);
    // Entitlement filtering happens before locking a supplied UUID; the locked
    // policy check below still guards membership changes during the lock wait.
    private static Task<ReimbursementDto?> LockVisibleRecord(AuthoritySession s, Guid id, AuthorityActor actor) =>
        s.One($"""
            SELECT {RecordColumns} FROM genesis_reimbursements.reimbursements r WHERE id=$1
            AND (($2='human' AND manager_id=$3) OR $2='agent')
            AND EXISTS (SELECT 1 FROM genesis_reimbursements.memberships m
                WHERE m.organization_id=r.organization_id AND m.principal_id=$3 AND m.enabled
                AND m.role=CASE WHEN $2='human' THEN 'manager' ELSE 'agent' END)
            FOR UPDATE OF r
            """, Record, id, actor.Kind, actor.Id);
    private static Task<ReimbursementProposalDto?> LoadProposal(AuthoritySession s, Guid id) =>
        s.One($"SELECT {ProposalColumns} FROM genesis_reimbursements.proposals WHERE id=$1", Proposal, id);
    private static Task<ReimbursementGrantDto?> LoadGrant(AuthoritySession s, Guid proposalId, bool locked = false) =>
        s.One("SELECT id,proposal_id,state,created_at FROM genesis_reimbursements.grants WHERE proposal_id=$1" +
              (locked ? " FOR UPDATE" : ""), Grant, proposalId);

    // Lock order: record -> grant -> organization -> project -> sorted principals -> sorted memberships.
    // These locks serialize offboarding/disablement with the decisive check, including after waits.
    private static async Task<bool> Scope(AuthoritySession s, Guid organizationId, Guid projectId,
        Guid managerId, Guid? agentId = null)
    {
        var state = await LockScope(s, organizationId, projectId, managerId, agentId);
        return state.Manager && (!agentId.HasValue || state.Agent);
    }

    private static async Task<PolicyScope> LockScope(AuthoritySession s, Guid organizationId, Guid projectId,
        Guid managerId, Guid? agentId)
    {
        var org = await s.One("SELECT enabled FROM genesis_reimbursements.organizations WHERE id=$1 FOR SHARE",
            r => new EnabledState(r.GetBoolean(0)), organizationId);
        if (org?.Enabled != true) return new(false, false);
        var project = await s.One("""
            SELECT enabled FROM genesis_reimbursements.projects WHERE id=$1 AND organization_id=$2 FOR SHARE
            """, r => new EnabledState(r.GetBoolean(0)), projectId, organizationId);
        if (project?.Enabled != true) return new(false, false);
        var ids = agentId.HasValue ? new[] { managerId, agentId.Value } : new[] { managerId };
        var principals = await s.Query("""
            SELECT id,kind,enabled FROM genesis_authority.principals WHERE id=ANY($1) ORDER BY id FOR SHARE
            """, r => new PrincipalState(r.GetGuid(0), r.GetString(1), r.GetBoolean(2)), ids);
        var members = await s.Query("""
            SELECT principal_id,role,enabled FROM genesis_reimbursements.memberships
            WHERE organization_id=$1 AND principal_id=ANY($2) ORDER BY principal_id FOR SHARE
            """, r => new PrincipalState(r.GetGuid(0), r.GetString(1), r.GetBoolean(2)), organizationId, ids);
        return new PolicyScope(
            principals.Any(p => p.Id == managerId && p.Kind == "human" && p.Enabled)
                && members.Any(p => p.Id == managerId && p.Kind == "manager" && p.Enabled),
            agentId.HasValue && principals.Any(p => p.Id == agentId && p.Kind == "agent" && p.Enabled)
                && members.Any(p => p.Id == agentId && p.Kind == "agent" && p.Enabled));
    }

    private static Task Audit(AuthoritySession s, Guid? org, Guid? record, Guid requester, Guid? approver,
        Guid? proposal, Guid? grant, Guid? attempt, string action, string outcome, object details) => s.Execute("""
        INSERT INTO genesis_reimbursements.evidence
            (organization_id,reimbursement_id,requester_id,approver_id,proposal_id,grant_id,attempt_id,action,outcome,details)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
        """, org, record, requester, approver, proposal, grant, attempt, action, outcome, JsonSerializer.Serialize(details, Json));

    private static async Task<IResult> CreateRecord(HttpContext context, CreateReimbursementRequest body, AuthorityDatabase db)
    {
        var actor = Actor(context, "human");
        Require(body.OrganizationId != Guid.Empty && body.ProjectId != Guid.Empty && Category(body.Category)
            && Amount(body.AmountMinor) && body.Currency == "USD");
        await using var c = await db.Open();
        await using var tx = await c.BeginTransactionAsync(IsolationLevel.ReadCommitted, CancellationToken.None);
        var s = new AuthoritySession(c, tx);
        if (!await Scope(s, body.OrganizationId, body.ProjectId, actor.Id)) return Missing();
        var record = (await s.One($"""
            INSERT INTO genesis_reimbursements.reimbursements
                (organization_id,project_id,manager_id,category,amount_minor,currency)
            VALUES ($1,$2,$3,$4,$5,$6) RETURNING {RecordColumns}
            """, Record, body.OrganizationId, body.ProjectId, actor.Id, body.Category, body.AmountMinor, body.Currency))!;
        await Audit(s, record.OrganizationId, record.Id, actor.Id, actor.Id, null, null, null,
            "reimbursement_created", "created", record);
        await tx.CommitAsync(CancellationToken.None);
        return Results.Json(record, statusCode: 201);
    }

    private static async Task<IResult> GetRecord(HttpContext context, string id, AuthorityDatabase db) =>
        await ReadRecord(context, id, db, evidence: false);
    private static async Task<IResult> GetEvidence(HttpContext context, string id, AuthorityDatabase db) =>
        await ReadRecord(context, id, db, evidence: true);
    private static async Task<IResult> GetAgentContext(HttpContext context, string id, AuthorityDatabase db) =>
        await ReadRecord(context, id, db, evidence: false, proposalContext: true);
    private static async Task<IResult> ReadRecord(HttpContext context, string id, AuthorityDatabase db, bool evidence,
        bool proposalContext = false)
    {
        var actor = Actor(context, proposalContext ? "agent" : "human");
        var recordId = Id(id);
        await using var c = await db.Open();
        await using var tx = await c.BeginTransactionAsync(IsolationLevel.ReadCommitted, CancellationToken.None);
        var s = new AuthoritySession(c, tx);
        var record = await LockVisibleRecord(s, recordId, actor);
        if (record is null || (!proposalContext && record.ManagerId != actor.Id) ||
            !await Scope(s, record.OrganizationId, record.ProjectId, record.ManagerId,
                proposalContext ? actor.Id : null)) return Missing();
        if (proposalContext && record.Status != "pending")
            throw new AuthorityRequestException(409, "reimbursement_stale");
        IResult result = Results.Ok(record);
        if (evidence)
        {
            var rows = await s.Query("""
                SELECT id,organization_id,reimbursement_id,requester_id,approver_id,proposal_id,grant_id,
                    attempt_id,action,outcome,details::text,created_at
                FROM genesis_reimbursements.evidence WHERE organization_id=$1 AND reimbursement_id=$2
                ORDER BY created_at,id
                """, r => new
                {
                    id = r.GetGuid(0), organizationId = r.GetGuid(1), reimbursementId = r.GetGuid(2), requesterId = r.GetGuid(3),
                    approverId = AuthorityRows.NullableGuid(r, 4), proposalId = AuthorityRows.NullableGuid(r, 5),
                    grantId = AuthorityRows.NullableGuid(r, 6), attemptId = AuthorityRows.NullableGuid(r, 7),
                    action = r.GetString(8), outcome = r.GetString(9),
                    details = JsonSerializer.Deserialize<JsonElement>(r.GetString(10)), createdAt = r.GetDateTime(11)
                }, record.OrganizationId, record.Id);
            result = Results.Ok(rows);
        }
        await tx.CommitAsync(CancellationToken.None);
        return result;
    }

    private static async Task<IResult> Propose(HttpContext context, CreateReimbursementProposalRequest body, AuthorityDatabase db)
    {
        var actor = Actor(context, "agent");
        Require(body.ReimbursementId != Guid.Empty && body.ExpectedVersion >= 0 && Amount(body.MaxAmountMinor)
            && body.TtlSeconds is >= 1 and <= 600);
        await using var c = await db.Open();
        await using var tx = await c.BeginTransactionAsync(IsolationLevel.ReadCommitted, CancellationToken.None);
        var s = new AuthoritySession(c, tx);
        var record = await LockVisibleRecord(s, body.ReimbursementId, actor);
        if (record is null || !await Scope(s, record.OrganizationId, record.ProjectId, record.ManagerId, actor.Id)) return Missing();
        if (record.Status != "pending" || record.Version != body.ExpectedVersion)
            throw new AuthorityRequestException(409, "reimbursement_stale");
        var proposal = (await s.One($"""
            WITH stamp AS (SELECT clock_timestamp() AS value)
            INSERT INTO genesis_reimbursements.proposals
                (organization_id,reimbursement_id,agent_id,manager_id,project_id,category,amount_minor,
                 max_amount_minor,currency,expected_version,expires_at,created_at)
            SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,stamp.value+make_interval(secs=>$11),stamp.value FROM stamp
            RETURNING {ProposalColumns}
            """, Proposal, record.OrganizationId, record.Id, actor.Id, record.ManagerId, record.ProjectId,
            record.Category, record.AmountMinor, body.MaxAmountMinor, record.Currency, record.Version, body.TtlSeconds))!;
        await Audit(s, record.OrganizationId, record.Id, actor.Id, null, proposal.Id, null, null,
            "proposal_created", "proposed", proposal);
        await tx.CommitAsync(CancellationToken.None);
        return Results.Json(proposal, statusCode: 201);
    }

    private static async Task<IResult> GetProposal(HttpContext context, string id, AuthorityDatabase db) =>
        await ReadProposal(context, Id(id), db, grantId: null);
    private static async Task<IResult> GetGrant(HttpContext context, string id, AuthorityDatabase db) =>
        await ReadProposal(context, null, db, Id(id));
    private static async Task<IResult> ReadProposal(HttpContext context, Guid? proposalId, AuthorityDatabase db, Guid? grantId)
    {
        var actor = Actor(context);
        await using var c = await db.Open();
        await using var tx = await c.BeginTransactionAsync(IsolationLevel.ReadCommitted, CancellationToken.None);
        var s = new AuthoritySession(c, tx);
        if (grantId.HasValue)
        {
            var link = await s.One("SELECT proposal_id FROM genesis_reimbursements.grants WHERE id=$1",
                r => new Identifier(r.GetGuid(0)), grantId.Value);
            if (link is null) return Missing();
            proposalId = link.Id;
        }
        var proposal = await LoadProposal(s, proposalId!.Value);
        if (proposal is null || !Bound(actor, proposal)) return Missing();
        var record = await LockVisibleRecord(s, proposal.ReimbursementId, actor);
        if (record is null || !await Scope(s, record.OrganizationId, record.ProjectId, record.ManagerId,
                actor.Kind == "agent" ? actor.Id : null)) return Missing();
        var grant = grantId.HasValue ? await LoadGrant(s, proposal.Id) : null;
        await tx.CommitAsync(CancellationToken.None);
        return grantId.HasValue ? Results.Ok(grant) : Results.Ok(proposal);
    }
    private static bool Bound(AuthorityActor actor, ReimbursementProposalDto p) =>
        (actor.Kind == "human" && actor.Id == p.ManagerId) || (actor.Kind == "agent" && actor.Id == p.AgentId);

    private static async Task<IResult> Decide(HttpContext context, string id, DecisionRequest body, AuthorityDatabase db)
    {
        var actor = Actor(context, "human");
        var proposalId = Id(id);
        Require(body.Decision is "approved" or "rejected");
        await using var c = await db.Open();
        await using var tx = await c.BeginTransactionAsync(IsolationLevel.ReadCommitted, CancellationToken.None);
        var s = new AuthoritySession(c, tx);
        var p = await LoadProposal(s, proposalId);
        if (p is null || p.ManagerId != actor.Id) return Missing();
        var record = await LockVisibleRecord(s, p.ReimbursementId, actor);
        if (record is null) return Missing();
        // Lock both identities and memberships once, in sorted order. Rejection and
        // historical decision replay require the manager, but not an enabled agent.
        var scope = await LockScope(s, record.OrganizationId, record.ProjectId, actor.Id, p.AgentId);
        if (!scope.Manager) return Missing();
        var existing = await s.One("""
            SELECT d.proposal_id,d.decision,g.id FROM genesis_reimbursements.decisions d
            LEFT JOIN genesis_reimbursements.grants g ON g.proposal_id=d.proposal_id WHERE d.proposal_id=$1
            """, r => new DecisionDto(r.GetGuid(0), r.GetString(1), AuthorityRows.NullableGuid(r, 2)), p.Id);
        if (existing is not null)
        {
            if (existing.Decision != body.Decision) throw new AuthorityRequestException(409, "decision_conflict");
            await tx.CommitAsync(CancellationToken.None);
            return Results.Ok(existing);
        }
        if (body.Decision == "approved")
        {
            if (!scope.Agent) throw new AuthorityRequestException(409, "proposal_unavailable");
            if (record.Status != "pending" || record.Version != p.ExpectedVersion)
                throw new AuthorityRequestException(409, "proposal_stale");
            if (record.AmountMinor > p.MaxAmountMinor) throw new AuthorityRequestException(409, "scope_exceeded");
            if (!await s.Scalar<bool>("SELECT clock_timestamp() < $1", p.ExpiresAt))
                throw new AuthorityRequestException(409, "proposal_expired");
        }
        await s.Execute("INSERT INTO genesis_reimbursements.decisions(proposal_id,approver_id,decision) VALUES ($1,$2,$3)",
            p.Id, actor.Id, body.Decision);
        Guid? grantId = null;
        if (body.Decision == "approved")
            grantId = await s.Scalar<Guid>("INSERT INTO genesis_reimbursements.grants(proposal_id) VALUES ($1) RETURNING id", p.Id);
        await Audit(s, p.OrganizationId, record.Id, actor.Id, actor.Id, p.Id, grantId, null,
            "proposal_decided", body.Decision, p);
        await tx.CommitAsync(CancellationToken.None);
        return Results.Ok(new DecisionDto(p.Id, body.Decision, grantId));
    }

    private static async Task<IResult> Revoke(HttpContext context, string id, RevokeRequest body, AuthorityDatabase db)
    {
        var actor = Actor(context, "human");
        var grantId = Id(id);
        Require(Text(body.Reason, 1, 500) && !string.IsNullOrWhiteSpace(body.Reason));
        await using var c = await db.Open();
        await using var tx = await c.BeginTransactionAsync(IsolationLevel.ReadCommitted, CancellationToken.None);
        var s = new AuthoritySession(c, tx);
        var link = await s.One("SELECT proposal_id FROM genesis_reimbursements.grants WHERE id=$1", r => new Identifier(r.GetGuid(0)), grantId);
        if (link is null) return Missing();
        var p = await LoadProposal(s, link.Id);
        if (p is null || p.ManagerId != actor.Id) return Missing();
        var record = await LockVisibleRecord(s, p.ReimbursementId, actor);
        var grant = await LoadGrant(s, p.Id, locked: true);
        if (record is null || grant is null || !await Scope(s, record.OrganizationId, record.ProjectId, actor.Id)) return Missing();
        if (grant.State == "active")
        {
            await s.Execute("UPDATE genesis_reimbursements.grants SET state='revoked' WHERE id=$1", grant.Id);
            await s.Execute("INSERT INTO genesis_reimbursements.revocations(grant_id,requester_id,reason) VALUES ($1,$2,$3)",
                grant.Id, actor.Id, body.Reason);
            await Audit(s, p.OrganizationId, p.ReimbursementId, actor.Id, actor.Id, p.Id, grant.Id, null,
                "grant_revoked", "revoked", new { reason = body.Reason, proposal = p });
            grant = await LoadGrant(s, p.Id);
        }
        await tx.CommitAsync(CancellationToken.None);
        return Results.Ok(grant);
    }

    private static async Task<IResult> Execute(HttpContext context, ExecuteReimbursementRequest body, AuthorityDatabase db)
    {
        var actor = Actor(context, "agent");
        Require(body.ProposalId != Guid.Empty && body.GrantId != Guid.Empty && body.ReimbursementId != Guid.Empty
            && body.OrganizationId != Guid.Empty && body.ProjectId != Guid.Empty && Category(body.Category)
            && Amount(body.AmountMinor) && Text(body.Currency, 1, 20) && body.ExpectedVersion >= 0 && Text(body.Operation, 1, 100));
        var key = Key(context.Request.Headers["Idempotency-Key"]);
        var fingerprint = SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(body, Json));
        await using var c = await db.Open();
        await using var tx = await c.BeginTransactionAsync(IsolationLevel.ReadCommitted, CancellationToken.None);
        var s = new AuthoritySession(c, tx);
        // Separate schema/namespace prevents collisions with document append retries.
        await s.Execute("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", $"{actor.Id:D}:reimbursement:{key}");
        var cached = await s.One("""
            SELECT fingerprint,response_status,response_body::text,attempt_id FROM genesis_reimbursements.idempotency
            WHERE principal_id=$1 AND key=$2
            """, r => new Cached((byte[])r.GetValue(0), r.GetInt32(1), r.GetString(2), r.GetGuid(3)), actor.Id, key);
        var p = await LoadProposal(s, body.ProposalId);
        var own = p is not null && p.AgentId == actor.Id;
        ReimbursementDto? record = null;
        ReimbursementGrantDto? grant = null;
        DecisionState? decision = null;
        var validScope = false;
        if (own)
        {
            record = await LockRecord(s, p!.ReimbursementId);
            grant = await LoadGrant(s, p.Id, locked: true);
            if (record is not null)
                validScope = await Scope(s, record.OrganizationId, record.ProjectId, record.ManagerId, actor.Id);
            decision = await s.One("SELECT approver_id,decision FROM genesis_reimbursements.decisions WHERE proposal_id=$1",
                r => new DecisionState(r.GetGuid(0), r.GetString(1)), p.Id);
        }
        if (!await s.Enabled(actor.Id, "agent")) throw new AuthorityRequestException(401, "unauthorized");
        if (cached is not null)
        {
            if (!CryptographicOperations.FixedTimeEquals(cached.Fingerprint, fingerprint))
                throw new AuthorityRequestException(409, "idempotency_conflict");
            // Unknown/foreign attempts have no resource scope and carry only the caller's supplied IDs.
            if (own && !validScope) return Missing();
            await tx.CommitAsync(CancellationToken.None);
            return Historical(cached.Body, cached.Status);
        }
        var time = await s.Scalar<DateTime>("SELECT clock_timestamp()");
        var denial = Denial(body, p, record, grant, decision, own, validScope, time);
        long? version = null;
        if (denial is null)
        {
            version = await s.Scalar<long>("""
                UPDATE genesis_reimbursements.reimbursements SET status='approved',version=version+1 WHERE id=$1 RETURNING version
                """, record!.Id);
            await s.Execute("UPDATE genesis_reimbursements.grants SET state='consumed' WHERE id=$1", grant!.Id);
        }
        var attempt = (await s.One($"""
            INSERT INTO genesis_reimbursements.attempts
                (organization_id,requester_id,proposal_id,grant_id,reimbursement_id,outcome,reason,reimbursement_version)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING {AttemptColumns}
            """, Attempt, own && validScope ? p!.OrganizationId : null, actor.Id, body.ProposalId, body.GrantId,
            body.ReimbursementId, denial is null ? "allowed" : "denied", denial is null ? "authorized" : "authorization_denied", version))!;
        await Audit(s, own && validScope ? p!.OrganizationId : null, own && validScope ? p!.ReimbursementId : null, actor.Id,
            own && validScope ? p!.ManagerId : null, own && validScope ? p!.Id : null, own && validScope ? grant?.Id : null,
            attempt.Id, "execute", attempt.Outcome, new { reason = own && validScope ? denial ?? "authorized" : "authorization_denied", actionTuple = body });
        var status = denial is null ? 200 : 403;
        var response = JsonSerializer.Serialize(attempt, Json);
        await s.Execute("""
            INSERT INTO genesis_reimbursements.idempotency(principal_id,key,fingerprint,attempt_id,response_status,response_body)
            VALUES ($1,$2,$3,$4,$5,$6::jsonb)
            """, actor.Id, key, fingerprint, attempt.Id, status, response);
        await tx.CommitAsync(CancellationToken.None);
        return Historical(response, status);
    }

    private static string? Denial(ExecuteReimbursementRequest body, ReimbursementProposalDto? p,
        ReimbursementDto? r, ReimbursementGrantDto? g, DecisionState? decision, bool own, bool scope, DateTime time)
    {
        if (!own || p is null || r is null || !scope) return "authorization_denied";
        if (decision is null || decision.Decision != "approved" || decision.ApproverId != p.ManagerId) return "approval_required";
        if (g is null || g.Id != body.GrantId) return "grant_mismatch";
        if (g.State != "active") return "grant_" + g.State;
        if (p.ExpiresAt <= time) return "grant_expired";
        if (r.Status != "pending" || r.Version != p.ExpectedVersion) return "reimbursement_stale";
        if (r.Id != body.ReimbursementId || r.OrganizationId != body.OrganizationId || r.ProjectId != body.ProjectId
            || r.ManagerId != p.ManagerId || r.Category != body.Category || r.AmountMinor != body.AmountMinor
            || body.Currency != "USD" || r.Currency != body.Currency || body.ExpectedVersion != p.ExpectedVersion
            || body.Operation != "approve_reimbursement" || p.OrganizationId != r.OrganizationId || p.ProjectId != r.ProjectId
            || p.Category != r.Category || p.AmountMinor != r.AmountMinor || p.Currency != r.Currency) return "scope_mismatch";
        return r.AmountMinor > p.MaxAmountMinor ? "scope_exceeded" : null;
    }

    private static async Task<IResult> GetByKey(HttpContext context, AuthorityDatabase db)
    {
        var actor = Actor(context, "agent");
        var key = Key(context.Request.Query["key"]);
        await using var c = await db.Open();
        await using var tx = await c.BeginTransactionAsync(IsolationLevel.ReadCommitted, CancellationToken.None);
        var s = new AuthoritySession(c, tx);
        var result = await s.One("""
            SELECT i.response_body::text,a.proposal_id FROM genesis_reimbursements.idempotency i
            JOIN genesis_reimbursements.attempts a ON a.id=i.attempt_id WHERE i.principal_id=$1 AND i.key=$2
            """, r => new StoredBody(r.GetString(0), r.GetGuid(1)), actor.Id, key);
        if (result is null) return Missing();
        var p = await LoadProposal(s, result.ProposalId);
        if (p is not null && p.AgentId == actor.Id)
        {
            var r = await LockRecord(s, p.ReimbursementId);
            if (r is null || !await Scope(s, r.OrganizationId, r.ProjectId, r.ManagerId, actor.Id)) return Missing();
        }
        if (!await s.Enabled(actor.Id, "agent")) throw new AuthorityRequestException(401, "unauthorized");
        await tx.CommitAsync(CancellationToken.None);
        return Historical(result.Body, 200);
    }

    private sealed record PolicyScope(bool Manager, bool Agent);
    private sealed record EnabledState(bool Enabled);
    private sealed record PrincipalState(Guid Id, string Kind, bool Enabled);
    private sealed record Identifier(Guid Id);
    private sealed record DecisionState(Guid ApproverId, string Decision);
    private sealed record Cached(byte[] Fingerprint, int Status, string Body, Guid AttemptId);
    private sealed record StoredBody(string Body, Guid ProposalId);
}
