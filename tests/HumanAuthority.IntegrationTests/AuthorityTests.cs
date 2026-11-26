using System.Text.Json;
using System.Text.Json.Nodes;
using Npgsql;

namespace HumanAuthority.IntegrationTests;

[Collection(AuthorityCollection.Name)]
public sealed partial class AuthorityTests(AuthorityFixture fixture)
{
    private readonly AuthorityFixture f = fixture;
    private sealed record Scenario(Guid Document, Guid Proposal, Guid Grant, string Text, long Version = 0)
    {
        public object Execute => new
        {
            proposalId = Proposal, grantId = Grant, documentId = Document,
            operation = "append", text = Text, expectedVersion = Version
        };
    }

    private static string Key() => Guid.NewGuid().ToString("N");
    private static void Status(ApiResponse response, int expected) =>
        Assert.True(response.Status == expected, $"Expected {expected}, received {response.Status}: {response.Body}");
    private static void Same(ApiResponse left, ApiResponse right) =>
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse(left.Body.GetRawText()), JsonNode.Parse(right.Body.GetRawText())),
            $"Historical response changed: {left.Body} / {right.Body}");

    private async Task<Guid> Document(string content = "initial", Actor? owner = null)
    {
        var result = await f.PostAsync("/documents", owner ?? f.Human, new { title = "authority test", content });
        Status(result, 201);
        return result.Id;
    }

    private async Task<Guid> Proposal(Guid document, string text = "append", long version = 0, int ttl = 600)
    {
        var result = await f.PostAsync("/proposals", f.Agent,
            new { documentId = document, expectedVersion = version, text, ttlSeconds = ttl });
        Status(result, 201);
        return result.Id;
    }

    private async Task<Scenario> Setup(string text = "append", string content = "initial", int ttl = 600,
        bool approved = true)
    {
        var document = await Document(content);
        var proposal = await Proposal(document, text, ttl: ttl);
        if (!approved) return new(document, proposal, Guid.NewGuid(), text);
        var decision = await f.PostAsync($"/proposals/{proposal}/decision", f.Human, new { decision = "approved" });
        Status(decision, 200);
        return new(document, proposal, decision.Body.GetProperty("grantId").GetGuid(), text);
    }

    private Task<ApiResponse> Execute(Scenario scenario, string? key = null, Actor? actor = null) =>
        f.PostAsync("/execute", actor ?? f.Agent, scenario.Execute, key ?? Key());

    private async Task AssertDocument(Scenario scenario, string content, long version)
    {
        var document = await f.GetAsync($"/documents/{scenario.Document}", f.Human);
        Status(document, 200);
        Assert.Equal(content, document.Body.GetProperty("content").GetString());
        Assert.Equal(version, document.Body.GetProperty("version").GetInt64());
    }

    private async Task<string?> State(Scenario scenario)
    {
        var response = await f.GetAsync($"/grants/{scenario.Grant}", f.Human);
        Status(response, 200);
        return response.Body.GetProperty("state").GetString();
    }

    [Fact]
    public async Task ExactUnicodeCrLfAppendAndReplayMutateOnce()
    {
        const string original = "a\r\n🙂e\u0301\n";
        const string text = "\r\n  Ωé\u0301🙂\r\n";
        var scenario = await Setup(text, original);
        var key = Key();
        var first = await Execute(scenario, key);
        Status(first, 200);
        Assert.Equal("allowed", first.Body.GetProperty("outcome").GetString());
        Assert.Equal(1, first.Body.GetProperty("documentVersion").GetInt64());
        Assert.EndsWith("Z", first.Body.GetProperty("createdAt").GetString());
        var replay = await Execute(scenario, key);
        Status(replay, 200);
        Same(first, replay);
        await AssertDocument(scenario, original + text + "\n", 1);
        Assert.Equal("consumed", await State(scenario));
        Status(await Execute(scenario), 403);
        await AssertDocument(scenario, original + text + "\n", 1);
    }

    [Theory]
    [InlineData("missing-approval")]
    [InlineData("wrong-agent")]
    [InlineData("proposal")]
    [InlineData("grant")]
    [InlineData("document")]
    [InlineData("operation")]
    [InlineData("text")]
    [InlineData("version")]
    public async Task CompleteAuthorityTupleIsRechecked(string mismatch)
    {
        var scenario = await Setup(approved: mismatch != "missing-approval");
        var other = await Setup();
        var body = JsonSerializer.SerializeToNode(scenario.Execute)!;
        switch (mismatch)
        {
            case "proposal": body["proposalId"] = other.Proposal; break;
            case "grant": body["grantId"] = other.Grant; break;
            case "document": body["documentId"] = other.Document; break;
            case "operation": body["operation"] = "replace"; break;
            case "text": body["text"] = "append "; break;
            case "version": body["expectedVersion"] = 1; break;
        }
        var key = Key();
        var actor = mismatch == "wrong-agent" ? f.OtherAgent : f.Agent;
        var denied = await f.PostAsync("/execute", actor, body, key);
        Status(denied, 403);
        Assert.Equal("denied", denied.Body.GetProperty("outcome").GetString());
        Assert.Equal("authorization_denied", denied.Body.GetProperty("reason").GetString());
        Assert.Equal(JsonValueKind.Null, denied.Body.GetProperty("documentVersion").ValueKind);
        var replay = await f.PostAsync("/execute", actor, body, key);
        Same(denied, replay);
        await AssertDocument(scenario, "initial", 0);
        await AssertDocument(other, "initial", 0);
    }

    [Theory]
    [InlineData("unknown")]
    [InlineData("empty-guid")]
    [InlineData("missing")]
    [InlineData("negative-version")]
    [InlineData("nul")]
    [InlineData("too-long-text")]
    [InlineData("wrong-type")]
    [InlineData("empty-key")]
    public async Task MalformedExecuteDoesNotAllocateKey(string malformed)
    {
        var scenario = await Setup();
        var body = JsonSerializer.SerializeToNode(scenario.Execute)!;
        switch (malformed)
        {
            case "unknown": body["agentId"] = f.Agent.Id; break;
            case "empty-guid": body["grantId"] = Guid.Empty; break;
            case "missing": body.AsObject().Remove("text"); break;
            case "negative-version": body["expectedVersion"] = -1; break;
            case "nul": body["text"] = "x\0y"; break;
            case "too-long-text": body["text"] = new string('é', 4097); break;
            case "wrong-type": body["expectedVersion"] = "0"; break;
        }
        var key = Key();
        Status(await f.PostAsync("/execute", f.Agent, body, malformed == "empty-key" ? "" : key), 400);
        Status(await f.GetAsync($"/attempts/by-key?key={key}", f.Agent), 404);
        Status(await Execute(scenario, key), 200);
    }

    [Fact]
    public async Task RolesCannotSelfApproveEscalateOrChooseIdentity()
    {
        var scenario = await Setup(approved: false);
        Status(await f.PostAsync($"/proposals/{scenario.Proposal}/decision", f.Agent, new { decision = "approved" }), 403);
        Status(await f.PostAsync("/documents", f.Agent, new { title = "mine", content = "" }), 403);
        Status(await f.PostAsync("/execute", f.Human, scenario.Execute, Key()), 403);
        Status(await f.PostAsync("/proposals", f.Human,
            new { documentId = scenario.Document, expectedVersion = 0, text = "x", ttlSeconds = 60 }), 403);
        Status(await f.PostAsync("/proposals", f.Agent,
            new { documentId = scenario.Document, expectedVersion = 0, text = "x", ttlSeconds = 60, agentId = f.OtherAgent.Id }), 400);
        Status(await f.SendAsync(HttpMethod.Post, "/execute", body: scenario.Execute, key: Key()), 401);
        Status(await Execute(scenario), 403);
    }

    [Fact]
    public async Task ForeignOwnersCannotReadDecideRevokeOrInspectEvidenceAndAgentsCannotInspectOwners()
    {
        var scenario = await Setup();
        var allowed = await Execute(scenario);
        Status(allowed, 200);
        foreach (var path in new[] { $"/documents/{scenario.Document}", $"/proposals/{scenario.Proposal}",
                     $"/grants/{scenario.Grant}", $"/documents/{scenario.Document}/evidence", $"/attempts/{allowed.Id}" })
            Status(await f.GetAsync(path, f.OtherHuman), 404);
        Status(await f.PostAsync($"/proposals/{scenario.Proposal}/decision", f.OtherHuman, new { decision = "approved" }), 404);
        Status(await f.PostAsync($"/grants/{scenario.Grant}/revoke", f.OtherHuman, new { reason = "foreign" }), 404);
        Status(await f.GetAsync($"/proposals/{scenario.Proposal}", f.OtherAgent), 404);
        Status(await f.GetAsync($"/attempts/{allowed.Id}", f.OtherAgent), 404);
        Status(await f.PostAsync($"/grants/{scenario.Grant}/revoke", f.Agent, new { reason = "self" }), 403);
        Status(await f.GetAsync($"/documents/{scenario.Document}", f.Agent), 403);
        Status(await f.GetAsync($"/documents/{scenario.Document}/evidence", f.Agent), 403);
        Status(await f.GetAsync($"/attempts/{allowed.Id}", f.Human), 200);
    }

    [Fact]
    public async Task ConcurrentDuplicateApprovalIssuesExactlyOneUsableGrant()
    {
        var scenario = await Setup(approved: false);
        var decisions = await Task.WhenAll(Enumerable.Range(0, 8).Select(_ =>
            f.PostAsync($"/proposals/{scenario.Proposal}/decision", f.Human, new { decision = "approved" })));
        foreach (var decision in decisions) Status(decision, 200);
        var grant = decisions[0].Body.GetProperty("grantId").GetGuid();
        Assert.All(decisions, d => Assert.Equal(grant, d.Body.GetProperty("grantId").GetGuid()));
        Assert.Equal(1L, await f.SqlAsync("SELECT count(*) FROM genesis_authority.grants WHERE proposal_id=@p", ("p", scenario.Proposal)));
        scenario = scenario with { Grant = grant };
        Status(await Execute(scenario), 200);
        Status(await Execute(scenario), 403);
        Status(await f.PostAsync($"/proposals/{scenario.Proposal}/decision", f.Human, new { decision = "rejected" }), 409);
        var again = await f.PostAsync($"/proposals/{scenario.Proposal}/decision", f.Human, new { decision = "approved" });
        Status(again, 200);
        Assert.Equal(grant, again.Body.GetProperty("grantId").GetGuid());
        Assert.Equal("consumed", await State(scenario));
    }

    [Fact]
    public async Task RejectionCannotBecomeApproval()
    {
        var scenario = await Setup(approved: false);
        var first = await f.PostAsync($"/proposals/{scenario.Proposal}/decision", f.Human, new { decision = "rejected" });
        Status(first, 200);
        Assert.Equal(JsonValueKind.Null, first.Body.GetProperty("grantId").ValueKind);
        Same(first, await f.PostAsync($"/proposals/{scenario.Proposal}/decision", f.Human, new { decision = "rejected" }));
        Status(await f.PostAsync($"/proposals/{scenario.Proposal}/decision", f.Human, new { decision = "approved" }), 409);
        Status(await Execute(scenario), 403);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task SameKeyChangedFingerprintConflictsAfterDenialOrSuccess(bool success)
    {
        var scenario = await Setup();
        var original = JsonSerializer.SerializeToNode(scenario.Execute)!;
        if (!success) original["operation"] = "replace";
        var key = Key();
        var first = await f.PostAsync("/execute", f.Agent, original, key);
        Status(first, success ? 200 : 403);
        var changed = original.DeepClone();
        changed["text"] = "different";
        var conflict = await f.PostAsync("/execute", f.Agent, changed, key);
        Status(conflict, 409);
        Assert.Equal("idempotency_conflict", conflict.Body.GetProperty("error").GetString());
        var replay = await f.PostAsync("/execute", f.Agent, original, key);
        Status(replay, first.Status);
        Same(first, replay);
        var lookup = await f.GetAsync($"/attempts/by-key?key={key}", f.Agent);
        Status(lookup, 200);
        Same(first, lookup);
        Status(await f.GetAsync($"/attempts/by-key?key={key}", f.OtherAgent), 404);
    }

    [Fact]
    public async Task DenialReplayAfterRevocationDoesNotRestoreActiveGrant()
    {
        var scenario = await Setup();
        var key = Key();
        var body = JsonSerializer.SerializeToNode(scenario.Execute)!;
        body["text"] = "wrong";
        var denied = await f.PostAsync("/execute", f.Agent, body, key);
        Status(denied, 403);
        Status(await f.PostAsync($"/grants/{scenario.Grant}/revoke", f.Human, new { reason = "cancel" }), 200);
        Same(denied, await f.PostAsync("/execute", f.Agent, body, key));
        Assert.Equal("revoked", await State(scenario));
        Status(await Execute(scenario), 403);
        await AssertDocument(scenario, "initial", 0);
    }

    [Fact]
    public async Task SuccessHistoryRemainsHistoricalAfterLaterVersionAndRestart()
    {
        var scenario = await Setup();
        var key = Key();
        var first = await Execute(scenario, key);
        Status(first, 200);
        var proposal = await Proposal(scenario.Document, "second", 1);
        var decision = await f.PostAsync($"/proposals/{proposal}/decision", f.Human, new { decision = "approved" });
        Status(decision, 200);
        var second = new Scenario(scenario.Document, proposal, decision.Body.GetProperty("grantId").GetGuid(), "second", 1);
        Status(await Execute(second), 200);
        await f.StopAsync();
        await f.StartAsync();
        var replay = await Execute(scenario, key);
        Status(replay, 200);
        Same(first, replay);
        Same(first, await f.GetAsync($"/attempts/{first.Id}", f.Agent));
        Same(first, await f.GetAsync($"/attempts/by-key?key={key}", f.Agent));
        Assert.False(replay.Body.TryGetProperty("content", out _));
        Assert.False(replay.Body.TryGetProperty("document", out _));
        Assert.Equal(1, replay.Body.GetProperty("documentVersion").GetInt64());
        await AssertDocument(scenario, "initialappend\nsecond\n", 2);
        Assert.Equal("consumed", await State(scenario));
    }

    [Fact]
    public async Task DisabledAgentCannotReplayCachedSuccess()
    {
        var actor = await f.SeedAsync("agent", "disable after execution");
        var document = await Document();
        var proposal = await f.PostAsync("/proposals", actor,
            new { documentId = document, expectedVersion = 0, text = "x", ttlSeconds = 600 });
        Status(proposal, 201);
        var decision = await f.PostAsync($"/proposals/{proposal.Id}/decision", f.Human, new { decision = "approved" });
        Status(decision, 200);
        var scenario = new Scenario(document, proposal.Id, decision.Body.GetProperty("grantId").GetGuid(), "x");
        var key = Key();
        Status(await Execute(scenario, key, actor), 200);
        await f.SqlAsync("UPDATE genesis_authority.principals SET enabled=false WHERE id=@id", ("id", actor.Id));
        Status(await Execute(scenario, key, actor), 401);
        Status(await f.GetAsync($"/attempts/by-key?key={key}", actor), 401);
    }

    [Fact]
    public async Task DisabledApproverInvalidatesExistingApproval()
    {
        var human = await f.SeedAsync("human", "disable after approval");
        var document = await Document(owner: human);
        var proposal = await Proposal(document);
        var decision = await f.PostAsync($"/proposals/{proposal}/decision", human, new { decision = "approved" });
        Status(decision, 200);
        await f.SqlAsync("UPDATE genesis_authority.principals SET enabled=false WHERE id=@id", ("id", human.Id));
        var scenario = new Scenario(document, proposal, decision.Body.GetProperty("grantId").GetGuid(), "append");
        Status(await Execute(scenario), 403);
        Assert.Equal(0L, await f.SqlAsync("SELECT version FROM genesis_authority.documents WHERE id=@id", ("id", document)));
        Status(await f.PostAsync($"/proposals/{proposal}/decision", human, new { decision = "approved" }), 401);
    }

    [Fact]
    public async Task WrongSubmittedDocumentEvidenceBelongsToRealProposalOwner()
    {
        var scenario = await Setup();
        var foreign = await Document(owner: f.OtherHuman);
        var body = JsonSerializer.SerializeToNode(scenario.Execute)!;
        body["documentId"] = foreign;
        var attempt = await f.PostAsync("/execute", f.Agent, body, Key());
        Status(attempt, 403);
        Status(await f.GetAsync($"/attempts/{attempt.Id}", f.Human), 200);
        Status(await f.GetAsync($"/attempts/{attempt.Id}", f.OtherHuman), 404);
        var evidence = await f.GetAsync($"/documents/{scenario.Document}/evidence", f.Human);
        Status(evidence, 200);
        var item = Assert.Single(evidence.Body.EnumerateArray(), e =>
            e.GetProperty("attemptId").ValueKind == JsonValueKind.String && e.GetProperty("attemptId").GetGuid() == attempt.Id);
        Assert.Equal(scenario.Document, item.GetProperty("documentId").GetGuid());
        Assert.Equal(f.Agent.Id, item.GetProperty("requesterId").GetGuid());
        Assert.Equal(f.Human.Id, item.GetProperty("approverId").GetGuid());
        Assert.Equal(scenario.Proposal, item.GetProperty("proposalId").GetGuid());
        Assert.Equal(scenario.Grant, item.GetProperty("grantId").GetGuid());
        Assert.Equal("denied", item.GetProperty("outcome").GetString());
        Assert.Equal(JsonValueKind.Object, item.GetProperty("details").ValueKind);
        Assert.False(string.IsNullOrWhiteSpace(item.GetProperty("action").GetString()));
        Assert.EndsWith("Z", item.GetProperty("createdAt").GetString());
        Assert.Equal(1L, await f.SqlAsync("""
            SELECT count(*) FROM genesis_authority.evidence WHERE id=@id AND document_id=@document
                AND requester_id=@requester AND approver_id=@approver AND proposal_id=@proposal
                AND grant_id=@grant AND attempt_id=@attempt AND jsonb_typeof(details)='object'
            """, ("id", item.GetProperty("id").GetGuid()), ("document", scenario.Document),
            ("requester", f.Agent.Id), ("approver", f.Human.Id), ("proposal", scenario.Proposal),
            ("grant", scenario.Grant), ("attempt", attempt.Id)));
        var foreignEvidence = await f.GetAsync($"/documents/{foreign}/evidence", f.OtherHuman);
        Assert.DoesNotContain(foreignEvidence.Body.EnumerateArray(), e =>
            e.GetProperty("attemptId").ValueKind == JsonValueKind.String && e.GetProperty("attemptId").GetGuid() == attempt.Id);
    }
}
