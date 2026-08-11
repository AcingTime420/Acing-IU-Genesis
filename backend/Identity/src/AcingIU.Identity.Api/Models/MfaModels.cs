using System.ComponentModel.DataAnnotations;

namespace AcingIU.Identity.Api.Models;

public sealed class MfaEnrollResponse
{
    public string Secret { get; set; } = string.Empty;
    public string OtpAuthUri { get; set; } = string.Empty;
    public string ManualEntryKey { get; set; } = string.Empty;
}

public sealed class MfaVerifyRequest
{
    [Required, StringLength(6, MinimumLength = 6)]
    public string Code { get; set; } = string.Empty;
}

public sealed class MfaVerifyResponse
{
    public bool MfaEnabled { get; set; }
    public string Message { get; set; } = string.Empty;
}

public sealed class LogoutRequest
{
    /// <summary>Optional refresh token to revoke. If omitted, only the access token jti is blacklisted.</summary>
    public string? RefreshToken { get; set; }
}
