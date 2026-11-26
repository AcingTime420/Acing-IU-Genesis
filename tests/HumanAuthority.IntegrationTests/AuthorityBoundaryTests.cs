using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Npgsql;

namespace HumanAuthority.IntegrationTests;

public sealed partial class AuthorityTests
{
    [Fact]
    public async Task ProposalAndGrantFreezeExactScopeAndDeadline()
    {
        var scenario = await Setup(" e\u0301\r\n");
        var proposal = await f.GetAsync($"/proposals/{scenario.Proposal}", f.Agent);
        var grant = await f.GetAsync($"/grants/{scenario.Grant}", f.Human);
        Status(proposal, 200);
        Status(grant, 200);
        Assert.Equal(f.Agent.Id, proposal.Body.GetProperty("agentId").GetGuid());
        Assert.Equal("proposing agent", proposal.Body.GetProperty("agentName").GetString());
        Assert.Equal(scenario.Document, proposal.Body.GetProperty("documentId").GetGuid());
        Assert.Equal("append", proposal.Body.GetProperty("operation").GetString());
        Assert.Equal(scenario.Text, proposal.Body.GetProperty("text").GetString());
        Assert.Equal(0, proposal.Body.GetProperty("expectedVersion").GetInt64());
        Assert.True(proposal.Body.GetProperty("singleUse").GetBoolean());
        Assert.True(grant.Body.GetProperty("singleUse").GetBoolean());
        Assert.Equal(scenario.Proposal, grant.Body.GetProperty("proposalId").GetGuid());
        Assert.Equal(scenario.Document, grant.Body.GetProperty("documentId").GetGuid());
        Assert.Equal(f.Agent.Id, grant.Body.GetProperty("agentId").GetGuid());
        Assert.Equal(proposal.Body.GetProperty("expiresAt").GetString(), grant.Body.GetProperty("expiresAt").GetString());
        Assert.EndsWith("Z", proposal.Body.GetProperty("expiresAt").GetString());
        var repeated = await f.PostAsync($"/proposals/{scenario.Proposal}/decision", f.Human, new { decision = "approved" });
        Status(repeated, 200);
        Same(grant, await f.GetAsync($"/grants/{scenario.Grant}", f.Human));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(601)]
    [InlineData(-1)]
    public async Task InvalidTtlCannotIssueProposal(int ttl)
    {
        var document = await Document();
        var result = await f.PostAsync("/proposals", f.Agent,
            new { documentId = document, expectedVersion = 0, text = "x", ttlSeconds = ttl });
        Status(result, 400);
        Assert.Equal(0L, await f.SqlAsync("SELECT count(*) FROM genesis_authority.proposals WHERE document_id=@id", ("id", document)));
    }

    [Theory]
    [InlineData("empty-text")]
    [InlineData("nul-text")]
    [InlineData("large-utf8")]
    [InlineData("negative-version")]
    [InlineData("extra-scope")]
    public async Task InvalidProposalScopeIsRejected(string invalid)
    {
        var document = await Document();
        var body = new System.Text.Json.Nodes.JsonObject
        {
            ["documentId"] = document, ["expectedVersion"] = 0, ["text"] = "x", ["ttlSeconds"] = 600
        };
        switch (invalid)
        {
            case "empty-text": body["text"] = ""; break;
            case "nul-text": body["text"] = "\0"; break;
            case "large-utf8": body["text"] = new string('é', 4097); break;
            case "negative-version": body["expectedVersion"] = -1; break;
            case "extra-scope": body["operation"] = "replace"; break;
        }
        Status(await f.PostAsync("/proposals", f.Agent, body), 400);
    }

    [Fact]
    public async Task ResultingUtf8ContentLimitIncludesMandatoryLf()
    {
        var scenario = await Setup("é", new string('a', 1048574));
        Status(await Execute(scenario), 403);
        await AssertDocument(scenario, new string('a', 1048574), 0);
        Assert.Equal("active", await State(scenario));
        var exact = await Setup("é", new string('a', 1048573));
        Status(await Execute(exact), 200);
        Assert.Equal(1048576L, await f.SqlAsync("SELECT octet_length(content)::bigint FROM genesis_authority.documents WHERE id=@id",
            ("id", exact.Document)));
    }

