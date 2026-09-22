using AcingIU.DeviceTrust.Api.Data;
using AcingIU.DeviceTrust.Api.Models;
using Npgsql;
using NpgsqlTypes;
using Xunit;

namespace AcingIU.DeviceTrust.PostgresIntegrationTests;

public sealed class TelemetryOwnershipPostgresIntegrationTests : IClassFixture<PostgresFixture>
{
    private const int Threshold = 80;
    private readonly PostgresFixture _pg;

    public TelemetryOwnershipPostgresIntegrationTests(PostgresFixture pg) => _pg = pg;

    [Fact]
    public async Task ScenarioA_OwnerAndCrossOwnerConcurrent_OnlyOwnerMutatesAndAudits()
    {
        var hw = UniqueHw("owned-race");
        var ownerA = Guid.NewGuid();
        var ownerB = Guid.NewGuid();
        var ownerTrace = $"trace-owner-{Guid.NewGuid():N}";
        var otherTrace = $"trace-other-{Guid.NewGuid():N}";

        await _pg.SeedUserAsync(ownerA);
        await _pg.SeedUserAsync(ownerB);
        await _pg.SeedRegisteredDeviceAsync(hw, ownerA, "BASELINE-SOC", 17);

        await using var lockConn = await _pg.OpenAdminConnectionAsync();
        await using var lockTx = await lockConn.BeginTransactionAsync();
        await using (var lockCmd = new NpgsqlCommand("LOCK TABLE registered_devices IN ACCESS EXCLUSIVE MODE", lockConn, lockTx))
        {
            await lockCmd.ExecuteNonQueryAsync();
        }

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
        var ownerApp = $"authz04-owner-{Guid.NewGuid():N}";
        var otherApp = $"authz04-other-{Guid.NewGuid():N}";

        var ownerTask = RunTelemetryAsync(ownerApp, BuildReq(hw, "OWNER-SOC"), 91, ownerA, false, ownerTrace, cts.Token);
        var otherTask = RunTelemetryAsync(otherApp, BuildReq(hw, "OTHER-SOC"), 12, ownerB, false, otherTrace, cts.Token);

        var overlap = await _pg.WaitForBlockedUpdatesAsync(new[] { ownerApp, otherApp }, TimeSpan.FromSeconds(10), cts.Token);
        Assert.Equal(2, overlap.Pids.Count);
        Assert.NotEqual(overlap.Pids[ownerApp], overlap.Pids[otherApp]);

        await lockTx.CommitAsync(cts.Token);

        var ownerResult = await ownerTask;
        var otherResult = await otherTask;

        Assert.Equal(TelemetryMutationOutcome.Updated, ownerResult.Outcome);
        Assert.Equal(TelemetryMutationOutcome.Rejected, otherResult.Outcome);
        Assert.Null(otherResult.Device);

        await using var verifyConn = await _pg.OpenAdminConnectionAsync();
        await using var stateCmd = new NpgsqlCommand(
            "SELECT owner_user_id, soc_model, trust_score FROM registered_devices WHERE hw_identifier = @hw", verifyConn);
        stateCmd.Parameters.AddWithValue("hw", hw);
        await using var reader = await stateCmd.ExecuteReaderAsync(cts.Token);
        Assert.True(await reader.ReadAsync(cts.Token));
        Assert.Equal(ownerA, reader.GetGuid(0));
        Assert.Equal("OWNER-SOC", reader.GetString(1));
        Assert.Equal(91, reader.GetInt32(2));
        await reader.DisposeAsync();

        var ownerAudit = await CountAuditAsync(verifyConn, ownerA, ownerTrace, cts.Token);
        var otherAudit = await CountAuditAsync(verifyConn, ownerB, otherTrace, cts.Token);
        Assert.Equal(1, ownerAudit);
        Assert.Equal(0, otherAudit);
    }

