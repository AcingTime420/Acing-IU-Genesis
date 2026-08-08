using Npgsql;

namespace AcingIU.Identity.Api.Data;

public interface IDbConnectionFactory
{
    Task<NpgsqlConnection> CreateOpenConnectionAsync(CancellationToken ct = default);
}

public sealed class DbConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public DbConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default is required.");
    }

    public async Task<NpgsqlConnection> CreateOpenConnectionAsync(CancellationToken ct = default)
    {
        var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        return conn;
    }
}
