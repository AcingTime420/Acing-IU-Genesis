using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using AcingIU.DeviceTrust.Api.Controllers;
using AcingIU.DeviceTrust.Api.Data;
using AcingIU.DeviceTrust.Api.Models;
using AcingIU.DeviceTrust.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;

namespace DeviceTrust.OwnershipTests;

// The identity handler is synthetic and confined to this test assembly. Authorization
// attributes, controller/service/repository source, HTTP and PostgreSQL are real.
public sealed class FixtureAuth(IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger, UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public static readonly Guid Owner = Guid.Parse("10000000-0000-0000-0000-000000000001");
    public static readonly Guid Other = Guid.Parse("10000000-0000-0000-0000-000000000002");
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var role = Request.Headers["X-Test-Principal"].ToString();
        if (role is not ("owner" or "other" or "admin" or "invalid"))
            return Task.FromResult(AuthenticateResult.NoResult());
        var subject = role == "invalid" ? "invalid" : (role == "owner" ? Owner : Other).ToString();
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, subject),
            new Claim(ClaimTypes.Role, role == "admin" ? "Admin" : "User") };
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(
            new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name)), Scheme.Name)));
    }
}

public sealed class OwnershipFixture : IAsyncLifetime
{
    public string ConnectionString = "";
    public WebApplication App = null!;
    public HttpClient Http = null!;
    private NpgsqlConnection lease = null!;
    public async Task InitializeAsync()
    {
        var input = Environment.GetEnvironmentVariable("GENESIS_DEVICETRUST_TEST_DATABASE");
        if (string.IsNullOrWhiteSpace(input)) throw new InvalidOperationException("A disposable DeviceTrust test database is required.");
        var cs = new NpgsqlConnectionStringBuilder(input);
        if (cs.Database != "genesis_devicetrust_test" || cs.Host != "127.0.0.1")
            throw new InvalidOperationException("Refusing reset outside exact loopback genesis_devicetrust_test.");
        cs.SearchPath = "devicetrust_test";
        cs.IncludeErrorDetail = false;
        cs.Timeout = 5; cs.CommandTimeout = 10;
        ConnectionString = cs.ConnectionString;
        lease = new NpgsqlConnection(ConnectionString); await lease.OpenAsync();
        await using (var cmd = new NpgsqlCommand("SELECT pg_try_advisory_lock(74192041683016)", lease))
            if (!(bool)(await cmd.ExecuteScalarAsync())!) throw new InvalidOperationException("Concurrent suite; refusing schema reset.");
        await Sql("""
            DROP SCHEMA IF EXISTS devicetrust_test CASCADE;
            CREATE SCHEMA devicetrust_test;
            CREATE TABLE users(id uuid PRIMARY KEY);
            """);
        var root = new DirectoryInfo(AppContext.BaseDirectory);
        while (root is not null && !Directory.Exists(Path.Combine(root.FullName, "infrastructure/postgres/init"))) root = root.Parent;
        if (root is null) throw new InvalidOperationException("Canonical schema sources unavailable.");
        foreach (var (file, table) in new[] { ("001_init_identity_schema.sql", "registered_devices"),
            ("000_security_core.sql", "security_audit_logs"), ("000_security_core.sql", "policy_configurations") })
        {
            var schema = await File.ReadAllTextAsync(Path.Combine(root.FullName, "infrastructure/postgres/init", file));
            var start = schema.IndexOf($"CREATE TABLE IF NOT EXISTS {table} (", StringComparison.Ordinal);
            var end = schema.IndexOf("\n);", start, StringComparison.Ordinal);
            if (start < 0 || end < 0) throw new InvalidOperationException("Schema extraction failed closed.");
            await Sql(schema[start..(end + 3)]);
        }
        await Sql($"INSERT INTO users VALUES ('{FixtureAuth.Owner}'),('{FixtureAuth.Other}');");
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Test" });
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Logging.ClearProviders();
        builder.Configuration["ConnectionStrings:Default"] = ConnectionString;
        builder.Services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();
        builder.Services.AddScoped<IDeviceRepository, DeviceRepository>();
        builder.Services.AddSingleton<ITrustScoreEngine, TrustScoreEngine>();
        builder.Services.AddScoped<ITrustService, TrustService>();
        builder.Services.AddAuthentication("Fixture").AddScheme<AuthenticationSchemeOptions, FixtureAuth>("Fixture", _ => { });
        builder.Services.AddAuthorization();
        builder.Services.AddControllers().AddApplicationPart(typeof(TrustController).Assembly);
        App = builder.Build(); App.UseAuthentication(); App.UseAuthorization(); App.MapControllers();
        await App.StartAsync();
        Http = new HttpClient { BaseAddress = new Uri(App.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()!.Addresses.Single()) };
    }
    public async Task<object?> Sql(string sql)
    {
        await using var conn = new NpgsqlConnection(ConnectionString); await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand(sql, conn); return await cmd.ExecuteScalarAsync();
    }
    public async Task Seed()
    {
        await Sql($"""
            DROP TRIGGER IF EXISTS fail_evidence ON security_audit_logs;
            TRUNCATE security_audit_logs, registered_devices RESTART IDENTITY;
            INSERT INTO registered_devices(hw_identifier,soc_model,owner_user_id) VALUES ('owned','synthetic','{FixtureAuth.Owner}'),('unowned','synthetic',NULL);
            """);
    }
    public async Task<HttpResponseMessage> Request(string role, string target, bool write)
    {
        using var request = new HttpRequestMessage(write ? HttpMethod.Post : HttpMethod.Get,
            write ? "/api/trust/telemetry/submit" : "/api/trust/devices/" + target);
        if (role != "anonymous") request.Headers.Add("X-Test-Principal", role);
        if (write) request.Content = JsonContent.Create(new TelemetrySubmitRequest { HwIdentifier = target, SocModel = "updated", SelinuxStatus = "Enforcing" });
        return await Http.SendAsync(request);
    }
    public async Task DisposeAsync()
    {
        Http?.Dispose();
        if (App is not null) await App.DisposeAsync();
        if (lease is not null) await lease.DisposeAsync();
    }
}

