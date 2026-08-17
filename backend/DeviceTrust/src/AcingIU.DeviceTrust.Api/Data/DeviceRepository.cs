using AcingIU.DeviceTrust.Api.Models;
using Npgsql;

namespace AcingIU.DeviceTrust.Api.Data;

public interface IDbConnectionFactory
{
    Task<NpgsqlConnection> CreateOpenConnectionAsync(CancellationToken ct = default);
}

public sealed class DbConnectionFactory : IDbConnectionFactory
{
    private readonly string _cs;
    public DbConnectionFactory(IConfiguration config)
    {
        _cs = config.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default is required.");
    }

    public async Task<NpgsqlConnection> CreateOpenConnectionAsync(CancellationToken ct = default)
    {
        var conn = new NpgsqlConnection(_cs);
        await conn.OpenAsync(ct);
        return conn;
    }
}

public interface IDeviceRepository
{
    Task<TrustScoreResponse> UpsertTelemetryAsync(TelemetrySubmitRequest req, int score, Guid? ownerUserId, CancellationToken ct = default);
    Task<TrustScoreResponse?> GetByHwIdAsync(string hwId, CancellationToken ct = default);
    Task<Guid?> GetOwnerUserIdAsync(string hwId, CancellationToken ct = default);
    Task<IReadOnlyList<DeviceListItem>> ListAsync(int limit = 50, CancellationToken ct = default);
    Task WriteAuditAsync(string eventType, string severity, string actor, string? resource, object? payload, string? traceId, CancellationToken ct = default);
    Task<int> GetTrustThresholdAsync(CancellationToken ct = default);
}

public sealed class DeviceRepository : IDeviceRepository
{
    private readonly IDbConnectionFactory _db;
    public DeviceRepository(IDbConnectionFactory db) => _db = db;

    public async Task<TrustScoreResponse> UpsertTelemetryAsync(TelemetrySubmitRequest req, int score, Guid? ownerUserId, CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            """
            INSERT INTO registered_devices (hw_identifier, soc_model, trust_score, selinux_status, knox_warranty_fuse_blown, owner_user_id, last_seen_at, updated_at)
            VALUES (@hw, @soc, @score, @selinux, @knox_blown, @owner, now(), now())
            ON CONFLICT (hw_identifier) DO UPDATE SET
                soc_model = EXCLUDED.soc_model,
                trust_score = EXCLUDED.trust_score,
                selinux_status = EXCLUDED.selinux_status,
                knox_warranty_fuse_blown = EXCLUDED.knox_warranty_fuse_blown,
                last_seen_at = now(),
                updated_at = now()
            RETURNING id, hw_identifier, soc_model, trust_score, updated_at
            """, conn);

        cmd.Parameters.AddWithValue("hw", req.HwIdentifier);
        cmd.Parameters.AddWithValue("soc", req.SocModel);
        cmd.Parameters.AddWithValue("score", score);
        cmd.Parameters.AddWithValue("selinux", req.SelinuxStatus);
        cmd.Parameters.AddWithValue("knox_blown", !req.KnoxWarrantyFuseIntact);
        cmd.Parameters.AddWithValue("owner", (object?)ownerUserId ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        await reader.ReadAsync(ct);

        return new TrustScoreResponse
        {
            DeviceId = reader.GetGuid(0),
            HwIdentifier = reader.GetString(1),
            SocModel = reader.GetString(2),
            TrustScore = reader.GetInt32(3),
            UpdatedAt = reader.GetFieldValue<DateTimeOffset>(4)
        };
    }

    public async Task<Guid?> GetOwnerUserIdAsync(string hwId, CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            "SELECT owner_user_id FROM registered_devices WHERE hw_identifier = @hw",
            conn);
        cmd.Parameters.AddWithValue("hw", hwId);
        var value = await cmd.ExecuteScalarAsync(ct);
        return value is Guid ownerUserId ? ownerUserId : null;
    }
    public async Task<TrustScoreResponse?> GetByHwIdAsync(string hwId, CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            """
            SELECT id, hw_identifier, soc_model, trust_score, updated_at
            FROM registered_devices WHERE hw_identifier = @hw
            """, conn);
        cmd.Parameters.AddWithValue("hw", hwId);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) return null;

        return new TrustScoreResponse
        {
            DeviceId = reader.GetGuid(0),
            HwIdentifier = reader.GetString(1),
            SocModel = reader.GetString(2),
            TrustScore = reader.GetInt32(3),
            UpdatedAt = reader.GetFieldValue<DateTimeOffset>(4)
        };
    }

    public async Task<IReadOnlyList<DeviceListItem>> ListAsync(int limit = 50, CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            """
            SELECT id, hw_identifier, soc_model, trust_score, selinux_status, knox_warranty_fuse_blown, last_seen_at
            FROM registered_devices
            ORDER BY last_seen_at DESC NULLS LAST
            LIMIT @limit
            """, conn);
        cmd.Parameters.AddWithValue("limit", limit);

        var list = new List<DeviceListItem>();
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            list.Add(new DeviceListItem
            {
                Id = reader.GetGuid(0),
                HwIdentifier = reader.GetString(1),
                SocModel = reader.GetString(2),
                TrustScore = reader.GetInt32(3),
                SelinuxStatus = reader.GetString(4),
                KnoxWarrantyFuseBlown = reader.GetBoolean(5),
                LastSeenAt = reader.IsDBNull(6) ? null : reader.GetFieldValue<DateTimeOffset>(6)
            });
        }
        return list;
    }

    public async Task WriteAuditAsync(string eventType, string severity, string actor, string? resource, object? payload, string? traceId, CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            """
            INSERT INTO security_audit_logs (event_type, severity, actor, resource_accessed, payload, trace_id)
            VALUES (@type, @sev, @actor, @resource, @payload::jsonb, @trace)
            """, conn);
        cmd.Parameters.AddWithValue("type", eventType);
        cmd.Parameters.AddWithValue("sev", severity);
        cmd.Parameters.AddWithValue("actor", actor);
        cmd.Parameters.AddWithValue("resource", (object?)resource ?? DBNull.Value);
        cmd.Parameters.AddWithValue("payload", payload is null ? DBNull.Value : System.Text.Json.JsonSerializer.Serialize(payload));
        cmd.Parameters.AddWithValue("trace", (object?)traceId ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task<int> GetTrustThresholdAsync(CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            """
            SELECT policy_value->>'minimum'
            FROM policy_configurations
            WHERE policy_key = 'trust.score.threshold'
            """, conn);
        var result = await cmd.ExecuteScalarAsync(ct);
        if (result is string s && int.TryParse(s, out var v)) return v;
        return Services.TrustScoreEngine.DefaultThreshold;
    }
}
