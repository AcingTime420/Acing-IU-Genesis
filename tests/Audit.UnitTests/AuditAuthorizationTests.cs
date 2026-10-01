using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
namespace AcingIU.Audit.UnitTests;

public sealed class AuditAuthorizationTests(AuditApiFactory factory) : IClassFixture<AuditApiFactory>
{
    private const string Issuer="acing-iu-tests", Audience="acing-iu-api-tests", SigningKey="audit-test-key-that-is-at-least-thirty-two-characters-long";

    [Fact] public async Task Anonymous_IsUnauthorized() { using var c=factory.CreateClient(); Assert.Equal(HttpStatusCode.Unauthorized,(await c.GetAsync("/api/audit")).StatusCode); }
    [Fact] public async Task User_IsForbidden() { using var c=factory.CreateClient(); c.DefaultRequestHeaders.Authorization=new AuthenticationHeaderValue("Bearer",Token("User")); Assert.Equal(HttpStatusCode.Forbidden,(await c.GetAsync("/api/audit")).StatusCode); }
    [Theory][InlineData("Admin")][InlineData("Operator")] public async Task Privileged_IsAllowed(string role) { using var c=factory.CreateClient(); c.DefaultRequestHeaders.Authorization=new AuthenticationHeaderValue("Bearer",Token(role)); Assert.Equal(HttpStatusCode.OK,(await c.GetAsync("/api/audit?limit=1")).StatusCode); }
    [Fact] public async Task ClientWrite_IsNotExposed() { using var c=factory.CreateClient(); c.DefaultRequestHeaders.Authorization=new AuthenticationHeaderValue("Bearer",Token("Admin")); using var r=await c.PostAsync("/api/audit",new StringContent("{}",Encoding.UTF8,"application/json")); Assert.Equal(HttpStatusCode.MethodNotAllowed,r.StatusCode); }

    private static string Token(string role) {
        var creds=new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SigningKey)),SecurityAlgorithms.HmacSha256);
        var token=new JwtSecurityToken(Issuer,Audience,[new Claim("sub","audit-test-user"),new Claim(ClaimTypes.Role,role)],DateTime.UtcNow.AddMinutes(-1),DateTime.UtcNow.AddMinutes(5),creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
