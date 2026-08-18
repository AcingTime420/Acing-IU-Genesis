using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AcingIU.Identity.Api.Models;
using AcingIU.Identity.Api.Options;
using AcingIU.Identity.Api.Services;
using Microsoft.Extensions.Options;
using Xunit;

namespace AcingIU.Identity.UnitTests;

public sealed class TokenServiceSecurityTests
{
    private static readonly JwtOptions TokenOptions = new()
    {
        Issuer = "acing-iu-test",
        Audience = "acing-iu-test-api",
        SigningKey = "test-only-signing-key-that-is-at-least-thirty-two-characters-long",
        AccessTokenMinutes = 15,
        RefreshTokenDays = 14
    };

    [Fact]
    public void CreateAccessToken_EmitsExpectedIdentityRoleAndLifetimeClaims()
    {
        var service = CreateService();
        var user = new UserRecord
        {
            Id = Guid.NewGuid(),
            Email = "operator@example.test",
            Roles = new List<string> { "Operator", "Auditor" }
        };
        var issuedAt = DateTimeOffset.UtcNow;

        var (accessToken, expiresAt, jti) = service.CreateAccessToken(user);

        var token = new JwtSecurityTokenHandler().ReadJwtToken(accessToken);
        Assert.Equal(TokenOptions.Issuer, token.Issuer);
        Assert.Contains(TokenOptions.Audience, token.Audiences);
        Assert.Equal(user.Id.ToString(), token.Subject);
        Assert.Equal(jti, token.Id);
        Assert.Contains(token.Claims, claim => claim.Type == ClaimTypes.Role && claim.Value == "Operator");
        Assert.Contains(token.Claims, claim => claim.Type == ClaimTypes.Role && claim.Value == "Auditor");
        Assert.True(expiresAt >= issuedAt.AddMinutes(14));
        Assert.True(expiresAt <= issuedAt.AddMinutes(16));
    }

    [Fact]
    public void CreateAccessToken_GeneratesDistinctJtisForRepeatedIssuance()
    {
        var service = CreateService();
        var user = new UserRecord { Id = Guid.NewGuid(), Email = "operator@example.test" };

        var first = service.CreateAccessToken(user);
        var second = service.CreateAccessToken(user);

        Assert.NotEqual(first.Jti, second.Jti);
        Assert.NotEqual(first.AccessToken, second.AccessToken);
    }

    [Fact]
    public void CreateRefreshToken_GeneratesDistinctOpaqueValues()
    {
        var service = CreateService();

        var first = service.CreateRefreshToken();
        var second = service.CreateRefreshToken();

        Assert.NotEqual(first, second);
        Assert.True(first.Length >= 40);
        Assert.True(second.Length >= 40);
        Assert.DoesNotContain("operator", first, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("operator", second, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void HashToken_IsDeterministicAndDoesNotReturnTheRawToken()
    {
        var service = CreateService();
        const string rawToken = "refresh-token-value-that-must-not-be-persisted-directly";

        var firstHash = service.HashToken(rawToken);
        var secondHash = service.HashToken(rawToken);
        var alternateHash = service.HashToken(rawToken + "-different");

        Assert.Equal(firstHash, secondHash);
        Assert.NotEqual(firstHash, alternateHash);
        Assert.NotEqual(rawToken, firstHash);
        Assert.Equal(64, firstHash.Length);
        Assert.Matches("^[a-f0-9]{64}$", firstHash);
    }

    private static TokenService CreateService() => new(Microsoft.Extensions.Options.Options.Create(TokenOptions));
}
