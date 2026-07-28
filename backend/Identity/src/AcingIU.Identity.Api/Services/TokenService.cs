using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AcingIU.Identity.Api.Models;
using AcingIU.Identity.Api.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace AcingIU.Identity.Api.Services;

public interface ITokenService
{
    (string AccessToken, DateTimeOffset ExpiresAt, string Jti) CreateAccessToken(UserRecord user);
    string CreateRefreshToken();
    string HashToken(string rawToken);
}

public sealed class TokenService : ITokenService
{
    private readonly JwtOptions _opts;
    private readonly SymmetricSecurityKey _key;

    public TokenService(IOptions<JwtOptions> opts)
    {
        _opts = opts.Value;
        if (string.IsNullOrWhiteSpace(_opts.SigningKey) || _opts.SigningKey.Length < 32)
            throw new InvalidOperationException("Jwt:SigningKey must be at least 32 characters.");
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opts.SigningKey));
    }

    public (string AccessToken, DateTimeOffset ExpiresAt, string Jti) CreateAccessToken(UserRecord user)
    {
        var jti = Guid.NewGuid().ToString("N");
        var expires = DateTimeOffset.UtcNow.AddMinutes(_opts.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, jti),
            new(JwtRegisteredClaimNames.Iss, _opts.Issuer),
            new(JwtRegisteredClaimNames.Aud, _opts.Audience)
        };
        foreach (var role in user.Roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _opts.Issuer,
            audience: _opts.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expires.UtcDateTime,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expires, jti);
    }

    public string CreateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    public string HashToken(string rawToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