[CollectionDefinition("DeviceTrust database")]
public sealed class DatabaseCollection : ICollectionFixture<OwnershipFixture> { }

[Collection("DeviceTrust database")]
public sealed class OwnershipTests(OwnershipFixture fixture)
{
    [Theory]
    [InlineData("owner", "owned", false, 200)]
    [InlineData("owner", "owned", true, 200)]
    [InlineData("other", "owned", false, 404)]
    [InlineData("other", "owned", true, 404)]
    [InlineData("owner", "missing", false, 404)]
    [InlineData("owner", "missing", true, 404)]
    [InlineData("owner", "unowned", false, 404)]
    [InlineData("owner", "unowned", true, 404)]
    [InlineData("admin", "owned", false, 200)]
    [InlineData("admin", "owned", true, 200)]
    [InlineData("admin", "missing", true, 404)]
    [InlineData("invalid", "owned", true, 401)]
    [InlineData("anonymous", "owned", true, 401)]
    public async Task OwnerRoleUnknownAndAuthenticationBoundaries(string role, string target, bool write, int status)
    {
        await fixture.Seed();
        using var response = await fixture.Request(role, target, write);
        Assert.Equal(status, (int)response.StatusCode);
        if (status == 404)
        {
            Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
            var body = await response.Content.ReadAsStringAsync();
            Assert.Contains("Device not registered.", body);
            Assert.DoesNotContain(FixtureAuth.Owner.ToString(), body);
        }
        var changed = (long)(await fixture.Sql("SELECT count(*) FROM registered_devices WHERE soc_model='updated'"))!;
        Assert.Equal(write && status == 200 ? 1L : 0L, changed);
        Assert.Equal(2L, (long)(await fixture.Sql("SELECT count(*) FROM registered_devices"))!);
        if (write && status == 200) Assert.Equal(1L,(long)(await fixture.Sql("SELECT count(*) FROM security_audit_logs WHERE event_type='trust.telemetry.submit'"))!);
        if (status == 404) Assert.Equal(1L,(long)(await fixture.Sql("SELECT count(*) FROM security_audit_logs WHERE severity='WARNING'"))!);
    }

