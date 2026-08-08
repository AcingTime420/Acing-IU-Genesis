using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AcingIU.Identity.Api.Models;
using AcingIU.Identity.Api.Options;
using AcingIU.Identity.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AcingIU.Identity.Api.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public sealed class AuthController : ControllerBase
{
    public const string RefreshCookieName = "acing_refresh";

    private readonly IAuthService _auth;
    private readonly JwtOptions _jwt;

    public AuthController(IAuthService auth, IOptions<JwtOptions> jwt)
    {
        _auth = auth;
        _jwt = jwt.Value;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ProblemResult(400, "Validation failed", "Request body failed validation.");

        var (response, error, status) = await _auth.RegisterAsync(request, HttpContext.TraceIdentifier, ct);
        if (response is null)
            return ProblemResult(status, status == 409 ? "Conflict" : "Error", error!);

        SetRefreshCookie(response.RefreshToken);
        return StatusCode(status, response);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ProblemResult(400, "Validation failed", "Request body failed validation.");

        var ua = Request.Headers.UserAgent.ToString();
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var (response, error, status) = await _auth.LoginAsync(request, ua, ip, HttpContext.TraceIdentifier, ct);
        if (response is null)
            return ProblemResult(status, "Unauthorized", error!);

        SetRefreshCookie(response.RefreshToken);
        return Ok(response);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest? request, CancellationToken ct)
    {
        var raw = request?.RefreshToken;
        if (string.IsNullOrEmpty(raw))
            raw = Request.Cookies[RefreshCookieName];

        if (string.IsNullOrEmpty(raw))
            return ProblemResult(400, "Validation failed", "Refresh token required in body or cookie.");

        var ua = Request.Headers.UserAgent.ToString();
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var (response, error, status) = await _auth.RefreshAsync(
            new RefreshRequest { RefreshToken = raw }, ua, ip, HttpContext.TraceIdentifier, ct);
        if (response is null)
        {
            ClearRefreshCookie();
            return ProblemResult(status, "Unauthorized", error!);
        }

        SetRefreshCookie(response.RefreshToken);
        return Ok(response);
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest? request, CancellationToken ct)
    {
        Guid? userId = null;
        string? jti = null;
        TimeSpan? ttl = null;

        if (User.Identity?.IsAuthenticated == true)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (Guid.TryParse(sub, out var uid)) userId = uid;
            jti = User.FindFirstValue(JwtRegisteredClaimNames.Jti) ?? User.FindFirstValue("jti");
            var exp = User.FindFirstValue(JwtRegisteredClaimNames.Exp) ?? User.FindFirstValue("exp");
            if (long.TryParse(exp, out var expUnix))
            {
                var remaining = DateTimeOffset.FromUnixTimeSeconds(expUnix) - DateTimeOffset.UtcNow;
                if (remaining > TimeSpan.Zero) ttl = remaining;
            }
        }

        var refresh = request?.RefreshToken ?? Request.Cookies[RefreshCookieName];
        await _auth.LogoutAsync(userId, jti, ttl, refresh, HttpContext.TraceIdentifier, ct);
        ClearRefreshCookie();
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null)
            return ProblemResult(401, "Unauthorized", "Invalid token subject.");

        var profile = await _auth.GetProfileAsync(userId.Value, ct);
        if (profile is null)
            return ProblemResult(404, "Not Found", "User not found.");

        return Ok(profile);
    }

    [HttpGet("mfa/enroll")]
    [Authorize]
    [ProducesResponseType(typeof(MfaEnrollResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> EnrollMfa(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return ProblemResult(401, "Unauthorized", "Invalid token subject.");

        var (response, error, status) = await _auth.EnrollMfaAsync(userId.Value, HttpContext.TraceIdentifier, ct);
        if (response is null) return ProblemResult(status, "Error", error!);
        return Ok(response);
    }

    [HttpPost("mfa/verify")]
    [Authorize]
    [ProducesResponseType(typeof(MfaVerifyResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> VerifyMfa([FromBody] MfaVerifyRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ProblemResult(400, "Validation failed", "Code must be 6 digits.");

        var userId = GetUserId();
        if (userId is null) return ProblemResult(401, "Unauthorized", "Invalid token subject.");

        var (response, error, status) = await _auth.VerifyMfaAsync(userId.Value, request.Code, HttpContext.TraceIdentifier, ct);
        if (response is null) return ProblemResult(status, "Error", error!);
        return Ok(response);
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private void SetRefreshCookie(string refreshToken)
    {
        Response.Cookies.Append(RefreshCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth",
            MaxAge = TimeSpan.FromDays(_jwt.RefreshTokenDays),
            IsEssential = true
        });
    }

    private void ClearRefreshCookie()
    {
        Response.Cookies.Delete(RefreshCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth"
        });
    }

    private ObjectResult ProblemResult(int status, string title, string detail)
    {
        var body = new ProblemDetailsBody
        {
            Type = $"https://acing.iu/problems/{status}",
            Title = title,
            Status = status,
            Detail = detail,
            TraceId = HttpContext.TraceIdentifier
        };
        return StatusCode(status, body);
    }
}
