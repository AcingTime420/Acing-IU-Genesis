using System.Text.Json;

namespace HumanAuthority.IntegrationTests;

[Collection(AuthorityCollection.Name)]
public sealed class AuthorityReadinessTests(AuthorityFixture fixture)
{
    [Fact]
    public async Task RealProcessProbesPostgresqlAndRejectsUnauthenticatedProtectedRequest()
    {
        using var ready = await fixture.Http.GetAsync("/health/ready");
        Assert.Equal(200, (int)ready.StatusCode);
        using var json = JsonDocument.Parse(await ready.Content.ReadAsStringAsync());
        Assert.Equal("ready", json.RootElement.GetProperty("status").GetString());
        Assert.Equal(1, await fixture.SqlAsync("SELECT max(version) FROM genesis_authority.schema_versions"));
        var unauthorized = await fixture.GetAsync($"/documents/{Guid.NewGuid()}");
        Assert.Equal(401, unauthorized.Status);
        Assert.Equal("unauthorized", unauthorized.Body.GetProperty("error").GetString());
    }
}