    [Fact]
    public async Task ScenarioB_UnknownHardwareConcurrent_BothRejected_NoRowsOrAudit()
    {
        var hw = UniqueHw("unknown-race");
        var callerA = Guid.NewGuid();
        var callerB = Guid.NewGuid();
        var traceA = $"trace-unknown-a-{Guid.NewGuid():N}";
        var traceB = $"trace-unknown-b-{Guid.NewGuid():N}";

        await _pg.SeedUserAsync(callerA);
        await _pg.SeedUserAsync(callerB);

        await using var lockConn = await _pg.OpenAdminConnectionAsync();
        await using var lockTx = await lockConn.BeginTransactionAsync();
        await using (var lockCmd = new NpgsqlCommand("LOCK TABLE registered_devices IN ACCESS EXCLUSIVE MODE", lockConn, lockTx))
        {
            await lockCmd.ExecuteNonQueryAsync();
        }

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
        var appA = $"authz04-unknown-a-{Guid.NewGuid():N}";
        var appB = $"authz04-unknown-b-{Guid.NewGuid():N}";

        var tA = RunTelemetryAsync(appA, BuildReq(hw, "UNKNOWN-A"), 88, callerA, false, traceA, cts.Token);
        var tB = RunTelemetryAsync(appB, BuildReq(hw, "UNKNOWN-B"), 77, callerB, false, traceB, cts.Token);

        var overlap = await _pg.WaitForBlockedUpdatesAsync(new[] { appA, appB }, TimeSpan.FromSeconds(10), cts.Token);
        Assert.Equal(2, overlap.Pids.Count);

        await lockTx.CommitAsync(cts.Token);

        var rA = await tA;
        var rB = await tB;
        Assert.Equal(TelemetryMutationOutcome.Rejected, rA.Outcome);
        Assert.Equal(TelemetryMutationOutcome.Rejected, rB.Outcome);
        Assert.Null(rA.Device);
        Assert.Null(rB.Device);

        await using var verifyConn = await _pg.OpenAdminConnectionAsync();
        await using var rowCmd = new NpgsqlCommand("SELECT count(*) FROM registered_devices WHERE hw_identifier = @hw", verifyConn);
        rowCmd.Parameters.AddWithValue("hw", hw);
        var rowCount = (long)(await rowCmd.ExecuteScalarAsync(cts.Token) ?? 0L);
        Assert.Equal(0L, rowCount);

        var auditA = await CountAuditAsync(verifyConn, callerA, traceA, cts.Token);
        var auditB = await CountAuditAsync(verifyConn, callerB, traceB, cts.Token);
        Assert.Equal(0, auditA);
        Assert.Equal(0, auditB);
    }

    [Fact]
    public async Task ScenarioC_PrivilegedUpdate_SucceedsWithoutOwnershipReassignment()
    {
        var hw = UniqueHw("privileged");
        var ownerA = Guid.NewGuid();
        var adminCaller = Guid.NewGuid();
        var trace = $"trace-admin-{Guid.NewGuid():N}";

        await _pg.SeedUserAsync(ownerA);
        await _pg.SeedRegisteredDeviceAsync(hw, ownerA, "BASELINE-SOC", 44);

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(20));
        var result = await RunTelemetryAsync(
            applicationName: $"authz04-admin-{Guid.NewGuid():N}",
            request: BuildReq(hw, "ADMIN-SOC"),
            score: 95,
            callerUserId: adminCaller,
            isPrivileged: true,
            traceId: trace,
            ct: cts.Token);

        Assert.Equal(TelemetryMutationOutcome.Updated, result.Outcome);

        await using var verifyConn = await _pg.OpenAdminConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT owner_user_id, soc_model, trust_score FROM registered_devices WHERE hw_identifier = @hw", verifyConn);
        cmd.Parameters.AddWithValue("hw", hw);
        await using var reader = await cmd.ExecuteReaderAsync(cts.Token);
        Assert.True(await reader.ReadAsync(cts.Token));
        Assert.Equal(ownerA, reader.GetGuid(0));
        Assert.Equal("ADMIN-SOC", reader.GetString(1));
        Assert.Equal(95, reader.GetInt32(2));
        await reader.DisposeAsync();

