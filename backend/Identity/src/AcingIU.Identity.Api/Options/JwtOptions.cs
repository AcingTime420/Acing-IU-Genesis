namespace AcingIU.Identity.Api.Options;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "acing-iu";
    public string Audience { get; set; } = "acing-iu-api";
    /// <summary>HS256 signing key — must be ≥ 32 characters.</summary>
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 14;
}
