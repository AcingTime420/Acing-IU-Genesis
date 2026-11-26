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
        factory.Repository.Audits.Clear();
        factory.Repository.MutationAttempts.Clear();
        factory.Repository.FailSuccessAudit = false;
        factory.Repository.FailDenialAudit = false;
    }

    [Fact]
    public async Task Unauthenticated_GetDevice_returns_401_from_middleware()
    {
        Assert.Equal(HttpStatusCode.Unauthorized, (await _client.GetAsync($"/api/trust/devices/{OwnedHw}")).StatusCode);
    }

    [Fact]
    public async Task Authenticated_owner_receives_200()
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, $"/api/trust/devices/{OwnedHw}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(OwnerA, "User"));
        Assert.Equal(HttpStatusCode.OK, (await _client.SendAsync(req)).StatusCode);
    }

    [Fact]
    public async Task Authenticated_non_owner_receives_404()
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, $"/api/trust/devices/{OwnedHw}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(OwnerB, "User"));
        Assert.Equal(HttpStatusCode.NotFound, (await _client.SendAsync(req)).StatusCode);
    }

    [Fact]
    public async Task Admin_and_Operator_can_read_unowned()
    {
        foreach (var (id, role) in new[] { (AdminId, "Admin"), (OperatorId, "Operator") })
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, $"/api/trust/devices/{OwnedHw}");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(id, role));
            Assert.Equal(HttpStatusCode.OK, (await _client.SendAsync(req)).StatusCode);
        }
    }

    [Fact]
    public async Task SubmitTelemetry_owner_update_returns_200()
    {
        var payload = TelemetryJson(OwnedHw);
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/trust/telemetry/submit")
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(OwnerA, "User"));
        Assert.Equal(HttpStatusCode.OK, (await _client.SendAsync(req)).StatusCode);
        Assert.Equal(OwnerA, _factory.Repository.Record!.OwnerUserId);
    }

    [Fact]
    public async Task SubmitTelemetry_cross_owner_returns_404()
    {
        var payload = TelemetryJson(OwnedHw);
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/trust/telemetry/submit")
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(OwnerB, "User"));
        var response = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
       Assert.Contains(_factory.Repository.MutationAttempts, m => m.Caller == OwnerB && m.Hw == OwnedHw); // mutation attempted but rejected
    }

    [Fact]
    public async Task SubmitTelemetry_unknown_hw_returns_404_no_enrollment()
    {
        var payload = TelemetryJson(UnknownHw);
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/trust/telemetry/submit")
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(OwnerA, "User"));
        Assert.Equal(HttpStatusCode.NotFound, (await _client.SendAsync(req)).StatusCode);
        // Seeded owned device still present; unknown was not created.
        Assert.Equal(OwnedHw, _factory.Repository.Record!.Response.HwIdentifier);
    }

    private static string TelemetryJson(string hw) => JsonSerializer.Serialize(new
    {
        hwIdentifier = hw,
        socModel = "SM-TEST",
        selinuxStatus = "Enforcing",
        bootloaderLocked = true,
        partitionsUnmodified = true,
        knoxWarrantyFuseIntact = true,
        isRooted = false
    });

    private string CreateToken(Guid subject, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(DeviceTrustWebApplicationFactory.SigningKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, subject.ToString("D")),
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
            var repoDescriptors = services.Where(d =>
                d.ServiceType == typeof(IDeviceRepository) ||
                d.ServiceType == typeof(IDbConnectionFactory)).ToList();
            foreach (var d in repoDescriptors)
                services.Remove(d);
            services.AddSingleton<IDeviceRepository>(Repository);
        });
    }
}