    [Fact]
    public async Task EvidenceWriteFailureRollsBackDeviceMutationAndReturnsGenericUnavailable()
    {
        await fixture.Seed();
        await fixture.Sql("""
            CREATE OR REPLACE FUNCTION refuse_evidence() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic private database error'; END $$;
            CREATE TRIGGER fail_evidence BEFORE INSERT ON security_audit_logs FOR EACH ROW EXECUTE FUNCTION refuse_evidence();
            """);
        using var response = await fixture.Request("owner", "owned", true);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.DoesNotContain("synthetic private", await response.Content.ReadAsStringAsync());
        Assert.Equal(0L, (long)(await fixture.Sql("SELECT count(*) FROM registered_devices WHERE soc_model='updated'"))!);
        Assert.Equal(0L, (long)(await fixture.Sql("SELECT count(*) FROM security_audit_logs"))!);
    }

    [Fact]
    public async Task DenialEvidenceFailureReturnsUnavailableWithoutDisclosingDatabaseError()
    {
        await fixture.Seed();
        await fixture.Sql("""
            CREATE OR REPLACE FUNCTION refuse_evidence() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic private database error'; END $$;
            CREATE TRIGGER fail_evidence BEFORE INSERT ON security_audit_logs FOR EACH ROW EXECUTE FUNCTION refuse_evidence();
            """);
        using var response = await fixture.Request("other", "owned", true);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.DoesNotContain("synthetic private", await response.Content.ReadAsStringAsync());
        Assert.Equal(0L, (long)(await fixture.Sql("SELECT count(*) FROM registered_devices WHERE soc_model='updated'"))!);
    }

    [Fact]
    public async Task OwnershipTransferWhileUpdateWaitsIsRecheckedUnderDatabaseLock()
    {
        await fixture.Seed();
        await using var conn = new NpgsqlConnection(fixture.ConnectionString);
        await conn.OpenAsync();
        await using var transaction = await conn.BeginTransactionAsync();
        await using (var transfer = new NpgsqlCommand("UPDATE registered_devices SET owner_user_id=@owner WHERE hw_identifier='owned'", conn, transaction))
        {
            transfer.Parameters.AddWithValue("owner", FixtureAuth.Other);
            await transfer.ExecuteNonQueryAsync();
        }
        var request = fixture.Request("owner", "owned", true);
        var waiting = false;
        for (var attempt = 0; attempt < 100; attempt++)
        {
            waiting = (long)(await fixture.Sql("SELECT count(*) FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE '%UPDATE registered_devices%'"))! > 0;
            if (waiting) break;
            await Task.Delay(20);
        }
        Assert.True(waiting, "must observe the actual database lock wait before transfer commits");
        await transaction.CommitAsync();
        using var response = await request;
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(0L, (long)(await fixture.Sql("SELECT count(*) FROM registered_devices WHERE soc_model='updated'"))!);
    }

    [Fact]
    public async Task ConcurrentOwnerAndForeignWritesProduceOnlyAuthorizedAuditedMutations()
    {
        await fixture.Seed();
        var responses = await Task.WhenAll(Enumerable.Range(0, 12).Select(i => fixture.Request(i % 2 == 0 ? "owner" : "other", "owned", true)));
        try
        {
            Assert.Equal(6, responses.Count(r => r.StatusCode == HttpStatusCode.OK));
            Assert.Equal(6, responses.Count(r => r.StatusCode == HttpStatusCode.NotFound));
            Assert.Equal(6L, (long)(await fixture.Sql("SELECT count(*) FROM security_audit_logs WHERE event_type='trust.telemetry.submit'"))!);
            Assert.Equal(6L, (long)(await fixture.Sql("SELECT count(*) FROM security_audit_logs WHERE event_type='trust.telemetry.access_denied'"))!);
            Assert.Equal(FixtureAuth.Owner, (Guid)(await fixture.Sql("SELECT owner_user_id FROM registered_devices WHERE hw_identifier='owned'"))!);
        }
        finally { foreach (var response in responses) response.Dispose(); }
    }
}
