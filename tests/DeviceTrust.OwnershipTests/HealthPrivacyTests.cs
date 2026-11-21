using System.Net;
using System.Text.Json;
using AcingIU.DeviceTrust.Api.Controllers;
using AcingIU.DeviceTrust.Api.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace DeviceTrust.OwnershipTests;

// Exercise the actual anonymous HTTP endpoint with synthetic connection failures.
// No database, credentials, production launcher or JWT validation is involved.
public sealed class HealthPrivacyTests
{
    private const string SensitiveDiagnostic =
        "synthetic-private-db.internal:5432; Username=fixture; Password=fixture-only; /private/fixture";

    private sealed class FailingConnectionFactory(Exception failure) : IDbConnectionFactory
    {
        public int Attempts { get; private set; }
        public Task<NpgsqlConnection> CreateOpenConnectionAsync(CancellationToken ct = default)
        {
            Attempts++;
            return Task.FromException<NpgsqlConnection>(failure);
        }
    }

    [Theory]
    [InlineData("database")]
    [InlineData("timeout")]
    [InlineData("configuration")]
    public async Task AnonymousReadinessFailureDoesNotDiscloseDependencyDiagnostics(string kind)
    {
        Exception failure = kind switch
        {
            "database" => new NpgsqlException(SensitiveDiagnostic),
            "timeout" => new TimeoutException(SensitiveDiagnostic),
            _ => new InvalidOperationException(SensitiveDiagnostic)
        };
        var factory = new FailingConnectionFactory(failure);
        await using var app = CreateApp(factory);
        await app.StartAsync();
        using var client = CreateClient(app);
        using var response = await client.GetAsync("/health/ready");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("synthetic-private-db", body);
        Assert.DoesNotContain("Password", body);
        Assert.DoesNotContain("/private/fixture", body);
        using var document = JsonDocument.Parse(body);
        Assert.Equal("not_ready", document.RootElement.GetProperty("status").GetString());
        Assert.Equal("Device trust is unavailable.", document.RootElement.GetProperty("detail").GetString());
        Assert.Equal(1, factory.Attempts);
    }

    [Fact]
    public async Task AnonymousLivenessDoesNotRequireDatabaseAvailability()
    {
        var factory = new FailingConnectionFactory(new NpgsqlException(SensitiveDiagnostic));
        await using var app = CreateApp(factory);
        await app.StartAsync();
        using var client = CreateClient(app);
        using var response = await client.GetAsync("/health/live");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("ok", body.RootElement.GetProperty("status").GetString());
        Assert.Equal("acing-device-trust", body.RootElement.GetProperty("service").GetString());
        Assert.Equal(0, factory.Attempts);
    }

    private static WebApplication CreateApp(IDbConnectionFactory factory)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Test" });
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Logging.ClearProviders();
        builder.Services.AddSingleton(factory);
        builder.Services.AddControllers().AddApplicationPart(typeof(HealthController).Assembly);
        var app = builder.Build();
        app.MapControllers();
        return app;
    }

    private static HttpClient CreateClient(WebApplication app) => new()
    {
        BaseAddress = new Uri(app.Services.GetRequiredService<IServer>()
            .Features.Get<IServerAddressesFeature>()!.Addresses.Single()),
        Timeout = TimeSpan.FromSeconds(10)
    };
}
