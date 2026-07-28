using StackExchange.Redis;

namespace AcingIU.Identity.Api.Services;

public interface ITokenRevocationStore
{
    Task RevokeAccessTokenAsync(string jti, TimeSpan ttl, CancellationToken ct = default);
    Task<bool> IsAccessTokenRevokedAsync(string jti, CancellationToken ct = default);
    Task RevokeFamilyAsync(Guid familyId, TimeSpan ttl, CancellationToken ct = default);
    Task<bool> IsFamilyRevokedAsync(Guid familyId, CancellationToken ct = default);
}

public sealed class RedisTokenRevocationStore : ITokenRevocationStore
{
    private readonly IConnectionMultiplexer _redis;

    public RedisTokenRevocationStore(IConnectionMultiplexer redis) => _redis = redis;

    public async Task RevokeAccessTokenAsync(string jti, TimeSpan ttl, CancellationToken ct = default)
    {
        var db = _redis.GetDatabase();
        await db.StringSetAsync($"revoked:access:{jti}", "1", ttl);
    }

    public async Task<bool> IsAccessTokenRevokedAsync(string jti, CancellationToken ct = default)
    {
        var db = _redis.GetDatabase();
        return await db.KeyExistsAsync($"revoked:access:{jti}");
    }

    public async Task RevokeFamilyAsync(Guid familyId, TimeSpan ttl, CancellationToken ct = default)
    {
        var db = _redis.GetDatabase();
        await db.StringSetAsync($"revoked:family:{familyId:N}", "1", ttl);
    }

    public async Task<bool> IsFamilyRevokedAsync(Guid familyId, CancellationToken ct = default)
    {
        var db = _redis.GetDatabase();
        return await db.KeyExistsAsync($"revoked:family:{familyId:N}");
    }
}
