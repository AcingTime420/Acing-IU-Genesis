using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Npgsql;

namespace HumanAuthority.IntegrationTests;

[CollectionDefinition(Name, DisableParallelization = true)]
public sealed class AuthorityCollection : ICollectionFixture<AuthorityFixture>
{
    public const string Name = "actual-http-postgresql";
}

public sealed record Actor(Guid Id, string Credential);
public sealed record ApiResponse(int Status, JsonElement Body)
{
    public Guid Id => Body.GetProperty("id").GetGuid();
}

public sealed class AuthorityFixture : IAsyncLifetime
{
    private Process? service;
    private NpgsqlConnection? databaseLease;
    private readonly ConcurrentQueue<string> output = new();
    public string Root { get; } = FindRoot();
    public string ConnectionString { get; private set; } = "";
    public string ServiceApplication { get; } = $"authority-http-tests-{Guid.NewGuid():N}";
    public HttpClient Http { get; private set; } = null!;
    public Actor Human { get; private set; } = null!;
    public Actor OtherHuman { get; private set; } = null!;
    public Actor Agent { get; private set; } = null!;
    public Actor OtherAgent { get; private set; } = null!;

    public static NpgsqlConnectionStringBuilder GuardDatabase(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException("GENESIS_TEST_DATABASE is required; tests never skip missing infrastructure.");
        var cs = new NpgsqlConnectionStringBuilder(value);
        if (cs.Database is null || !cs.Database.EndsWith("_test", StringComparison.Ordinal) ||
            cs.Host is not ("localhost" or "127.0.0.1" or "::1" or "/var/run/postgresql"))
            throw new InvalidOperationException("Test database must end in _test and use loopback or exactly /var/run/postgresql.");
        cs.Timeout = 10;
        cs.CommandTimeout = 20;
        return cs;
    }

    public async Task InitializeAsync()
    {
        var cs = GuardDatabase(Environment.GetEnvironmentVariable("GENESIS_TEST_DATABASE"));
        cs.ApplicationName = "authority-test-controller";
        ConnectionString = cs.ConnectionString;
        databaseLease = await OpenAsync();
        await using (var lease = new NpgsqlCommand("SELECT pg_try_advisory_lock(74192041683015)", databaseLease))
            if (!(bool)(await lease.ExecuteScalarAsync())!)
                throw new InvalidOperationException("Another authority integration suite is using this database; refusing reset.");
        await using var connection = await OpenAsync();
        await using (var reset = new NpgsqlCommand("DROP SCHEMA IF EXISTS genesis_authority CASCADE", connection))
            await reset.ExecuteNonQueryAsync();
        var migration = await File.ReadAllTextAsync(Path.Combine(Root, "database/migrations/001_human_authority.sql"));
        await using (var apply = new NpgsqlCommand(migration, connection))
            await apply.ExecuteNonQueryAsync();
        Human = await SeedAsync("human", "owner");
        OtherHuman = await SeedAsync("human", "other owner");
        Agent = await SeedAsync("agent", "proposing agent");
        OtherAgent = await SeedAsync("agent", "other agent");
        await StartAsync();
    }

    public async Task<Actor> SeedAsync(string kind, string name)
    {
        var credential = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        await using var connection = await OpenAsync();
        await using var command = new NpgsqlCommand("""
            INSERT INTO genesis_authority.principals(kind,display_name,credential_hash)
            VALUES (@kind,@name,@hash) RETURNING id
            """, connection);
        command.Parameters.AddWithValue("kind", kind);
        command.Parameters.AddWithValue("name", name);
        command.Parameters.AddWithValue("hash", SHA256.HashData(Encoding.UTF8.GetBytes(credential)));
        return new Actor((Guid)(await command.ExecuteScalarAsync())!, credential);
    }

