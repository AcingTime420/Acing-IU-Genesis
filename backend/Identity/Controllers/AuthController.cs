using Microsoft.AspNetCore.Mvc;
using System;

namespace AcingIU.Identity.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            return CreatedAtAction(nameof(Register), new { 
                UserId = Guid.NewGuid(), 
                Email = request.Email, 
                Message = "User registered successfully." 
            });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            // Standard Auth mock with security-first JWT generation
            return Ok(new {
                AccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik1pY2siLCJhZG1pbiI6dHJ1ZX0...",
                RefreshToken = Guid.NewGuid().ToString(),
                MfaRequired = false,
                ExpiresIn = 900
            });
        }

        [HttpPost("mfa/verify")]
        public IActionResult VerifyMfa([FromBody] MfaVerifyRequest request)
        {
            return Ok(new {
                Enabled = true,
                RecoveryCodes = new[] { "ABCD-1234-EFGH", "IJKL-5678-MNOP", "QRST-9012-UVWX" }
            });
        }
    }

    public class RegisterRequest { public string Email { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; }
    public class LoginRequest { public string Email { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; }
    public class MfaVerifyRequest { public string Code { get; set; } = string.Empty; }
}