        var adminAudit = await CountAuditAsync(verifyConn, adminCaller, trace, cts.Token);
        Assert.Equal(1, adminAudit);
    }

    [Fact]
    public async Task ScenarioD_AuditFailure_RollsBackTelemetryMutation()
    {
        var hw = UniqueHw("rollback");
        var ownerA = Guid.NewGuid();
        var trace = $"trace-rollback-{Guid.NewGuid():N}";
        var triggerSuffix = Guid.NewGuid().ToString("N");
        var triggerName = $"authz04_fail_audit_trg_{triggerSuffix}";
        var functionName = $"authz04_fail_audit_fn_{triggerSuffix}";

        await _pg.SeedUserAsync(ownerA);
        await _pg.SeedRegisteredDeviceAsync(hw, ownerA, "BASELINE-SOC", 21);

        await _pg.CreateAuditFailureTriggerAsync(functionName, triggerName, ownerA);

        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(20));
            await Assert.ThrowsAsync<PostgresException>(async () =>
            {
                await RunTelemetryAsync(
                    applicationName: $"authz04-rollback-{Guid.NewGuid():N}",
                    request: BuildReq(hw, "SHOULD-ROLLBACK"),
                    score: 99,
                    callerUserId: ownerA,
                    isPrivileged: false,
                    traceId: trace,
                    ct: cts.Token);
            });
        }
        finally
        {
            await _pg.DropAuditFailureTriggerAsync(functionName, triggerName);
        }

        await using var verifyConn = await _pg.OpenAdminConnectionAsync();
        await using var stateCmd = new NpgsqlCommand(
            "SELECT owner_user_id, soc_model, trust_score FROM registered_devices WHERE hw_identifier = @hw", verifyConn);
        stateCmd.Parameters.AddWithValue("hw", hw);
        await using var reader = await stateCmd.ExecuteReaderAsync();
        Assert.True(await reader.ReadAsync());
        Assert.Equal(ownerA, reader.GetGuid(0));
        Assert.Equal("BASELINE-SOC", reader.GetString(1));
        Assert.Equal(21, reader.GetInt32(2));
        await reader.DisposeAsync();

        var successAudit = await CountAuditAsync(verifyConn, ownerA, trace, CancellationToken.None);
        Assert.Equal(0, successAudit);
    }

    private async Task<TelemetryMutationResult> RunTelemetryAsync(
        string applicationName,
        TelemetrySubmitRequest request,
        int score,
        Guid callerUserId,
        bool isPrivileged,
        string traceId,
        CancellationToken ct)
    {
        var repo = new DeviceRepository(new StaticConnectionFactory(_pg.BuildDeviceTrustConnectionString(applicationName)));
        return await repo.TryAuthorizedTelemetryUpdateWithAuditAsync(
            request,
            score,
            callerUserId,
            isPrivileged,
            Threshold,
            scoreAllowed: score >= Threshold,
            traceId,
            ct);
    }

    private static TelemetrySubmitRequest BuildReq(string hw, string socModel) => new()
    {
        HwIdentifier = hw,
        SocModel = socModel,
        SelinuxStatus = "Enforcing",
        BootloaderLocked = true,
        PartitionsUnmodified = true,
        KnoxWarrantyFuseIntact = true,
        IsRooted = false
    };

    private static string UniqueHw(string prefix) => $"HW-{prefix}-{Guid.NewGuid():N}";

    private static async Task<int> CountAuditAsync(NpgsqlConnection conn, Guid actor, string traceId, CancellationToken ct)
    {
        await using var cmd = new NpgsqlCommand(
            "SELECT count(*) FROM security_audit_logs WHERE event_type = 'trust.telemetry.submit' AND actor = @actor AND trace_id = @trace", conn);
        cmd.Parameters.AddWithValue("actor", actor.ToString("D"));
        cmd.Parameters.AddWithValue("trace", traceId);
        var value = await cmd.ExecuteScalarAsync(ct);
        return Convert.ToInt32(value);
    }

    private sealed class StaticConnectionFactory : IDbConnectionFactory
    {
        private readonly string _connectionString;
        public StaticConnectionFactory(string connectionString) => _connectionString = connectionString;

        public async Task<NpgsqlConnection> CreateOpenConnectionAsync(CancellationToken ct = default)
        {
            var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync(ct);
            return conn;
        }
    }
}

public sealed class PostgresFixture : IAsyncLifetime
{
    private static readonly SemaphoreSlim BootstrapLock = new(1, 1);
    private static bool _bootstrapped;

    private readonly string _adminConnectionString;
    private readonly string _deviceTrustPassword;