    public async Task StartAsync()
    {
        var assembly = typeof(AuthorityFixture).Assembly;
        var configuration = assembly.GetCustomAttribute<AssemblyConfigurationAttribute>()!.Configuration;
        var artifact = assembly.GetCustomAttributes<AssemblyMetadataAttribute>()
            .Single(a => a.Key == "HumanAuthorityArtifact").Value!;
        ValidateBackendArtifact(artifact, configuration);
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        var start = new ProcessStartInfo("dotnet")
        {
            WorkingDirectory = Root,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false
        };
        start.ArgumentList.Add(artifact);
        start.Environment["ASPNETCORE_ENVIRONMENT"] = "Test";
        start.Environment["DOTNET_ENVIRONMENT"] = "Test";
        start.Environment["ASPNETCORE_URLS"] = $"http://127.0.0.1:{port}";
        var serviceCs = new NpgsqlConnectionStringBuilder(ConnectionString) { ApplicationName = ServiceApplication };
        start.Environment["ConnectionStrings__Default"] = serviceCs.ConnectionString;
        service = Process.Start(start) ?? throw new InvalidOperationException("Service process did not start.");
        service.OutputDataReceived += (_, e) => Capture(e.Data);
        service.ErrorDataReceived += (_, e) => Capture(e.Data);
        service.BeginOutputReadLine();
        service.BeginErrorReadLine();
        Http = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}"), Timeout = TimeSpan.FromSeconds(40) };
        await UntilAsync(async () =>
        {
            if (service.HasExited)
                throw new InvalidOperationException($"Service exited {service.ExitCode}: {string.Join('\n', output)}");
            try { return (await Http.GetAsync("/health/ready")).IsSuccessStatusCode; }
            catch (HttpRequestException) { return false; }
        }, "Service did not become ready: " + string.Join('\n', output));
    }

    public static void ValidateBackendArtifact(string artifact, string configuration)
    {
        foreach (var required in new[] { artifact, Path.ChangeExtension(artifact, ".deps.json"),
                     Path.ChangeExtension(artifact, ".runtimeconfig.json") })
            if (!File.Exists(required))
                throw new InvalidOperationException(
                    $"Missing HumanAuthority {configuration} backend artifact: {Path.GetFullPath(required)}. " +
                    $"Build HumanAuthority.IntegrationTests.csproj --configuration {configuration} before using --no-build; no configuration fallback is allowed.");
    }

    private void Capture(string? line)
    {
        if (line is null) return;
        output.Enqueue(line);
        while (output.Count > 200) output.TryDequeue(out _);
    }

    public async Task StopAsync()
    {
        Http?.Dispose();
        if (service is null) return;
        if (!service.HasExited)
        {
            service.Kill(entireProcessTree: true);
            await service.WaitForExitAsync();
        }
        service.Dispose();
        service = null;
    }

    public async Task DisposeAsync()
    {
        await StopAsync();
        if (databaseLease is not null) await databaseLease.DisposeAsync();
    }

    public async Task<NpgsqlConnection> OpenAsync()
    {
        var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync();
        return connection;
    }

    public async Task<object?> SqlAsync(string sql, params (string Name, object Value)[] parameters)
    {
        await using var connection = await OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        foreach (var (name, value) in parameters) command.Parameters.AddWithValue(name, value);
        return await command.ExecuteScalarAsync();
    }

    public async Task<ApiResponse> SendAsync(HttpMethod method, string path, Actor? actor = null,
        object? body = null, string? key = null, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(method, "/v1/authority" + path);
        if (actor is not null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", actor.Credential);
        if (key is not null) request.Headers.Add("Idempotency-Key", key);
        if (body is not null) request.Content = JsonContent.Create(body);
        using var response = await Http.SendAsync(request, cancellationToken);
        var text = await response.Content.ReadAsStringAsync(cancellationToken);
        using var json = JsonDocument.Parse(text);
        return new ApiResponse((int)response.StatusCode, json.RootElement.Clone());
    }

    public Task<ApiResponse> GetAsync(string path, Actor? actor = null) => SendAsync(HttpMethod.Get, path, actor);
    public Task<ApiResponse> PostAsync(string path, Actor actor, object body, string? key = null,
        CancellationToken cancellationToken = default) =>
        SendAsync(HttpMethod.Post, path, actor, body, key, cancellationToken);

    public async Task WaitForBlockedAsync(int blockerPid, int minimum = 1)
    {
        await UntilAsync(async () =>
        {
            var count = await SqlAsync("""
                SELECT count(*) FROM pg_stat_activity
                WHERE application_name=@app AND @pid=ANY(pg_blocking_pids(pid))
                """, ("app", ServiceApplication), ("pid", blockerPid));
            return (long)count! >= minimum;
        }, "Expected service requests were not observed waiting on the independent PostgreSQL lock.");
    }

    public static async Task UntilAsync(Func<Task<bool>> predicate, string failure, TimeSpan? timeout = null)
    {
        var deadline = Stopwatch.StartNew();
        while (deadline.Elapsed < (timeout ?? TimeSpan.FromSeconds(25)))
        {
            if (await predicate()) return;
            await Task.Delay(20);
        }
        throw new TimeoutException(failure);
    }

    private static string FindRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null)
        {
            if (File.Exists(Path.Combine(directory.FullName, "backend/HumanAuthority/HumanAuthority.csproj")))
                return directory.FullName;
            directory = directory.Parent;
        }
        throw new DirectoryNotFoundException("Cannot locate the HumanAuthority service project.");
    }
}
