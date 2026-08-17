using AcingIU.Audit.Data;
using AcingIU.Audit.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace AcingIU.Audit.Tests;

public sealed class AuditApiFactory : WebApplicationFactory<Program>
{
    public AuditApiFactory()
    {
        Environment.SetEnvironmentVariable("ConnectionStrings__AuditDatabase", "Host=localhost;Port=1;Database=audit_test;Username=audit_reader;Password=not_used");
        Environment.SetEnvironmentVariable("Jwt__Issuer", "acing-iu-tests");
        Environment.SetEnvironmentVariable("Jwt__Audience", "acing-iu-api-tests");
        Environment.SetEnvironmentVariable("Jwt__SigningKey", "audit-test-key-that-is-at-least-thirty-two-characters-long");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:AuditDatabase"] = "Host=localhost;Port=1;Database=audit_test;Username=audit_reader;Password=not_used",
                ["Jwt:Issuer"] = "acing-iu-tests",
                ["Jwt:Audience"] = "acing-iu-api-tests",
                ["Jwt:SigningKey"] = "audit-test-key-that-is-at-least-thirty-two-characters-long"
            }));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IAuditLogRepository>();
            services.AddSingleton<IAuditLogRepository, EmptyAuditLogRepository>();
        });
    }

    private sealed class EmptyAuditLogRepository : IAuditLogRepository
    {
        public Task<IReadOnlyList<AuditLogRecord>> GetRecentAsync(string? eventType, string? severity, long? beforeId, int limit, CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyList<AuditLogRecord>>(Array.Empty<AuditLogRecord>());
    }
}