    [Fact]
    public async Task InitialDocumentUtf8AndTitleLimitsAreEnforced()
    {
        Status(await f.PostAsync("/documents", f.Human, new { title = "", content = "" }), 400);
        Status(await f.PostAsync("/documents", f.Human, new { title = new string('x', 201), content = "" }), 400);
        Status(await f.PostAsync("/documents", f.Human, new { title = "x", content = "a\0b" }), 400);
        Status(await f.PostAsync("/documents", f.Human, new { title = "x", content = new string('é', 524289) }), 400);
        Status(await f.PostAsync("/documents", f.Human, new { title = "x", content = new string('é', 524288) }), 201);
    }

    [Fact]
    public async Task MalformedJsonAndWrongKindDoNotAllocateAcceptedKey()
    {
        var scenario = await Setup();
        var key = Key();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/v1/authority/execute");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", f.Agent.Credential);
        request.Headers.Add("Idempotency-Key", key);
        request.Content = new StringContent("{\"proposalId\":", Encoding.UTF8, "application/json");
        using var response = await f.Http.SendAsync(request);
        Assert.Equal(400, (int)response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("invalid_request", json.RootElement.GetProperty("error").GetString());
        Status(await f.PostAsync("/execute", f.Human, scenario.Execute, key), 403);
        Status(await f.GetAsync($"/attempts/by-key?key={key}", f.Agent), 404);
        Status(await Execute(scenario, key), 200);
    }

    [Fact]
    public async Task MissingApprovalDenialRemainsHistoricalAfterActualApproval()
    {
        var scenario = await Setup(approved: false);
        var key = Key();
        var first = await Execute(scenario, key);
        Status(first, 403);
        var decision = await f.PostAsync($"/proposals/{scenario.Proposal}/decision", f.Human, new { decision = "approved" });
        Status(decision, 200);
        var replay = await Execute(scenario, key);
        Status(replay, 403);
        Same(first, replay);
        await AssertDocument(scenario, "initial", 0);
        scenario = scenario with { Grant = decision.Body.GetProperty("grantId").GetGuid() };
        Status(await Execute(scenario), 200);
    }

    [Fact]
    public async Task RevocationIsDurableIdempotentAndTerminal()
    {
        var scenario = await Setup();
        Status(await f.PostAsync($"/grants/{scenario.Grant}/revoke", f.Human, new { reason = "" }), 400);
        Status(await f.PostAsync($"/grants/{scenario.Grant}/revoke", f.Human, new { reason = new string('x', 501) }), 400);
        var first = await f.PostAsync($"/grants/{scenario.Grant}/revoke", f.Human, new { reason = "original reason" });
        Status(first, 200);
        Assert.Equal("revoked", first.Body.GetProperty("state").GetString());
        Same(first, await f.PostAsync($"/grants/{scenario.Grant}/revoke", f.Human, new { reason = "later reason" }));
        Assert.Equal(1L, await f.SqlAsync("SELECT count(*) FROM genesis_authority.revocations WHERE grant_id=@id", ("id", scenario.Grant)));
        Assert.Equal("original reason", await f.SqlAsync("SELECT reason FROM genesis_authority.revocations WHERE grant_id=@id",
            ("id", scenario.Grant)));
        var decision = await f.PostAsync($"/proposals/{scenario.Proposal}/decision", f.Human, new { decision = "approved" });
        Status(decision, 200);
        Assert.Equal(scenario.Grant, decision.Body.GetProperty("grantId").GetGuid());
        Assert.Equal("revoked", await State(scenario));
        Status(await Execute(scenario), 403);
        var error = await Assert.ThrowsAsync<PostgresException>(() => f.SqlAsync(
            "UPDATE genesis_authority.grants SET state='active' WHERE id=@id", ("id", scenario.Grant)));
        Assert.Equal("23514", error.SqlState);
        await AssertDocument(scenario, "initial", 0);
    }

    [Fact]
    public async Task SameKeyIsScopedToAuthenticatedAgentAndByKeyIsExact()
    {
        var scenario = await Setup();
        var key = "case-sensitive-" + Key();
        var first = await Execute(scenario, key);
        Status(first, 200);
        Status(await f.GetAsync($"/attempts/by-key?key={key.ToUpperInvariant()}", f.Agent), 404);
        Status(await f.GetAsync($"/attempts/by-key?key={key}", f.OtherAgent), 404);
        var other = await Execute(scenario, key, f.OtherAgent);
        Status(other, 403);
        Assert.NotEqual(first.Id, other.Id);
        Same(first, await f.GetAsync($"/attempts/by-key?key={key}", f.Agent));
        Same(other, await f.GetAsync($"/attempts/by-key?key={key}", f.OtherAgent));
    }
}
