using AcingIU.Identity.Api.Models;
using Npgsql;

namespace AcingIU.Identity.Api.Data;

public interface IUserRepository
{
    Task<UserRecord?> FindByEmailAsync(string email, CancellationToken ct = default);
    Task<UserRecord?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<UserRecord> CreateAsync(string email, string passwordHash, CancellationToken ct = default);
    Task InsertRefreshTokenAsync(Guid userId, string tokenHash, Guid familyId, DateTimeOffset expiresAt, string? userAgent, string? ip, CancellationToken ct = default);
    Task<(Guid UserId, Guid FamilyId, bool Revoked)?> FindRefreshTokenAsync(string tokenHash, CancellationToken ct = default);
    Task RevokeRefreshFamilyAsync(Guid familyId, CancellationToken ct = default);
    Task RevokeRefreshTokenAsync(string tokenHash, long? replacedBy, CancellationToken ct = default);
    Task SetMfaSecretAsync(Guid userId, string secretBase32, CancellationToken ct = default);
    Task EnableMfaAsync(Guid userId, CancellationToken ct = default);
    Task<string?> GetMfaSecretAsync(Guid userId, CancellationToken ct = default);
    Task WriteAuditAsync(string eventType, string severity, string actor, string? resource, object? payload, string? traceId, CancellationToken ct = default);
}

public sealed class UserRepository : IUserRepository
{
    private readonly IDbConnectionFactory _db;

    public UserRepository(IDbConnectionFactory db) => _db = db;

    public async Task<UserRecord?> FindByEmailAsync(string email, CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            """
            SELECT u.id, u.email, u.password_hash, u.mfa_enabled, u.is_active, u.created_at,
                   COALESCE(array_agg(r.assigned_role::text) FILTER (WHERE r.assigned_role IS NOT NULL), '{}') AS roles
            FROM users u
            LEFT JOIN user_roles_mapping r ON r.user_id = u.id
            WHERE lower(u.email) = lower(@email)
            GROUP BY u.id
            """, conn);
        cmd.Parameters.AddWithValue("email", email);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) return null;
        return MapUser(reader);
    }

    public async Task<UserRecord?> FindByIdAsync(Guid id, CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            """
            SELECT u.id, u.email, u.password_hash, u.mfa_enabled, u.is_active, u.created_at,
                   COALESCE(array_agg(r.assigned_role::text) FILTER (WHERE r.assigned_role IS NOT NULL), '{}') AS roles
            FROM users u
            LEFT JOIN user_roles_mapping r ON r.user_id = u.id
            WHERE u.id = @id
            GROUP BY u.id
            """, conn);
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) return null;
        return MapUser(reader);
    }

    public async Task<UserRecord> CreateAsync(string email, string passwordHash, CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var tx = await conn.BeginTransactionAsync(ct);

        Guid userId;
        DateTimeOffset createdAt;

        await using (var cmd = new NpgsqlCommand(
            """
            INSERT INTO users (email, password_hash)
            VALUES (@email, @hash)
            RETURNING id, created_at
            """, conn, tx))
        {
            cmd.Parameters.AddWithValue("email", email.Trim().ToLowerInvariant());
            cmd.Parameters.AddWithValue("hash", passwordHash);
            await using var reader = await cmd.ExecuteReaderAsync(ct);
            await reader.ReadAsync(ct);
            userId = reader.GetGuid(0);
            createdAt = reader.GetFieldValue<DateTimeOffset>(1);
        }

        await using (var roleCmd = new NpgsqlCommand(
            """
            INSERT INTO user_roles_mapping (user_id, assigned_role)
            VALUES (@id, 'User')
            """, conn, tx))
        {
            roleCmd.Parameters.AddWithValue("id", userId);
            await roleCmd.ExecuteNonQueryAsync(ct);
        }

        await tx.CommitAsync(ct);

        return new UserRecord
        {
            Id = userId,
            Email = email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash,
            MfaEnabled = false,
            IsActive = true,
            CreatedAt = createdAt,
            Roles = new List<string> { "User" }
        };
    }

    public async Task InsertRefreshTokenAsync(Guid userId, string tokenHash, Guid familyId, DateTimeOffset expiresAt, string? userAgent, string? ip, CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            """
            INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at, user_agent, ip_address)
            VALUES (@userId, @hash, @family, @exp, @ua, @ip::inet)
            """, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("hash", tokenHash);
        cmd.Parameters.AddWithValue("family", familyId);
        cmd.Parameters.AddWithValue("exp", expiresAt);
        cmd.Parameters.AddWithValue("ua", (object?)userAgent ?? DBNull.Value);
        cmd.Parameters.AddWithValue("ip", (object?)ip ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task<(Guid UserId, Guid FamilyId, bool Revoked)?> FindRefreshTokenAsync(string tokenHash, CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            """
            SELECT user_id, family_id, (revoked_at IS NOT NULL OR expires_at < now()) AS is_dead
            FROM refresh_tokens
            WHERE token_hash = @hash
            """, conn);
        cmd.Parameters.AddWithValue("hash", tokenHash);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) return null;
        return (reader.GetGuid(0), reader.GetGuid(1), reader.GetBoolean(2));
    }

    public async Task RevokeRefreshFamilyAsync(Guid familyId, CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            """
            UPDATE refresh_tokens
            SET revoked_at = now()
            WHERE family_id = @family AND revoked_at IS NULL
            """, conn);
        cmd.Parameters.AddWithValue("family", familyId);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task RevokeRefreshTokenAsync(string tokenHash, long? replacedBy, CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            """
            UPDATE refresh_tokens
            SET revoked_at = now(), replaced_by = @replaced
            WHERE token_hash = @hash AND revoked_at IS NULL
            """, conn);
        cmd.Parameters.AddWithValue("hash", tokenHash);
        cmd.Parameters.AddWithValue("replaced", (object?)replacedBy ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task SetMfaSecretAsync(Guid userId, string secretBase32, CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            """
            UPDATE users
            SET mfa_secret_base32 = @secret, mfa_enabled = FALSE, updated_at = now()
            WHERE id = @id
            """, conn);
        cmd.Parameters.AddWithValue("id", userId);
        cmd.Parameters.AddWithValue("secret", secretBase32);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task EnableMfaAsync(Guid userId, CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            """
            UPDATE users
            SET mfa_enabled = TRUE, updated_at = now()
            WHERE id = @id AND mfa_secret_base32 IS NOT NULL
            """, conn);
        cmd.Parameters.AddWithValue("id", userId);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task<string?> GetMfaSecretAsync(Guid userId, CancellationToken ct = default)
    {
        await using var conn = await _db.CreateOpenConnectionAsync(ct);
        await using var cmd = new NpgsqlCommand(
            "SELECT mfa_secret_base32 FROM users WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", userId);
        var result = await cmd.ExecuteScalarAsync(ct);
        return result is string s ? s : null;
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

    private static UserRecord MapUser(NpgsqlDataReader reader)
    {
        var roles = reader.IsDBNull(6)
            ? new List<string>()
            : ((string[])reader.GetValue(6)).ToList();

        return new UserRecord
        {
            Id = reader.GetGuid(0),
            Email = reader.GetString(1),
            PasswordHash = reader.GetString(2),
            MfaEnabled = reader.GetBoolean(3),
            IsActive = reader.GetBoolean(4),
            CreatedAt = reader.GetFieldValue<DateTimeOffset>(5),
            Roles = roles
        };
    }
}