    public PostgresFixture()
    {
        var explicitAdminConnection = Environment.GetEnvironmentVariable("DEVICETRUST_PG_TEST_ADMIN_CONNECTION");
        if (!string.IsNullOrWhiteSpace(explicitAdminConnection))
        {
            _adminConnectionString = explicitAdminConnection;
        }
        else
        {
            var adminBuilder = new NpgsqlConnectionStringBuilder
            {
                Host = "127.0.0.1",
                Port = 5432,
                Database = "acing_iu",
                Username = "acing_admin",
                Password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "ci_admin_password_only",
                IncludeErrorDetail = true
            };
            _adminConnectionString = adminBuilder.ConnectionString;
        }
        _deviceTrustPassword = Environment.GetEnvironmentVariable("DEVICE_TRUST_DB_PASSWORD") ?? "ci_device_trust_password_only";
    }

    public async Task InitializeAsync()
    {
        await BootstrapLock.WaitAsync();
        try
        {
            if (_bootstrapped)
                return;

            var repoRoot = FindRepositoryRoot();
            var migrationsDir = Path.Combine(repoRoot, "infrastructure", "postgres", "init");
            var migrationFiles = Directory.GetFiles(migrationsDir, "*.sql", SearchOption.TopDirectoryOnly)
                .OrderBy(Path.GetFileName, StringComparer.Ordinal)
                .ToArray();

            if (migrationFiles.Length == 0)
                throw new InvalidOperationException($"No PostgreSQL migration files found in {migrationsDir}");

            await using var conn = await OpenAdminConnectionAsync();
            foreach (var migrationFile in migrationFiles)
            {
                var sql = await File.ReadAllTextAsync(migrationFile);
                await using var cmd = new NpgsqlCommand(sql, conn);
                await cmd.ExecuteNonQueryAsync();
            }

            var migratorPassword = Environment.GetEnvironmentVariable("MIGRATOR_DB_PASSWORD") ?? "ci_migrator_password_only";
            var identityPassword = Environment.GetEnvironmentVariable("IDENTITY_DB_PASSWORD") ?? "ci_identity_password_only";
            var dbName = new NpgsqlConnectionStringBuilder(_adminConnectionString).Database;
            var migratorPasswordSql = QuoteLiteral(migratorPassword);
            var identityPasswordSql = QuoteLiteral(identityPassword);
            var deviceTrustPasswordSql = QuoteLiteral(_deviceTrustPassword);

            await using (var roleCmd = new NpgsqlCommand(
                $"""
                ALTER ROLE acing_migrator WITH LOGIN PASSWORD {migratorPasswordSql};
                ALTER ROLE acing_identity WITH LOGIN PASSWORD {identityPasswordSql};
                ALTER ROLE acing_device_trust WITH LOGIN PASSWORD {deviceTrustPasswordSql};
                GRANT CONNECT ON DATABASE {QuoteIdent(dbName)} TO acing_migrator, acing_identity, acing_device_trust;
                """, conn))
            {
                await roleCmd.ExecuteNonQueryAsync();
            }

            _bootstrapped = true;
        }
        finally
        {
            BootstrapLock.Release();
        }
    }

    public Task DisposeAsync() => Task.CompletedTask;

    public async Task<NpgsqlConnection> OpenAdminConnectionAsync(CancellationToken ct = default)
    {
        var conn = new NpgsqlConnection(_adminConnectionString);
        await conn.OpenAsync(ct);
        return conn;
    }

    public string BuildDeviceTrustConnectionString(string applicationName)
    {
        var builder = new NpgsqlConnectionStringBuilder(_adminConnectionString)
        {
            Username = "acing_device_trust",
            Password = _deviceTrustPassword,
            ApplicationName = applicationName,
            Pooling = false,
            IncludeErrorDetail = true
        };
        return builder.ConnectionString;
    }

