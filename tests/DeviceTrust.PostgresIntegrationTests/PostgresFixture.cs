using AcingIU.DeviceTrust.Api.Data;
using Npgsql;
using Xunit;

namespace AcingIU.DeviceTrust.PostgresIntegrationTests;

public sealed class PostgresFixture : IAsyncLifetime
{
    private static readonly SemaphoreSlim BootstrapLock = new(1, 1);
    private static bool _bootstrapped;
    private readonly string _connectionString;

    public PostgresFixture()
    {
        var configuredConnectionString = Environment.GetEnvironmentVariable("DEVICE_TRUST_TEST_CONNECTION_STRING")
            ?? throw new InvalidOperationException("Set DEVICE_TRUST_TEST_CONNECTION_STRING to an isolated test database.");
        var builder = new NpgsqlConnectionStringBuilder(configuredConnectionString);
        if (string.IsNullOrWhiteSpace(builder.Password))
            builder.Password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD")
                ?? throw new InvalidOperationException("Set POSTGRES_PASSWORD for the isolated integration database.");
        _connectionString = builder.ConnectionString;

        var database = new NpgsqlConnectionStringBuilder(_connectionString).Database;
        if (string.IsNullOrWhiteSpace(database) || !database.Contains("test", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("DeviceTrust integration tests require a database name containing 'test'.");
    }

    public async Task InitializeAsync()
    {
        await BootstrapLock.WaitAsync();
        try
        {
            if (_bootstrapped)
                return;

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            var migrationDirectory = FindRepositoryRoot();
            foreach (var file in Directory.GetFiles(Path.Combine(migrationDirectory, "infrastructure", "postgres", "init"), "*.sql").Order())
            {
                await using var command = new NpgsqlCommand(await File.ReadAllTextAsync(file), connection);
                await command.ExecuteNonQueryAsync();
            }
            _bootstrapped = true;
        }
        finally
        {
            BootstrapLock.Release();
        }
    }

    public Task DisposeAsync() => Task.CompletedTask;

    public string ConnectionString => _connectionString;

    public NpgsqlConnection CreateConnection() => new(_connectionString);

    public async Task SeedUserAsync(Guid id)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO users (id, email, password_hash)
            VALUES (@id, @email, 'integration-test')
            ON CONFLICT (id) DO NOTHING
            """, connection);
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("email", $"devicetrust-{id:N}@example.invalid");
        await command.ExecuteNonQueryAsync();
    }

    public async Task<Guid> SeedDeviceAsync(string hwId, Guid? ownerId)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO registered_devices (hw_identifier, soc_model, trust_score, owner_user_id)
            VALUES (@hw, 'test-soc', 90, @owner)
            RETURNING id
            """, connection);
        command.Parameters.AddWithValue("hw", hwId);
        command.Parameters.AddWithValue("owner", (object?)ownerId ?? DBNull.Value);
        return (Guid)(await command.ExecuteScalarAsync())!;
    }

    public async Task DeleteUserAsync(Guid id)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand("DELETE FROM users WHERE id = @id", connection);
        command.Parameters.AddWithValue("id", id);
        await command.ExecuteNonQueryAsync();
    }

    public async Task CleanupAsync(Guid actorId, params string[] hwIds)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            """
            DELETE FROM registered_devices WHERE hw_identifier = ANY(@hwIds)
            """, connection);
        command.Parameters.AddWithValue("hwIds", hwIds);
        await command.ExecuteNonQueryAsync();
        await using var auditCommand = new NpgsqlCommand(
            "DELETE FROM security_audit_logs WHERE actor = @actor", connection);
        auditCommand.Parameters.AddWithValue("actor", actorId.ToString("D"));
        await auditCommand.ExecuteNonQueryAsync();
        await DeleteUserAsync(id: actorId);
    }

    public async Task<int> ReadTrustScoreAsync(string hwId)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            "SELECT trust_score FROM registered_devices WHERE hw_identifier = @hw", connection);
        command.Parameters.AddWithValue("hw", hwId);
        return (int)(await command.ExecuteScalarAsync())!;
    }

    public async Task CreateAuditFailureTriggerAsync(string functionName, string triggerName, Guid actorId)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            $"""
            CREATE FUNCTION "{functionName}"() RETURNS trigger AS $$
            BEGIN
                IF NEW.event_type = 'trust.telemetry.submit' AND NEW.actor = '{actorId:D}' THEN
                    RAISE EXCEPTION 'forced audit failure for integration test';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            CREATE TRIGGER "{triggerName}" BEFORE INSERT ON security_audit_logs
            FOR EACH ROW EXECUTE FUNCTION "{functionName}"();
            """, connection);
        await command.ExecuteNonQueryAsync();
    }

    public async Task DropAuditFailureTriggerAsync(string functionName, string triggerName)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            $"""
            DROP TRIGGER IF EXISTS "{triggerName}" ON security_audit_logs;
            DROP FUNCTION IF EXISTS "{functionName}"();
            """, connection);
        await command.ExecuteNonQueryAsync();
    }

    private static string FindRepositoryRoot()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            if (Directory.Exists(Path.Combine(current.FullName, "infrastructure", "postgres", "init")))
                return current.FullName;
            current = current.Parent;
        }
        throw new InvalidOperationException("Could not locate repository root for PostgreSQL migrations.");
    }
}

internal sealed class TestDbConnectionFactory(string connectionString) : IDbConnectionFactory
{
    public async Task<NpgsqlConnection> CreateOpenConnectionAsync(CancellationToken ct = default)
    {
        var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(ct);
        return connection;
    }
}
