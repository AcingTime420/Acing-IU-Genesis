using System.Text.Json;
using AcingIU.Identity.Api.Models;
using Xunit;

namespace AcingIU.Identity.UnitTests;

public sealed class AuthResponseContractTests
{
    [Fact]
    public void AuthResponse_does_not_expose_refresh_token()
    {
        Assert.Null(typeof(AuthResponse).GetProperty("RefreshToken"));

        var response = new AuthResponse
        {
            AccessToken = "access-token",
            AccessTokenExpiresAt = DateTimeOffset.UtcNow,
            UserId = Guid.NewGuid(),
            Email = "fixture.admin@example.invalid",
            Roles = ["Admin"]
        };

        var json = JsonSerializer.Serialize(response);
        Assert.DoesNotContain("refreshToken", json, StringComparison.OrdinalIgnoreCase);
    }
}
