using System.Text.Json;
using System.Text.Json.Nodes;
using Npgsql;

namespace HumanAuthority.IntegrationTests;

public sealed partial class AuthorityTests
{
    private async Task<(NpgsqlConnection Connection, NpgsqlTransaction Transaction)> LockRow(string table, Guid id)
    {
        Assert.Contains(table, new[] { "documents", "grants" });
        var connection = await f.OpenAsync();
        var transaction = await connection.BeginTransactionAsync();
        await using var command = new NpgsqlCommand($"SELECT id FROM genesis_authority.{table} WHERE id=@id FOR UPDATE",
            connection, transaction);
        command.Parameters.AddWithValue("id", id);
        Assert.Equal(id, await command.ExecuteScalarAsync());
        return (connection, transaction);
    }

    [Theory]
    [InlineData("same")]
    [InlineData("different")]
    [InlineData("changed-body")]
    public async Task ConcurrentExecutionsAreSerializedAndConsumeAtMostOnce(string mode)
    {
        var scenario = await Setup();
        var key = Key();
        var (connection, transaction) = await LockRow("documents", scenario.Document);
        await using (connection)
        await using (transaction)
        {
            var first = Execute(scenario, key);
            await f.WaitForBlockedAsync(connection.ProcessID);
            var body = JsonSerializer.SerializeToNode(scenario.Execute)!;
            if (mode == "changed-body") body["text"] = "different";
            var second = f.PostAsync("/execute", f.Agent, body, mode == "different" ? Key() : key);
            if (mode == "different")
                await f.WaitForBlockedAsync(connection.ProcessID, 2);
            else
                await AuthorityFixture.UntilAsync(async () =>
                    (long)(await f.SqlAsync("""
                        SELECT count(*) FROM pg_stat_activity
                        WHERE application_name=@app AND wait_event_type='Lock'
                        """, ("app", f.ServiceApplication)))! >= 2,
                    "Second request did not wait for the first key.");
            await transaction.CommitAsync();
            var results = await Task.WhenAll(first, second);
            Status(results[0], 200);
            Status(results[1], mode == "same" ? 200 : mode == "different" ? 403 : 409);
            if (mode == "same") Same(results[0], results[1]);
        }
        await AssertDocument(scenario, "initialappend\n", 1);
        Assert.Equal("consumed", await State(scenario));
        Assert.Equal(1L, await f.SqlAsync("""
            SELECT count(*) FROM genesis_authority.attempts WHERE proposal_id=@p AND outcome='allowed'
            """, ("p", scenario.Proposal)));
    }

    [Theory]
    [InlineData("documents")]
    [InlineData("grants")]
    public async Task ExpiryUsesDatabaseWallClockAfterEveryRequiredLock(string table)
    {
        var scenario = await Setup(ttl: 3);
        var (connection, transaction) = await LockRow(table, table == "documents" ? scenario.Document : scenario.Grant);
        await using (connection)
        await using (transaction)
        {
            var execution = Execute(scenario);
            await f.WaitForBlockedAsync(connection.ProcessID);
            await AuthorityFixture.UntilAsync(async () =>
                (bool)(await f.SqlAsync("""
                    SELECT clock_timestamp() >= expires_at FROM genesis_authority.grants WHERE id=@id
                    """, ("id", scenario.Grant)))!, "PostgreSQL expiry deadline was not reached.");
            await transaction.CommitAsync();
            Status(await execution, 403);
        }
        await AssertDocument(scenario, "initial", 0);
        Assert.Equal("expired", await State(scenario));
    }

    [Fact]
    public async Task ApprovalOfExpiredProposalConflictsWithoutGrant()
    {
        var scenario = await Setup(ttl: 1, approved: false);
        await AuthorityFixture.UntilAsync(async () =>
            (bool)(await f.SqlAsync("SELECT clock_timestamp() >= expires_at FROM genesis_authority.proposals WHERE id=@id",
                ("id", scenario.Proposal)))!, "Proposal did not reach its database deadline.");
        var result = await f.PostAsync($"/proposals/{scenario.Proposal}/decision", f.Human, new { decision = "approved" });
        Status(result, 409);
        Assert.Equal("proposal_expired", result.Body.GetProperty("error").GetString());
        Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_authority.grants WHERE proposal_id=@p", ("p", scenario.Proposal)));
    }

