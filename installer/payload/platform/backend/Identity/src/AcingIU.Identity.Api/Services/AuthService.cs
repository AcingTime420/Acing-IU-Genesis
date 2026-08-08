using AcingIU.Identity.Api.Data;
using AcingIU.Identity.Api.Models;
using AcingIU.Identity.Api.Options;
using Microsoft.Extensions.Options;

namespace AcingIU.Identity.Api.Services;

public interface IAuthService
{
    Task<(AuthResponse? Response, string? Error, int Status)> RegisterAsync(RegisterRequest req, string? traceId, CancellationToken ct = default);
    Task<(AuthResponse? Response, string? Error, int Status)> LoginAsync(LoginRequest req, string? userAgent, string? ip, string? traceId, CancellationToken ct = default);
    Task<(AuthResponse? Response, string? Error, int Status)> RefreshAsync(RefreshRequest req, string? userAgent, string? ip, string? traceId, CancellationToken ct = default);
    Task<UserProfileResponse?> GetProfileAsync(Guid userId, CancellationToken ct = default);
    Task<(MfaEnrollResponse? Response, string? Error, int Status)> EnrollMfaAsync(Guid userId, string? traceId, CancellationToken ct = default);
    Task<(MfaVerifyResponse? Response, string? Error, int Status)> VerifyMfaAsync(Guid userId, string code, string? traceId, CancellationToken ct = default);
    Task<(bool Ok, string? Error, int Status)> LogoutAsync(Guid? userId, string? accessJti, TimeSpan? accessTtl, string? refreshToken, string? traceId, CancellationToken ct = default);
}

