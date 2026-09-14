using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using AcingIU.DeviceTrust.Api.Data;
using AcingIU.DeviceTrust.Api.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace AcingIU.DeviceTrust.UnitTests;

/// <summary>
/// HTTP-level AUTHZ-04 coverage via WebApplicationFactory / TestServer.
/// Exercises authentication middleware and end-to-end status codes.
/// </summary>
public class DeviceTrustAuthzIntegrationTests : IClassFixture<DeviceTrustWebApplicationFactory>
{
    private static readonly Guid OwnerA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid OwnerB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid AdminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid OperatorId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private const string OwnedHw = "HW-OWNER-A";
    private const string UnknownHw = "HW-DOES-NOT-EXIST";

    private readonly DeviceTrustWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public DeviceTrustAuthzIntegrationTests(DeviceTrustWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        // Seed a device owned by A for each test run.
        factory.Repository.Record = new DeviceOwnershipRecord
        {
            OwnerUserId = OwnerA,
            Response = new TrustScoreResponse
            {
                DeviceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                HwIdentifier = OwnedHw,
                SocModel = "SM-TEST",
                TrustScore = 90,
                UpdatedAt = DateTimeOffset.UtcNow
            }
        };
        factory.Repository.DeniedAudits.Clear();
    }

    [Fact]
    public async Task Unauthenticated_GetDevice_returns_401_from_middleware()
    {
        var response = await _client.GetAsync($"/api/trust/devices/{OwnedHw}");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Authenticated_owner_receives_200()
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, $"/api/trust/devices/{OwnedHw}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(OwnerA, "User"));
        var response = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains(OwnedHw, body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Authenticated_non_owner_receives_404()
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, $"/api/trust/devices/{OwnedHw}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(OwnerB, "User"));
        var response = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Device not registered.", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Unknown_device_receives_same_404_as_non_owner()
    {
        using var nonOwner = new HttpRequestMessage(HttpMethod.Get, $"/api/trust/devices/{OwnedHw}");
        nonOwner.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(OwnerB, "User"));
        var cross = await _client.SendAsync(nonOwner);

        using var unknown = new HttpRequestMessage(HttpMethod.Get, $"/api/trust/devices/{UnknownHw}");
        unknown.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(OwnerA, "User"));
        var miss = await _client.SendAsync(unknown);

        Assert.Equal(HttpStatusCode.NotFound, cross.StatusCode);
        Assert.Equal(cross.StatusCode, miss.StatusCode);
        var crossBody = await cross.Content.ReadAsStringAsync();
        var missBody = await miss.Content.ReadAsStringAsync();
        // Same public detail string (anti-enumeration).
        Assert.Contains("Device not registered.", crossBody, StringComparison.Ordinal);
        Assert.Contains("Device not registered.", missBody, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Malformed_subject_claim_fails_closed_with_401()
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, $"/api/trust/devices/{OwnedHw}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CreateTokenRaw("not-a-guid", "User"));
        var response = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task User_role_cannot_list_devices_like_operator()
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, "/api/trust/devices");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(OwnerA, "User"));
        var response = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admin_can_read_device_owned_by_another_user()
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, $"/api/trust/devices/{OwnedHw}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(AdminId, "Admin"));
        var response = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Operator_can_read_device_owned_by_another_user()
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, $"/api/trust/devices/{OwnedHw}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(OperatorId, "Operator"));
        var response = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task SubmitTelemetry_without_token_returns_401()
    {
        var payload = JsonSerializer.Serialize(new
        {
            hwIdentifier = OwnedHw,
            socModel = "SM-TEST",
            selinuxStatus = "Enforcing"
        });
        using var content = new StringContent(payload, Encoding.UTF8, "application/json");
        var response = await _client.PostAsync("/api/trust/telemetry/submit", content);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SubmitTelemetry_with_valid_subject_returns_200()
    {
        var payload = JsonSerializer.Serialize(new
        {
            hwIdentifier = "HW-TELEMETRY-1",
            socModel = "SM-TEST",
            selinuxStatus = "Enforcing",
            bootloaderLocked = true,
            partitionsUnmodified = true,
            knoxWarrantyFuseIntact = true,
            isRooted = false
        });
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/trust/telemetry/submit")
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(OwnerA, "User"));
        var response = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(_factory.Repository.Upserts, u => u.Owner == OwnerA);
    }

    private string CreateToken(Guid subject, string role) =>
        CreateTokenRaw(subject.ToString("D"), role);

    private string CreateTokenRaw(string subject, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(DeviceTrustWebApplicationFactory.SigningKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, subject),
            new(ClaimTypes.Role, role)
        };
        var token = new JwtSecurityToken(
            issuer: "acing-iu",
            audience: "acing-iu-api",
            claims: claims,
            notBefore: DateTime.UtcNow.AddMinutes(-1),
            expires: DateTime.UtcNow.AddMinutes(30),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public sealed class DeviceTrustWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string SigningKey = "TEST_SIGNING_KEY_AT_LEAST_32_CHARS_LONG!!";
    public FakeDeviceRepository Repository { get; } = new();

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.UseSetting("Jwt:SigningKey", SigningKey);
        builder.UseSetting("Jwt:Issuer", "acing-iu");
        builder.UseSetting("Jwt:Audience", "acing-iu-api");
        builder.UseSetting("ConnectionStrings:Default", "Host=localhost;Database=unused;Username=u;Password=p");

        builder.ConfigureServices(services =>
        {
            // Replace persistence with in-memory fake so tests do not need PostgreSQL.
            var repoDescriptors = services.Where(d =>
                d.ServiceType == typeof(IDeviceRepository) ||
                d.ServiceType == typeof(IDbConnectionFactory)).ToList();
            foreach (var d in repoDescriptors)
                services.Remove(d);

            services.AddSingleton<IDeviceRepository>(Repository);
        });
    }
}