    public async Task SeedUserAsync(Guid userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAdminConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            """
            INSERT INTO users (id, email, password_hash, is_active)
            VALUES (@id, @email, @hash, true)
            ON CONFLICT (id) DO NOTHING
            """, conn);
        cmd.Parameters.AddWithValue("id", userId);
        cmd.Parameters.AddWithValue("email", $"authz04-{userId:N}@example.invalid");
        cmd.Parameters.AddWithValue("hash", "integration-test-hash");
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task SeedRegisteredDeviceAsync(
        string hwIdentifier,
        Guid ownerUserId,
        string socModel,
        int trustScore,
        CancellationToken ct = default)
    {
        await using var conn = await OpenAdminConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            """
            INSERT INTO registered_devices
                (hw_identifier, soc_model, trust_score, selinux_status, knox_warranty_fuse_blown, owner_user_id, last_seen_at)
            VALUES
                (@hw, @soc, @score, 'Enforcing', false, @owner, now())
            ON CONFLICT (hw_identifier) DO UPDATE SET
                soc_model = EXCLUDED.soc_model,
                trust_score = EXCLUDED.trust_score,
                owner_user_id = EXCLUDED.owner_user_id,
                last_seen_at = now(),
                updated_at = now()
            """, conn);
        cmd.Parameters.AddWithValue("hw", hwIdentifier);
        cmd.Parameters.AddWithValue("soc", socModel);
        cmd.Parameters.AddWithValue("score", trustScore);
        cmd.Parameters.AddWithValue("owner", ownerUserId);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task<LockOverlapEvidence> WaitForBlockedUpdatesAsync(
        IReadOnlyCollection<string> applicationNames,
        TimeSpan timeout,
        CancellationToken ct)
    {
        var deadline = DateTimeOffset.UtcNow + timeout;

        while (DateTimeOffset.UtcNow < deadline)
        {
            ct.ThrowIfCancellationRequested();
            await using var conn = await OpenAdminConnectionAsync(ct);
            await using var cmd = new NpgsqlCommand(
                """
                SELECT application_name, pid, COALESCE(wait_event_type, ''), COALESCE(wait_event, ''), state
                FROM pg_stat_activity
                WHERE application_name = ANY(@apps)
                  AND position('UPDATE registered_devices' in query) > 0
                """, conn);
            cmd.Parameters.AddWithValue("apps", NpgsqlDbType.Array | NpgsqlDbType.Text, applicationNames.ToArray());

            var pids = new Dictionary<string, int>(StringComparer.Ordinal);
            var waits = new List<string>();
            await using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                var app = reader.GetString(0);
                var pid = reader.GetInt32(1);
                var waitType = reader.GetString(2);
                var waitEvent = reader.GetString(3);
                var state = reader.GetString(4);
                pids[app] = pid;
                waits.Add($"{app}:pid={pid}:state={state}:wait={waitType}/{waitEvent}");
            }

            var lockWaits = waits.Count(w => w.Contains("wait=Lock/", StringComparison.Ordinal));
            if (pids.Count == applicationNames.Count && lockWaits >= 2)
                return new LockOverlapEvidence(pids, waits);

            await Task.Delay(100, ct);
        }

        throw new TimeoutException($"Timed out waiting for blocked UPDATE overlap for [{string.Join(",", applicationNames)}].");
    }

    public async Task CreateAuditFailureTriggerAsync(string functionName, string triggerName, Guid actorId, CancellationToken ct = default)
    {
        await using var conn = await OpenAdminConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            $"""
            CREATE OR REPLACE FUNCTION {QuoteIdent(functionName)}()
            RETURNS trigger AS $$
            BEGIN
                IF NEW.event_type = 'trust.telemetry.submit' AND NEW.actor = {QuoteLiteral(actorId.ToString("D"))} THEN
                    RAISE EXCEPTION 'forced audit failure for authz04 integration test';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER {QuoteIdent(triggerName)}
            BEFORE INSERT ON security_audit_logs
            FOR EACH ROW EXECUTE FUNCTION {QuoteIdent(functionName)}();
            """, conn);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task DropAuditFailureTriggerAsync(string functionName, string triggerName, CancellationToken ct = default)
    {
        await using var conn = await OpenAdminConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            $"""
            DROP TRIGGER IF EXISTS {QuoteIdent(triggerName)} ON security_audit_logs;
            DROP FUNCTION IF EXISTS {QuoteIdent(functionName)}();
            """, conn);
        await cmd.ExecuteNonQueryAsync(ct);
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

        throw new InvalidOperationException("Could not locate repository root from test execution directory.");
    }

    private static string QuoteIdent(string value) => $"\"{value.Replace("\"", "\"\"")}";
    private static string QuoteLiteral(string value) => $"'{value.Replace("'", "''")}'";
}

public sealed record LockOverlapEvidence(
    IReadOnlyDictionary<string, int> Pids,
    IReadOnlyList<string> WaitDiagnostics);
