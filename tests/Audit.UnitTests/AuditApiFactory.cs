using AcingIU.Audit.Data;
using AcingIU.Audit.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
namespace AcingIU.Audit.UnitTests;

public sealed class AuditApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, c) => c.AddInMemoryCollection(new Dictionary<string,string?>
        {
            ["ConnectionStrings:AuditDatabase"]="Host=localhost;Port=1;Database=audit_test;Username=audit_reader;Password=not_used",
            ["Jwt:Issuer"]="acing-iu-tests", ["Jwt:Audience"]="acing-iu-api-tests",
            ["Jwt:SigningKey"]="audit-test-key-that-is-at-least-thirty-two-characters-long"
        }));
        builder.ConfigureServices(services => { services.RemoveAll<IAuditLogRepository>(); services.AddSingleton<IAuditLogRepository, EmptyRepository>(); });
    }
    private sealed class EmptyRepository : IAuditLogRepository
    {
        public Task<IReadOnlyList<AuditLogRecord>> GetRecentAsync(string? a,string? b,long? c,int d,CancellationToken e)
            => Task.FromResult<IReadOnlyList<AuditLogRecord>>(Array.Empty<AuditLogRecord>());
    }
}