    private async Task InstallEvidenceTrigger(Scenario scenario, string behavior, bool executionOnly = true, long gate = 0)
    {
        Assert.Contains(behavior, new[] { "fail", "block" });
        var predicate = executionOnly ? "NEW.attempt_id IS NOT NULL" : "NEW.attempt_id IS NULL";
        var statement = behavior == "fail"
            ? "RAISE EXCEPTION 'test-only evidence failure';"
            : $"PERFORM pg_advisory_xact_lock({gate});";
        await f.SqlAsync($"""
            CREATE FUNCTION genesis_authority.integration_evidence_gate() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                IF NEW.proposal_id = '{scenario.Proposal}'::uuid AND {predicate} THEN
                    {statement}
                END IF;
                RETURN NEW;
            END $$;
            CREATE TRIGGER integration_evidence_gate BEFORE INSERT ON genesis_authority.evidence
            FOR EACH ROW EXECUTE FUNCTION genesis_authority.integration_evidence_gate();
            """);
    }

    private Task<object?> RemoveEvidenceTrigger() => f.SqlAsync("""
        DROP TRIGGER IF EXISTS integration_evidence_gate ON genesis_authority.evidence;
        DROP FUNCTION IF EXISTS genesis_authority.integration_evidence_gate();
        """);

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task RequiredEvidenceFailureRollsBackSuccessOrDenialAndDoesNotReserveKey(bool allowed)
    {
        var scenario = await Setup();
        var key = Key();
        var body = JsonSerializer.SerializeToNode(scenario.Execute)!;
        if (!allowed) body["operation"] = "replace";
        await InstallEvidenceTrigger(scenario, "fail");
        try
        {
            var failure = await f.PostAsync("/execute", f.Agent, body, key);
            Status(failure, 503);
            Assert.Equal("authority_unavailable", failure.Body.GetProperty("error").GetString());
            await AssertDocument(scenario, "initial", 0);
            Assert.Equal("active", await State(scenario));
            Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_authority.attempts WHERE proposal_id=@p", ("p", scenario.Proposal)));
            Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_authority.idempotency WHERE key=@key", ("key", key)));
            Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_authority.document_versions WHERE document_id=@d AND version>0",
                ("d", scenario.Document)));
            Status(await f.GetAsync($"/attempts/by-key?key={key}", f.Agent), 404);
        }
        finally { await RemoveEvidenceTrigger(); }
        var retry = await f.PostAsync("/execute", f.Agent, body, key);
        Status(retry, allowed ? 200 : 403);
        Status(await f.GetAsync($"/attempts/by-key?key={key}", f.Agent), 200);
        await AssertDocument(scenario, allowed ? "initialappend\n" : "initial", allowed ? 1 : 0);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task RevokeAndExecuteHonorBothCommitOrderings(bool revokeFirst)
    {
        var scenario = await Setup();
        var gate = Random.Shared.NextInt64(1_000_000, long.MaxValue);
        await using var connection = await f.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        await using (var command = new NpgsqlCommand("SELECT pg_advisory_xact_lock(@gate)", connection, transaction))
        {
            command.Parameters.AddWithValue("gate", gate);
            await command.ExecuteNonQueryAsync();
        }
        await InstallEvidenceTrigger(scenario, "block", executionOnly: !revokeFirst, gate: gate);
        try
        {
            Task<ApiResponse> Revoke() => f.PostAsync($"/grants/{scenario.Grant}/revoke", f.Human, new { reason = "ordered revoke" });
            var first = revokeFirst ? Revoke() : Execute(scenario);
            await f.WaitForBlockedAsync(connection.ProcessID);
            var firstPid = (int)(await f.SqlAsync("""
                SELECT pid FROM pg_stat_activity
                WHERE application_name=@app AND @blocker=ANY(pg_blocking_pids(pid)) LIMIT 1
                """, ("app", f.ServiceApplication), ("blocker", connection.ProcessID)))!;
            var second = revokeFirst ? Execute(scenario) : Revoke();
            await f.WaitForBlockedAsync(firstPid);
            await transaction.CommitAsync();
            Status(await first, 200);
            Status(await second, revokeFirst ? 403 : 200);
            Assert.Equal(revokeFirst ? "revoked" : "consumed", await State(scenario));
            await AssertDocument(scenario, revokeFirst ? "initial" : "initialappend\n", revokeFirst ? 0 : 1);
        }
        finally
        {
            if (transaction.Connection is not null) await transaction.RollbackAsync();
            await RemoveEvidenceTrigger();
        }
    }

    [Fact]
    public async Task DisconnectAfterAcceptedExecutionStillCommitsAndReconcilesByOriginalKey()
    {
        var scenario = await Setup();
        var key = Key();
        var gate = Random.Shared.NextInt64(1_000_000, long.MaxValue);
        await using var connection = await f.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        await using (var command = new NpgsqlCommand("SELECT pg_advisory_xact_lock(@gate)", connection, transaction))
        {
            command.Parameters.AddWithValue("gate", gate);
            await command.ExecuteNonQueryAsync();
        }
        await InstallEvidenceTrigger(scenario, "block", gate: gate);
        try
        {
            using var cancellation = new CancellationTokenSource();
            var response = f.PostAsync("/execute", f.Agent, scenario.Execute, key, cancellation.Token);
            await f.WaitForBlockedAsync(connection.ProcessID);
            cancellation.Cancel();
            await Assert.ThrowsAnyAsync<OperationCanceledException>(() => response);
            await transaction.CommitAsync();
            await AuthorityFixture.UntilAsync(async () =>
                (long)(await f.SqlAsync("SELECT count(*) FROM genesis_authority.idempotency WHERE principal_id=@p AND key=@key",
                    ("p", f.Agent.Id), ("key", key)))! == 1, "Accepted disconnected execution did not persist.");
            var lookup = await f.GetAsync($"/attempts/by-key?key={key}", f.Agent);
            Status(lookup, 200);
            Assert.Equal("allowed", lookup.Body.GetProperty("outcome").GetString());
            var replay = await Execute(scenario, key);
            Status(replay, 200);
            Same(lookup, replay);
            await AssertDocument(scenario, "initialappend\n", 1);
            Assert.Equal("consumed", await State(scenario));
        }
        finally
        {
            if (transaction.Connection is not null) await transaction.RollbackAsync();
            await RemoveEvidenceTrigger();
        }
    }

    [Fact]
    public async Task ChangedCurrentOwnerInvalidatesOriginalApprovalAndMovesInspectionAuthority()
    {
        var scenario = await Setup();
        // Simulate an external ownership workflow; this prototype intentionally exposes no transfer endpoint.
        await f.SqlAsync("""
            BEGIN;
            ALTER TABLE genesis_authority.documents DISABLE TRIGGER validate_document;
            UPDATE genesis_authority.documents SET owner_id=@owner WHERE id=@id;
            ALTER TABLE genesis_authority.documents ENABLE TRIGGER validate_document;
            COMMIT;
            """, ("owner", f.OtherHuman.Id), ("id", scenario.Document));
        var denied = await Execute(scenario);
        Status(denied, 403);
        Status(await f.GetAsync($"/documents/{scenario.Document}", f.Human), 404);
        var current = await f.GetAsync($"/documents/{scenario.Document}", f.OtherHuman);
        Status(current, 200);
        Assert.Equal("initial", current.Body.GetProperty("content").GetString());
        Assert.Equal(0, current.Body.GetProperty("version").GetInt64());
        Status(await f.GetAsync($"/attempts/{denied.Id}", f.Human), 404);
        Status(await f.GetAsync($"/attempts/{denied.Id}", f.OtherHuman), 200);
    }

    [Theory]
    [InlineData("proposals")]
    [InlineData("decisions")]
    [InlineData("attempts")]
    [InlineData("idempotency")]
    [InlineData("evidence")]
    [InlineData("revocations")]
    [InlineData("document_versions")]
    public async Task ImmutableRecordsRejectSqlUpdatesAndDeletes(string table)
    {
        var scenario = await Setup();
        Status(await Execute(scenario), 200);
        var revocable = await Setup();
        Status(await f.PostAsync($"/grants/{revocable.Grant}/revoke", f.Human, new { reason = "immutability fixture" }), 200);
        var column = table switch
        {
            "decisions" => "decision", "idempotency" => "key", "revocations" => "reason",
            "document_versions" => "content", "evidence" => "action", _ => "text"
        };
        foreach (var sql in new[]
        {
            $"UPDATE genesis_authority.{table} SET {column}={column}",
            $"DELETE FROM genesis_authority.{table}"
        })
        {
            var error = await Assert.ThrowsAsync<PostgresException>(() => f.SqlAsync(sql));
            Assert.Equal("23514", error.SqlState);
            Assert.Contains("immutable", error.MessageText);
        }
    }
}
