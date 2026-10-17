using System.Security.Cryptography;
using System.Text;
using Npgsql;

namespace HumanAuthority;

public sealed record AuthorityActor(Guid Id, string Kind, string DisplayName)
{
    public static AuthorityActor From(HttpContext context) =>
        (AuthorityActor)context.Items[typeof(AuthorityActor)]!;
}

public sealed class AuthorityUnavailableException : Exception;

public static class AuthorityErrors
{
    public static Task Write(HttpContext context, int status, string error)
    {
        context.Response.StatusCode = status;
        return context.Response.WriteAsJsonAsync(new { error }, CancellationToken.None);
    }
}

public sealed class AuthorityDatabase(NpgsqlDataSource source)
{
    public async Task<NpgsqlConnection> Open() =>
        await source.OpenConnectionAsync(CancellationToken.None);

    public async Task<AuthorityActor?> Authenticate(Microsoft.Extensions.Primitives.StringValues authorization)
    {
        if (authorization.Count != 1)
            return null;
        var header = authorization[0];
        if (header is null || !header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return null;
        var token = header[7..];
        if (token.Length is 0 or > 4096 || token.Any(char.IsWhiteSpace) || token.Contains('\0'))
            return null;
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        await using var connection = await Open();
        await using var command = new NpgsqlCommand("""
            SELECT id, kind, display_name FROM genesis_authority.principals
            WHERE credential_hash = $1 AND enabled
            """, connection);
        command.Parameters.AddWithValue(hash);
        await using var reader = await command.ExecuteReaderAsync(CancellationToken.None);
        return await reader.ReadAsync(CancellationToken.None)
            ? new AuthorityActor(reader.GetGuid(0), reader.GetString(1), reader.GetString(2))
            : null;
    }

    public async Task<bool> IsReady()
    {
        try
        {
            await using var connection = await Open();
            await using var command = new NpgsqlCommand(
                "SELECT EXISTS (SELECT 1 FROM genesis_authority.schema_versions WHERE version = 1)", connection);
            return (bool)(await command.ExecuteScalarAsync(CancellationToken.None))!;
        }
        catch
        {
            return false;
        }
    }
}
