using System.Net;
using System.Text;
using System.Text.Json;

namespace DeviceTrust.OwnershipTests;

// Uses real canonical-source HTTP and disposable PostgreSQL. These observations
// are validated against the OpenAPI document by validate-devicetrust-contract.py.
[Collection("DeviceTrust database")]
public sealed class ContractHttpTests(OwnershipFixture fixture)
{
    [Theory]
    [InlineData("owner", "/api/trust/devices/owned", "/api/trust/devices/{hwId}", false, 200)]
    [InlineData("other", "/api/trust/devices/owned", "/api/trust/devices/{hwId}", false, 404)]
    [InlineData("admin", "/api/trust/devices", "/api/trust/devices", false, 200)]
    [InlineData("owner", "/api/trust/devices", "/api/trust/devices", false, 403)]
    [InlineData("anonymous", "/api/trust/devices/owned", "/api/trust/devices/{hwId}", false, 401)]
    [InlineData("owner", "/api/trust/telemetry/submit", "/api/trust/telemetry/submit", true, 200)]
    public async Task CaptureCanonicalHttpContract(string role, string url, string path, bool post, int status)
    {
        await fixture.Seed();
        using var request = new HttpRequestMessage(post ? HttpMethod.Post : HttpMethod.Get, url);
        if (role != "anonymous") request.Headers.Add("X-Test-Principal", role);
        // Deliberately omit defaulted properties and send an unknown property:
        // ASP.NET currently accepts it; the contract must not claim strict rejection.
        const string json = """{"hwIdentifier":"owned","socModel":"contract-fixture","extraFixtureProperty":true}""";
        if (post) request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        using var response = await fixture.Http.SendAsync(request);
        Assert.Equal(status, (int)response.StatusCode);
        await ContractObservation.Write(path, post ? "post" : "get", response, post ? json : null);
    }

    [Fact]
    public async Task MissingRequiredSocModelIsRejectedBeforeMutation()
    {
        await fixture.Seed();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/trust/telemetry/submit");
        request.Headers.Add("X-Test-Principal", "owner");
        request.Content = new StringContent("""{"hwIdentifier":"owned"}""", Encoding.UTF8, "application/json");
        using var response = await fixture.Http.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(0L, (long)(await fixture.Sql("SELECT count(*) FROM security_audit_logs"))!);
        // Invalid requests are intentionally excluded from request-schema acceptance.
        await ContractObservation.Write("/api/trust/telemetry/submit", "post", response);
    }
}

internal static class ContractObservation
{
    public static async Task Write(string path, string method, HttpResponseMessage response, string? request = null)
    {
        var directory = Environment.GetEnvironmentVariable("GENESIS_CONTRACT_OBSERVATIONS");
        if (string.IsNullOrEmpty(directory)) return;
        var text = await response.Content.ReadAsStringAsync();
        JsonElement? body = string.IsNullOrWhiteSpace(text) ? null : JsonSerializer.Deserialize<JsonElement>(text);
        var observation = new
        {
            path, method, status = ((int)response.StatusCode).ToString(),
            mediaType = response.Content.Headers.ContentType?.MediaType,
            body, request = request is null ? (JsonElement?)null : JsonSerializer.Deserialize<JsonElement>(request)
        };
        Directory.CreateDirectory(directory);
        await File.WriteAllTextAsync(Path.Combine(directory, Guid.NewGuid() + ".json"), JsonSerializer.Serialize(observation));
    }
}