public sealed class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _hasher;
    private readonly ITokenService _tokens;
    private readonly ITokenRevocationStore _revocation;
    private readonly IMfaService _mfa;
    private readonly JwtOptions _jwt;

    public AuthService(
        IUserRepository users,
        IPasswordHasher hasher,
        ITokenService tokens,
        ITokenRevocationStore revocation,
        IMfaService mfa,
        IOptions<JwtOptions> jwt)
    {
        _users = users;
        _hasher = hasher;
        _tokens = tokens;
        _revocation = revocation;
        _mfa = mfa;
        _jwt = jwt.Value;
    }

    public async Task<(AuthResponse? Response, string? Error, int Status)> RegisterAsync(RegisterRequest req, string? traceId, CancellationToken ct = default)
    {
        var existing = await _users.FindByEmailAsync(req.Email, ct);
        if (existing is not null)
        {
            await _users.WriteAuditAsync("auth.register.conflict", "WARNING", req.Email, "/api/auth/register", new { reason = "email_taken" }, traceId, ct);
            return (null, "An account with this email already exists.", 409);
        }

        var hash = _hasher.Hash(req.Password);
        var user = await _users.CreateAsync(req.Email, hash, ct);

        await _users.WriteAuditAsync("auth.register.success", "INFO", user.Id.ToString(), "/api/auth/register", new { email = user.Email }, traceId, ct);

        var response = await IssueTokensAsync(user, null, null, ct);
        return (response, null, 201);
    }

    public async Task<(AuthResponse? Response, string? Error, int Status)> LoginAsync(LoginRequest req, string? userAgent, string? ip, string? traceId, CancellationToken ct = default)
    {
        var user = await _users.FindByEmailAsync(req.Email, ct);
        if (user is null || !_hasher.Verify(req.Password, user.PasswordHash))
        {
            await _users.WriteAuditAsync("auth.login.failure", "WARNING", req.Email, "/api/auth/login", new { reason = "invalid_credentials" }, traceId, ct);
            return (null, "Invalid email or password.", 401);
        }

        if (!user.IsActive)
        {
            await _users.WriteAuditAsync("auth.login.disabled", "WARNING", user.Id.ToString(), "/api/auth/login", null, traceId, ct);
            return (null, "Account is disabled.", 403);
        }

        await _users.WriteAuditAsync("auth.login.success", "INFO", user.Id.ToString(), "/api/auth/login", new { email = user.Email }, traceId, ct);

        var response = await IssueTokensAsync(user, userAgent, ip, ct);
        return (response, null, 200);
    }

    public async Task<(AuthResponse? Response, string? Error, int Status)> RefreshAsync(RefreshRequest req, string? userAgent, string? ip, string? traceId, CancellationToken ct = default)
    {
        var hash = _tokens.HashToken(req.RefreshToken);
        var found = await _users.FindRefreshTokenAsync(hash, ct);

        if (found is null)
        {
            await _users.WriteAuditAsync("auth.refresh.unknown", "WARNING", "anonymous", "/api/auth/refresh", null, traceId, ct);
            return (null, "Invalid refresh token.", 401);
        }

        var (userId, familyId, isDead) = found.Value;

        // Reuse detection: if token already revoked/expired, burn the whole family
        if (isDead || await _revocation.IsFamilyRevokedAsync(familyId, ct))
        {
            await _users.RevokeRefreshFamilyAsync(familyId, ct);
            await _revocation.RevokeFamilyAsync(familyId, TimeSpan.FromDays(_jwt.RefreshTokenDays), ct);
            await _users.WriteAuditAsync("auth.refresh.reuse_detected", "CRITICAL", userId.ToString(), "/api/auth/refresh", new { familyId }, traceId, ct);
            return (null, "Refresh token reuse detected. All sessions in this family have been revoked.", 401);
        }

        var user = await _users.FindByIdAsync(userId, ct);
        if (user is null || !user.IsActive)
            return (null, "User not found or disabled.", 401);

        // Rotate: revoke old, issue new in same family
        await _users.RevokeRefreshTokenAsync(hash, null, ct);

        await _users.WriteAuditAsync("auth.refresh.success", "INFO", userId.ToString(), "/api/auth/refresh", new { familyId }, traceId, ct);

        var response = await IssueTokensAsync(user, userAgent, ip, ct, familyId);
        return (response, null, 200);
    }

    public async Task<UserProfileResponse?> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _users.FindByIdAsync(userId, ct);
        if (user is null) return null;
        return new UserProfileResponse
        {
            Id = user.Id,
            Email = user.Email,
            MfaEnabled = user.MfaEnabled,
            Roles = user.Roles,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<(MfaEnrollResponse? Response, string? Error, int Status)> EnrollMfaAsync(Guid userId, string? traceId, CancellationToken ct = default)
    {
        var user = await _users.FindByIdAsync(userId, ct);
        if (user is null) return (null, "User not found.", 404);
        if (user.MfaEnabled) return (null, "MFA is already enabled.", 409);

        var secret = _mfa.GenerateSecret();
        await _users.SetMfaSecretAsync(userId, secret, ct);
        var uri = _mfa.BuildOtpAuthUri(user.Email, secret);

        await _users.WriteAuditAsync("auth.mfa.enroll", "INFO", userId.ToString(), "/api/auth/mfa/enroll", null, traceId, ct);

        return (new MfaEnrollResponse
        {
            Secret = secret,
            ManualEntryKey = secret,
            OtpAuthUri = uri
        }, null, 200);
    }

    public async Task<(MfaVerifyResponse? Response, string? Error, int Status)> VerifyMfaAsync(Guid userId, string code, string? traceId, CancellationToken ct = default)
    {
        var secret = await _users.GetMfaSecretAsync(userId, ct);
        if (string.IsNullOrEmpty(secret))
            return (null, "MFA enrollment has not been started.", 400);

        if (!_mfa.VerifyCode(secret, code))
        {
            await _users.WriteAuditAsync("auth.mfa.verify.failure", "WARNING", userId.ToString(), "/api/auth/mfa/verify", null, traceId, ct);
            return (null, "Invalid MFA code.", 401);
        }

        await _users.EnableMfaAsync(userId, ct);
        await _users.WriteAuditAsync("auth.mfa.verify.success", "INFO", userId.ToString(), "/api/auth/mfa/verify", null, traceId, ct);

        return (new MfaVerifyResponse
        {
            MfaEnabled = true,
            Message = "MFA enabled successfully."
        }, null, 200);
    }

    public async Task<(bool Ok, string? Error, int Status)> LogoutAsync(
        Guid? userId, string? accessJti, TimeSpan? accessTtl, string? refreshToken, string? traceId, CancellationToken ct = default)
    {
        if (!string.IsNullOrEmpty(accessJti) && accessTtl is { } ttl && ttl > TimeSpan.Zero)
            await _revocation.RevokeAccessTokenAsync(accessJti, ttl, ct);

        if (!string.IsNullOrEmpty(refreshToken))
        {
            var hash = _tokens.HashToken(refreshToken);
            var found = await _users.FindRefreshTokenAsync(hash, ct);
            if (found is not null)
            {
                var (uid, familyId, _) = found.Value;
                await _users.RevokeRefreshFamilyAsync(familyId, ct);
                await _revocation.RevokeFamilyAsync(familyId, TimeSpan.FromDays(_jwt.RefreshTokenDays), ct);
                userId ??= uid;
            }
        }

        await _users.WriteAuditAsync(
            "auth.logout",
            "INFO",
            userId?.ToString() ?? "anonymous",
            "/api/auth/logout",
            new { jti = accessJti },
            traceId,
            ct);

        return (true, null, 204);
    }

    private async Task<AuthResponse> IssueTokensAsync(UserRecord user, string? userAgent, string? ip, CancellationToken ct, Guid? existingFamily = null)
    {
        var (access, expires, _) = _tokens.CreateAccessToken(user);
        var refresh = _tokens.CreateRefreshToken();
        var refreshHash = _tokens.HashToken(refresh);
        var familyId = existingFamily ?? Guid.NewGuid();
        var refreshExpiry = DateTimeOffset.UtcNow.AddDays(_jwt.RefreshTokenDays);

        await _users.InsertRefreshTokenAsync(user.Id, refreshHash, familyId, refreshExpiry, userAgent, ip, ct);

        return new AuthResponse
        {
            AccessToken = access,
            RefreshToken = refresh,
            AccessTokenExpiresAt = expires,
            UserId = user.Id,
            Email = user.Email,
            Roles = user.Roles
        };
    }
}
