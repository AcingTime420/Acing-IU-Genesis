using System.Text.Json;
using System.Text.Json.Nodes;
using Npgsql;

namespace HumanAuthority.IntegrationTests;

[Collection(AuthorityCollection.Name)]
public sealed class ReimbursementTests(AuthorityFixture fixture)
{
    private readonly AuthorityFixture f = fixture;
    private const string Prefix = "/reimbursements";
    private sealed record Scope(Guid Organization, Guid Project, Guid Record, Guid Proposal, Guid Grant,
        Actor Manager, Actor Agent, long Amount = 12_500, string Category = "supplies")
    {
        public object Execute => new
        {
            organizationId = Organization, projectId = Project, reimbursementId = Record,
            proposalId = Proposal, grantId = Grant, amountMinor = Amount, category = Category,
            currency = "USD", expectedVersion = 0L, operation = "approve_reimbursement"
        };
    }

    private static string Key() => Guid.NewGuid().ToString("N");
    private static void Status(ApiResponse response, int expected) =>
        Assert.True(response.Status == expected, $"Expected {expected}; received {response.Status}: {response.Body}");
    private static void Same(ApiResponse first, ApiResponse second) =>
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse(first.Body.GetRawText()), JsonNode.Parse(second.Body.GetRawText())),
            $"Stored attempt differs: {first.Body} / {second.Body}");

    private async Task<(Guid Organization, Guid Project)> Organization(Actor manager, Actor agent)
    {
        var organization = Guid.NewGuid();
        var project = Guid.NewGuid();
        await f.SqlAsync("""
            INSERT INTO genesis_reimbursements.organizations(id,name) VALUES (@org,'synthetic organization');
            INSERT INTO genesis_reimbursements.projects(id,organization_id,name) VALUES (@project,@org,'Project Phoenix');
            INSERT INTO genesis_reimbursements.memberships(organization_id,principal_id,role)
            VALUES (@org,@human,'manager'),(@org,@agent,'agent');
            """, ("org", organization), ("project", project), ("human", manager.Id), ("agent", agent.Id));
        return (organization, project);
    }

    private async Task<Scope> Setup(bool approved = true, long amount = 12_500, long max = 50_000,
        int ttl = 600, Actor? manager = null, Actor? agent = null, long version = 0)
    {
        manager ??= f.Human;
        agent ??= f.Agent;
        var (org, project) = await Organization(manager, agent);
        var record = await f.PostAsync(Prefix + "/records", manager, new
        {
            organizationId = org, projectId = project, category = "supplies", amountMinor = amount, currency = "USD"
        });
        Status(record, 201);
        Assert.Equal(manager.Id, record.Body.GetProperty("managerId").GetGuid());
        Assert.Equal("pending", record.Body.GetProperty("status").GetString());
        Assert.Equal(0L, record.Body.GetProperty("version").GetInt64());
        var proposal = await f.PostAsync(Prefix + "/proposals", agent,
            new { reimbursementId = record.Id, expectedVersion = version, maxAmountMinor = max, ttlSeconds = ttl });
        Status(proposal, 201);
        var grant = Guid.NewGuid();
        if (approved)
        {
            var decision = await f.PostAsync($"{Prefix}/proposals/{proposal.Id}/decision", manager,
                new { decision = "approved" });
            Status(decision, 200);
            grant = decision.Body.GetProperty("grantId").GetGuid();
        }
        return new Scope(org, project, record.Id, proposal.Id, grant, manager, agent, amount);
    }

    private Task<ApiResponse> Execute(Scope scope, string? key = null, Actor? actor = null, object? body = null) =>
        f.PostAsync(Prefix + "/execute", actor ?? scope.Agent, body ?? scope.Execute, key ?? Key());

    private async Task AssertRecord(Scope scope, string status = "pending", long version = 0)
    {
        var response = await f.GetAsync($"{Prefix}/records/{scope.Record}", scope.Manager);
        Status(response, 200);
        Assert.Equal(status, response.Body.GetProperty("status").GetString());
        Assert.Equal(version, response.Body.GetProperty("version").GetInt64());
        Assert.Equal(scope.Amount, response.Body.GetProperty("amountMinor").GetInt64());
        Assert.Equal(scope.Project, response.Body.GetProperty("projectId").GetGuid());
    }

    private async Task<string?> GrantState(Scope scope)
    {
        var response = await f.GetAsync($"{Prefix}/grants/{scope.Grant}", scope.Manager);
        Status(response, 200);
        return response.Body.GetProperty("state").GetString();
    }

    private Task<object?> AllocationSnapshot() => f.SqlAsync("""
        SELECT json_build_array(
            (SELECT count(*) FROM genesis_reimbursements.reimbursements),
            (SELECT count(*) FROM genesis_reimbursements.proposals),
            (SELECT count(*) FROM genesis_reimbursements.decisions),
            (SELECT count(*) FROM genesis_reimbursements.grants),
            (SELECT count(*) FROM genesis_reimbursements.attempts),
            (SELECT count(*) FROM genesis_reimbursements.idempotency),
            (SELECT count(*) FROM genesis_reimbursements.evidence))::text
        """);

    [Theory]
    [InlineData("organizationId")]
    [InlineData("projectId")]
    [InlineData("category")]
    [InlineData("amountMinor")]
    [InlineData("currency")]
    public async Task EveryRecordFieldIsRequiredWithoutAllocatingAuthority(string missing)
    {
        var (org, project) = await Organization(f.Human, f.Agent);
        var body = JsonSerializer.SerializeToNode(new
        {
            organizationId = org, projectId = project, category = "supplies", amountMinor = 12_500L, currency = "USD"
        })!.AsObject();
        Assert.True(body.Remove(missing));
        var before = await AllocationSnapshot();
        Status(await f.PostAsync(Prefix + "/records", f.Human, body), 400);
        Assert.Equal(before, await AllocationSnapshot());
    }

    [Theory]
    [InlineData("reimbursementId")]
    [InlineData("expectedVersion")]
    [InlineData("maxAmountMinor")]
    [InlineData("ttlSeconds")]
    public async Task EveryProposalFieldIncludingZeroVersionIsExplicitlyRequired(string missing)
    {
        var scope = await Setup(approved: false);
        var body = JsonSerializer.SerializeToNode(new
        {
            reimbursementId = scope.Record, expectedVersion = 0L, maxAmountMinor = 50_000L, ttlSeconds = 600
        })!.AsObject();
        Assert.True(body.Remove(missing));
        var before = await AllocationSnapshot();
        Status(await f.PostAsync(Prefix + "/proposals", scope.Agent, body), 400);
        Assert.Equal(before, await AllocationSnapshot());
        await AssertRecord(scope);
    }

    [Theory]
    [InlineData("proposalId")]
    [InlineData("grantId")]
    [InlineData("reimbursementId")]
    [InlineData("organizationId")]
    [InlineData("projectId")]
    [InlineData("category")]
    [InlineData("amountMinor")]
    [InlineData("currency")]
    [InlineData("expectedVersion")]
    [InlineData("operation")]
    public async Task EveryExecutionFieldIsRequiredAndCannotReserveARetryKey(string missing)
    {
        var scope = await Setup();
        var body = JsonSerializer.SerializeToNode(scope.Execute)!.AsObject();
        Assert.True(body.Remove(missing));
        var before = await AllocationSnapshot();
        var key = Key();
        Status(await f.PostAsync(Prefix + "/execute", scope.Agent, body, key), 400);
        Assert.Equal(before, await AllocationSnapshot());
        Status(await f.GetAsync($"{Prefix}/attempts/by-key?key={key}", scope.Agent), 404);
        await AssertRecord(scope);
        Assert.Equal("active", await GrantState(scope));
    }

    [Fact]
    public async Task ExactApprovedReimbursementAndReceiptsPersistOnce()
    {
        var scope = await Setup();
        var key = Key();
        var first = await Execute(scope, key);
        Status(first, 200);
        Assert.Equal("allowed", first.Body.GetProperty("outcome").GetString());
        Assert.Equal(1L, first.Body.GetProperty("reimbursementVersion").GetInt64());
        Same(first, await Execute(scope, key));
        var lookup = await f.GetAsync($"{Prefix}/attempts/by-key?key={key}", scope.Agent);
        Status(lookup, 200);
        Same(first, lookup);
        await AssertRecord(scope, "approved", 1);
        Assert.Equal("consumed", await GrantState(scope));
        Status(await Execute(scope), 403);
        Assert.Equal(1L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.attempts WHERE proposal_id=@p AND outcome='allowed'",
            ("p", scope.Proposal)));
        Assert.Equal(1L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.evidence WHERE attempt_id=@attempt AND outcome='allowed'",
            ("attempt", first.Id)));
        var evidence = await f.GetAsync($"{Prefix}/records/{scope.Record}/evidence", scope.Manager);
        Status(evidence, 200);
        Assert.Contains(evidence.Body.EnumerateArray(), e =>
            e.TryGetProperty("attemptId", out var attempt) && attempt.ValueKind == JsonValueKind.String && attempt.GetGuid() == first.Id);
    }

    [Theory]
    [InlineData("organizationId")]
    [InlineData("projectId")]
    [InlineData("reimbursementId")]
    [InlineData("proposalId")]
    [InlineData("grantId")]
    [InlineData("amountMinor")]
    [InlineData("category")]
    [InlineData("currency")]
    [InlineData("expectedVersion")]
    [InlineData("operation")]
    public async Task EveryExecutionScopeFieldIsIndependentlyEnforced(string field)
    {
        var scope = await Setup();
        var changed = JsonSerializer.SerializeToNode(scope.Execute)!;
        switch (field)
        {
            case "amountMinor": changed[field] = scope.Amount + 1; break;
            case "category": changed[field] = "travel"; break;
            case "currency": changed[field] = "EUR"; break;
            case "expectedVersion": changed[field] = 1; break;
            case "operation": changed[field] = "pay"; break;
            default: changed[field] = Guid.NewGuid(); break;
        }
        var denied = await Execute(scope, body: changed);
        Status(denied, 403);
        Assert.Equal("denied", denied.Body.GetProperty("outcome").GetString());
        Assert.Equal("authorization_denied", denied.Body.GetProperty("reason").GetString());
        await AssertRecord(scope);
        Assert.Equal("active", await GrantState(scope));
    }

    [Fact]
    public async Task SameKeyCannotBeReusedForDifferentTupleAndAppendNamespaceDoesNotCollide()
    {
        var scope = await Setup();
        var key = Key();
        var document = await f.PostAsync("/documents", f.Human, new { title = "different operation", content = "" });
        Status(document, 201);
        var proposal = await f.PostAsync("/proposals", f.Agent,
            new { documentId = document.Id, expectedVersion = 0, text = "append", ttlSeconds = 600 });
        Status(proposal, 201);
        var decision = await f.PostAsync($"/proposals/{proposal.Id}/decision", f.Human, new { decision = "approved" });
        Status(decision, 200);
        Status(await f.PostAsync("/execute", f.Agent, new
        {
            proposalId = proposal.Id, documentId = document.Id, grantId = decision.Body.GetProperty("grantId").GetGuid(),
            operation = "append", expectedVersion = 0, text = "append"
        }, key), 200);
        Status(await Execute(scope, key), 200);
        var changed = JsonSerializer.SerializeToNode(scope.Execute)!;
        changed["amountMinor"] = scope.Amount + 1;
        Status(await Execute(scope, key, body: changed), 409);
        await AssertRecord(scope, "approved", 1);
    }

    [Fact]
    public async Task MissingApprovalAndAgentSelfApprovalAreDenied()
    {
        var scope = await Setup(approved: false);
        Status(await Execute(scope), 403);
        Status(await f.PostAsync($"{Prefix}/proposals/{scope.Proposal}/decision", scope.Agent,
            new { decision = "approved" }), 403);
        Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.grants WHERE proposal_id=@p", ("p", scope.Proposal)));
        await AssertRecord(scope);
    }

    [Fact]
    public async Task RevocationDeniesFutureExecutionWithoutReversingHistoricalSuccess()
    {
        var scope = await Setup();
        var revoke = await f.PostAsync($"{Prefix}/grants/{scope.Grant}/revoke", scope.Manager,
            new { reason = "permission withdrawn" });
        Status(revoke, 200);
        Assert.Equal("revoked", revoke.Body.GetProperty("state").GetString());
        Status(await Execute(scope), 403);
        await AssertRecord(scope);
        var consumed = await Setup();
        var key = Key();
        var success = await Execute(consumed, key);
        Status(success, 200);
        Status(await f.PostAsync($"{Prefix}/grants/{consumed.Grant}/revoke", consumed.Manager,
            new { reason = "too late to undo" }), 200);
        Same(success, await Execute(consumed, key));
        await AssertRecord(consumed, "approved", 1);
    }

    [Fact]
    public async Task AmountAboveApprovedLimitCannotCreateGrantButRejectionRemainsAvailable()
    {
        var scope = await Setup(approved: false, amount: 50_001, max: 50_000);
        Status(await f.PostAsync($"{Prefix}/proposals/{scope.Proposal}/decision", scope.Manager,
            new { decision = "approved" }), 409);
        Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.decisions WHERE proposal_id=@p", ("p", scope.Proposal)));
        Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.grants WHERE proposal_id=@p", ("p", scope.Proposal)));
        var reject = await f.PostAsync($"{Prefix}/proposals/{scope.Proposal}/decision", scope.Manager,
            new { decision = "rejected" });
        Status(reject, 200);
        Assert.Equal(JsonValueKind.Null, reject.Body.GetProperty("grantId").ValueKind);
        await AssertRecord(scope);
    }

    [Fact]
    public async Task ForeignOrganizationUsersCannotInspectProposeDecideRevokeOrExecute()
    {
        var own = await Setup();
        var foreign = await Setup(manager: f.OtherHuman, agent: f.OtherAgent);
        foreach (var path in new[] { $"/records/{own.Record}", $"/records/{own.Record}/evidence", $"/proposals/{own.Proposal}", $"/grants/{own.Grant}" })
            Status(await f.GetAsync(Prefix + path, foreign.Manager), 404);
        Status(await f.PostAsync(Prefix + "/proposals", foreign.Agent,
            new { reimbursementId = own.Record, expectedVersion = 0, maxAmountMinor = 50_000, ttlSeconds = 600 }), 404);
        Status(await f.PostAsync($"{Prefix}/proposals/{own.Proposal}/decision", foreign.Manager, new { decision = "approved" }), 404);
        Status(await f.PostAsync($"{Prefix}/grants/{own.Grant}/revoke", foreign.Manager, new { reason = "foreign" }), 404);
        Status(await Execute(own, actor: foreign.Agent), 403);
        await AssertRecord(own);
        await AssertRecord(foreign);
    }

    [Fact]
    public async Task OrganizationMembershipDoesNotOverrideExactManagerAndAgentBindings()
    {
        var scope = await Setup();
        await f.SqlAsync("""
            INSERT INTO genesis_reimbursements.memberships(organization_id,principal_id,role)
            VALUES (@org,@human,'manager'),(@org,@agent,'agent')
            """, ("org", scope.Organization), ("human", f.OtherHuman.Id), ("agent", f.OtherAgent.Id));
        Status(await f.GetAsync($"{Prefix}/records/{scope.Record}", f.OtherHuman), 404);
        Status(await f.GetAsync($"{Prefix}/proposals/{scope.Proposal}", f.OtherAgent), 404);
        Status(await f.GetAsync($"{Prefix}/grants/{scope.Grant}", f.OtherAgent), 404);
        Status(await f.PostAsync($"{Prefix}/proposals/{scope.Proposal}/decision", f.OtherHuman, new { decision = "approved" }), 404);
        Status(await f.PostAsync($"{Prefix}/grants/{scope.Grant}/revoke", f.OtherHuman, new { reason = "another manager" }), 404);
        Status(await Execute(scope, actor: f.OtherAgent), 403);
        await AssertRecord(scope);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task DisabledPrincipalsCannotAuthorizeNewApprovalEffects(bool disableAgent)
    {
        // Dedicated principals avoid changing another test's shared identity state.
        var manager = await f.SeedAsync("human", "synthetic disabled-manager case");
        var agent = await f.SeedAsync("agent", "synthetic disabled-agent case");
        var scope = await Setup(manager: manager, agent: agent);
        await f.SqlAsync("UPDATE genesis_authority.principals SET enabled=false WHERE id=@id",
            ("id", disableAgent ? agent.Id : manager.Id));
        Status(await Execute(scope), disableAgent ? 401 : 403);
        Assert.Equal("pending", await f.SqlAsync("SELECT status FROM genesis_reimbursements.reimbursements WHERE id=@id", ("id", scope.Record)));
        Assert.Equal("active", await f.SqlAsync("SELECT state FROM genesis_reimbursements.grants WHERE id=@id", ("id", scope.Grant)));
    }

    [Theory]
    [InlineData("amountMinor", "zero")]
    [InlineData("amountMinor", "negative")]
    [InlineData("amountMinor", "too-large")]
    [InlineData("amountMinor", "fractional")]
    [InlineData("currency", "unsupported")]
    [InlineData("category", "empty")]
    [InlineData("category", "nul")]
    [InlineData("managerId", "unknown")]
    public async Task MalformedRecordsCannotSelectManagerOrBypassTypedMoney(string field, string mode)
    {
        var (org, project) = await Organization(f.Human, f.Agent);
        var body = JsonSerializer.SerializeToNode(new
        {
            organizationId = org, projectId = project, category = "supplies", amountMinor = 12500L, currency = "USD"
        })!;
        switch (mode)
        {
            case "zero": body[field] = 0; break;
            case "negative": body[field] = -1; break;
            case "too-large": body[field] = 1_000_000_000_001L; break;
            case "fractional": body[field] = 1.5; break;
            case "unsupported": body[field] = "EUR"; break;
            case "empty": body[field] = ""; break;
            case "nul": body[field] = "supplies\0travel"; break;
            case "unknown": body[field] = f.OtherHuman.Id; break;
        }
        Status(await f.PostAsync(Prefix + "/records", f.Human, body), 400);
        Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.reimbursements WHERE organization_id=@org", ("org", org)));
    }

    [Theory]
    [InlineData("ttlSeconds", 0L)]
    [InlineData("ttlSeconds", 601L)]
    [InlineData("maxAmountMinor", 0L)]
    [InlineData("maxAmountMinor", 1_000_000_000_001L)]
    [InlineData("expectedVersion", -1L)]
    public async Task ProposalLimitsAreValidatedBeforeCreatingAuthority(string field, long value)
    {
        var scope = await Setup(approved: false);
        var body = JsonSerializer.SerializeToNode(new
        {
            reimbursementId = scope.Record, expectedVersion = 0L, maxAmountMinor = 50_000L, ttlSeconds = 600
        })!;
        body[field] = value;
        Status(await f.PostAsync(Prefix + "/proposals", scope.Agent, body), 400);
        Assert.Equal(1L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.proposals WHERE reimbursement_id=@id", ("id", scope.Record)));
        Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.grants WHERE proposal_id=@id", ("id", scope.Proposal)));
    }

    [Theory]
    [InlineData("missing-key")]
    [InlineData("unknown-field")]
    [InlineData("empty-guid")]
    [InlineData("fractional-money")]
    public async Task MalformedExecutionCreatesNeitherAttemptNorRetryReservation(string malformed)
    {
        var scope = await Setup();
        var body = JsonSerializer.SerializeToNode(scope.Execute)!;
        switch (malformed)
        {
            case "unknown-field": body["managerId"] = scope.Agent.Id; break;
            case "empty-guid": body["grantId"] = Guid.Empty; break;
            case "fractional-money": body["amountMinor"] = 1.5; break;
        }
        var key = Key();
        Status(await f.PostAsync(Prefix + "/execute", scope.Agent, body, malformed == "missing-key" ? null : key), 400);
        Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.attempts WHERE proposal_id=@p", ("p", scope.Proposal)));
        Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.idempotency WHERE principal_id=@actor AND key=@key",
            ("actor", scope.Agent.Id), ("key", key)));
        await AssertRecord(scope);
    }

    [Fact]
    public async Task AnOrganizationCannotBorrowAnotherOrganizationsProject()
    {
        var own = await Organization(f.Human, f.Agent);
        var foreign = await Organization(f.OtherHuman, f.OtherAgent);
        Status(await f.PostAsync(Prefix + "/records", f.Human, new
        {
            organizationId = own.Organization, projectId = foreign.Project, category = "supplies", amountMinor = 12500, currency = "USD"
        }), 404);
        Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.reimbursements WHERE organization_id=@org", ("org", own.Organization)));
    }

    [Fact]
    public async Task StaleVersionCannotCreateDecisionAndDecisionReplayDoesNotCreateAnotherGrant()
    {
        var scope = await Setup();
        var stale = await f.PostAsync(Prefix + "/proposals", scope.Agent,
            new { reimbursementId = scope.Record, expectedVersion = 0, maxAmountMinor = 50_000, ttlSeconds = 600 });
        Status(stale, 201);
        Status(await Execute(scope), 200);
        Status(await f.PostAsync($"{Prefix}/proposals/{stale.Id}/decision", scope.Manager, new { decision = "approved" }), 409);
        Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.decisions WHERE proposal_id=@p", ("p", stale.Id)));
        var original = await f.PostAsync($"{Prefix}/proposals/{scope.Proposal}/decision", scope.Manager, new { decision = "approved" });
        Status(original, 200);
        Assert.Equal(scope.Grant, original.Body.GetProperty("grantId").GetGuid());
        Assert.Equal(1L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.grants WHERE proposal_id=@p", ("p", scope.Proposal)));
    }

    [Theory]
    [InlineData("manager-membership")]
    [InlineData("agent-membership")]
    [InlineData("organization")]
    [InlineData("project")]
    [InlineData("manager-role")]
    [InlineData("agent-role")]
    public async Task CurrentAuthorityStateIsRecheckedAtExecution(string disabled)
    {
        var scope = await Setup();
        switch (disabled)
        {
            case "manager-membership":
                await f.SqlAsync("UPDATE genesis_reimbursements.memberships SET enabled=false WHERE organization_id=@org AND principal_id=@actor",
                    ("org", scope.Organization), ("actor", scope.Manager.Id)); break;
            case "agent-membership":
                await f.SqlAsync("UPDATE genesis_reimbursements.memberships SET enabled=false WHERE organization_id=@org AND principal_id=@actor",
                    ("org", scope.Organization), ("actor", scope.Agent.Id)); break;
            case "organization": await f.SqlAsync("UPDATE genesis_reimbursements.organizations SET enabled=false WHERE id=@id", ("id", scope.Organization)); break;
            case "project": await f.SqlAsync("UPDATE genesis_reimbursements.projects SET enabled=false WHERE id=@id", ("id", scope.Project)); break;
            case "manager-role":
                await f.SqlAsync("UPDATE genesis_reimbursements.memberships SET role='member' WHERE organization_id=@org AND principal_id=@actor",
                    ("org", scope.Organization), ("actor", scope.Manager.Id)); break;
            case "agent-role":
                await f.SqlAsync("UPDATE genesis_reimbursements.memberships SET role='member' WHERE organization_id=@org AND principal_id=@actor",
                    ("org", scope.Organization), ("actor", scope.Agent.Id)); break;
        }
        Status(await Execute(scope), 403);
        Assert.Equal("pending", await f.SqlAsync("SELECT status FROM genesis_reimbursements.reimbursements WHERE id=@id", ("id", scope.Record)));
        Assert.Equal("active", await f.SqlAsync("SELECT state FROM genesis_reimbursements.grants WHERE id=@id", ("id", scope.Grant)));
    }

    [Fact]
    public async Task OffboardedAgentCannotReadOrReplayHistoricalReceipt()
    {
        var scope = await Setup();
        var key = Key();
        Status(await Execute(scope, key), 200);
        await f.SqlAsync("UPDATE genesis_reimbursements.memberships SET enabled=false WHERE organization_id=@org AND principal_id=@agent",
            ("org", scope.Organization), ("agent", scope.Agent.Id));
        Status(await Execute(scope, key), 404);
        Status(await f.GetAsync($"{Prefix}/attempts/by-key?key={key}", scope.Agent), 404);
        await AssertRecord(scope, "approved", 1);
    }

    private async Task<(NpgsqlConnection Connection, NpgsqlTransaction Transaction)> LockRecord(Scope scope)
    {
        var connection = await f.OpenAsync();
        var transaction = await connection.BeginTransactionAsync();
        await using var command = new NpgsqlCommand("SELECT id FROM genesis_reimbursements.reimbursements WHERE id=@id FOR UPDATE", connection, transaction);
        command.Parameters.AddWithValue("id", scope.Record);
        Assert.Equal(scope.Record, await command.ExecuteScalarAsync());
        return (connection, transaction);
    }

    [Fact]
    public async Task ForeignIdentifiersDoNotWaitOnAnotherOrganizationsResourceLock()
    {
        var scope = await Setup();
        var (connection, transaction) = await LockRecord(scope);
        await using (connection)
        await using (transaction)
        {
            var read = f.GetAsync($"{Prefix}/records/{scope.Record}", f.OtherHuman);
            var propose = f.PostAsync(Prefix + "/proposals", f.OtherAgent,
                new { reimbursementId = scope.Record, expectedVersion = 0, maxAmountMinor = 50_000, ttlSeconds = 600 });
            var requests = Task.WhenAll(read, propose);
            try
            {
                // A genuine foreign-resource denial does not need the target's row lock.
                // Five seconds stays comfortably below the service's ten-second lock timeout.
                Assert.Same(requests, await Task.WhenAny(requests, Task.Delay(TimeSpan.FromSeconds(5))));
                foreach (var response in await requests) Status(response, 404);
            }
            finally
            {
                await transaction.RollbackAsync();
                // Drain requests even if the timing assertion exposed a blocked route.
                await requests.WaitAsync(TimeSpan.FromSeconds(10));
            }
        }
        await AssertRecord(scope);
    }

    [Fact]
    public async Task ReapplyingTheMigrationPreservesExistingRecordsAndAuthority()
    {
        var scope = await Setup();
        var migration = await File.ReadAllTextAsync(Path.Combine(f.Root, "database/migrations/002_reimbursement_authority.sql"));
        await f.SqlAsync(migration);
        await f.SqlAsync(migration);
        await AssertRecord(scope);
        Assert.Equal("active", await GrantState(scope));
        Assert.Equal(1L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.schema_versions WHERE version=1"));
        Status(await Execute(scope), 200);
        await AssertRecord(scope, "approved", 1);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task OffboardingCommittedDuringResourceLockWaitPreventsExecution(bool offboardManager)
    {
        var scope = await Setup();
        var (connection, transaction) = await LockRecord(scope);
        await using (connection)
        await using (transaction)
        {
            var execution = Execute(scope);
            await f.WaitForBlockedAsync(connection.ProcessID);
            await f.SqlAsync("""
                UPDATE genesis_reimbursements.memberships SET enabled=false
                WHERE organization_id=@org AND principal_id=@actor
                """, ("org", scope.Organization), ("actor", offboardManager ? scope.Manager.Id : scope.Agent.Id));
            await transaction.CommitAsync();
            Status(await execution, 403);
        }
        Assert.Equal("pending", await f.SqlAsync("SELECT status FROM genesis_reimbursements.reimbursements WHERE id=@id", ("id", scope.Record)));
        Assert.Equal("active", await f.SqlAsync("SELECT state FROM genesis_reimbursements.grants WHERE id=@id", ("id", scope.Grant)));
        Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.attempts WHERE proposal_id=@p AND outcome='allowed'", ("p", scope.Proposal)));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task ConcurrentExecutionsProduceOneInternalApproval(bool sameKey)
    {
        var scope = await Setup();
        var key = Key();
        var (connection, transaction) = await LockRecord(scope);
        await using (connection)
        await using (transaction)
        {
            var first = Execute(scope, key);
            await f.WaitForBlockedAsync(connection.ProcessID);
            var second = Execute(scope, sameKey ? key : Key());
            await AuthorityFixture.UntilAsync(async () =>
                (long)(await f.SqlAsync("""
                    WITH RECURSIVE blocked(pid) AS (
                        SELECT pid FROM pg_stat_activity WHERE @blocker=ANY(pg_blocking_pids(pid))
                        UNION SELECT a.pid FROM pg_stat_activity a JOIN blocked ON blocked.pid=ANY(pg_blocking_pids(a.pid))
                    ) SELECT count(*) FROM pg_stat_activity
                    WHERE application_name=@app AND pid IN (SELECT pid FROM blocked)
                    """, ("blocker", connection.ProcessID), ("app", f.ServiceApplication)))! >= 2,
                "Both reimbursement requests were not observed in the independent lock chain.");
            await transaction.CommitAsync();
            var responses = await Task.WhenAll(first, second);
            Status(responses[0], 200);
            Status(responses[1], sameKey ? 200 : 403);
            if (sameKey) Same(responses[0], responses[1]);
        }
        await AssertRecord(scope, "approved", 1);
        Assert.Equal(1L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.attempts WHERE proposal_id=@p AND outcome='allowed'", ("p", scope.Proposal)));
    }

    [Fact]
    public async Task ExpirationAfterWaitingForResourceLockDeniesExecution()
    {
        var scope = await Setup(ttl: 3);
        var (connection, transaction) = await LockRecord(scope);
        await using (connection)
        await using (transaction)
        {
            var execution = Execute(scope);
            await f.WaitForBlockedAsync(connection.ProcessID);
            await AuthorityFixture.UntilAsync(async () =>
                (bool)(await f.SqlAsync("SELECT clock_timestamp() >= expires_at FROM genesis_reimbursements.proposals WHERE id=@id",
                    ("id", scope.Proposal)))!, "Proposal did not expire at database wall clock.");
            await transaction.CommitAsync();
            Status(await execution, 403);
        }
        await AssertRecord(scope);
    }

    [Fact]
    public async Task ExpiredApprovalCannotAllocateDecisionOrGrant()
    {
        var scope = await Setup(approved: false, ttl: 1);
        await AuthorityFixture.UntilAsync(async () =>
            (bool)(await f.SqlAsync("SELECT clock_timestamp() >= expires_at FROM genesis_reimbursements.proposals WHERE id=@id",
                ("id", scope.Proposal)))!, "Proposal did not expire at database wall clock.");
        Status(await f.PostAsync($"{Prefix}/proposals/{scope.Proposal}/decision", scope.Manager, new { decision = "approved" }), 409);
        Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.decisions WHERE proposal_id=@p", ("p", scope.Proposal)));
        Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.grants WHERE proposal_id=@p", ("p", scope.Proposal)));
    }

    private async Task EvidenceGate(Scope scope, string behavior, long gate = 0, bool execution = true)
    {
        Assert.Contains(behavior, new[] { "fail", "block" });
        var statement = behavior == "fail" ? "RAISE EXCEPTION 'synthetic reimbursement evidence failure';" : $"PERFORM pg_advisory_xact_lock({gate});";
        var predicate = execution ? "NEW.attempt_id IS NOT NULL" : "NEW.action='grant_revoked'";
        await f.SqlAsync($"""
            CREATE FUNCTION genesis_reimbursements.integration_evidence_gate() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                IF NEW.organization_id='{scope.Organization}'::uuid AND {predicate} THEN {statement} END IF;
                RETURN NEW;
            END $$;
            CREATE TRIGGER integration_evidence_gate BEFORE INSERT ON genesis_reimbursements.evidence
            FOR EACH ROW EXECUTE FUNCTION genesis_reimbursements.integration_evidence_gate();
            """);
    }

    private Task<object?> RemoveEvidenceGate() => f.SqlAsync("""
        DROP TRIGGER IF EXISTS integration_evidence_gate ON genesis_reimbursements.evidence;
        DROP FUNCTION IF EXISTS genesis_reimbursements.integration_evidence_gate();
        """);

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task EvidenceFailureRollsBackEffectsAttemptsAndRetryReservation(bool allowed)
    {
        var scope = await Setup();
        var key = Key();
        var body = JsonSerializer.SerializeToNode(scope.Execute)!;
        if (!allowed) body["amountMinor"] = scope.Amount + 1;
        await EvidenceGate(scope, "fail");
        try
        {
            Status(await Execute(scope, key, body: body), 503);
            await AssertRecord(scope);
            Assert.Equal("active", await GrantState(scope));
            Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.attempts WHERE proposal_id=@p", ("p", scope.Proposal)));
            Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_reimbursements.idempotency WHERE principal_id=@actor AND key=@key",
                ("actor", scope.Agent.Id), ("key", key)));
            Status(await f.GetAsync($"{Prefix}/attempts/by-key?key={key}", scope.Agent), 404);
        }
        finally { await RemoveEvidenceGate(); }
        Status(await Execute(scope, key, body: body), allowed ? 200 : 403);
        await AssertRecord(scope, allowed ? "approved" : "pending", allowed ? 1 : 0);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task RevokeAndExecutionRespectTheirActualCommitOrder(bool revokeFirst)
    {
        var scope = await Setup();
        var gate = Random.Shared.NextInt64(1_000_000, long.MaxValue);
        await using var connection = await f.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        await using (var command = new NpgsqlCommand("SELECT pg_advisory_xact_lock(@gate)", connection, transaction))
        {
            command.Parameters.AddWithValue("gate", gate);
            await command.ExecuteNonQueryAsync();
        }
        await EvidenceGate(scope, "block", gate, execution: !revokeFirst);
        try
        {
            Task<ApiResponse> Revoke() => f.PostAsync($"{Prefix}/grants/{scope.Grant}/revoke", scope.Manager,
                new { reason = "ordered synthetic revoke" });
            var first = revokeFirst ? Revoke() : Execute(scope);
            await f.WaitForBlockedAsync(connection.ProcessID);
            var firstPid = (int)(await f.SqlAsync("""
                SELECT pid FROM pg_stat_activity WHERE application_name=@app AND @blocker=ANY(pg_blocking_pids(pid)) LIMIT 1
                """, ("app", f.ServiceApplication), ("blocker", connection.ProcessID)))!;
            var second = revokeFirst ? Execute(scope) : Revoke();
            await f.WaitForBlockedAsync(firstPid);
            await transaction.CommitAsync();
            Status(await first, 200);
            Status(await second, revokeFirst ? 403 : 200);
            Assert.Equal(revokeFirst ? "revoked" : "consumed", await GrantState(scope));
            await AssertRecord(scope, revokeFirst ? "pending" : "approved", revokeFirst ? 0 : 1);
        }
        finally
        {
            await transaction.DisposeAsync();
            await RemoveEvidenceGate();
        }
    }
}
