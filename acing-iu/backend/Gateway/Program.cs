var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddControllers();

var app = builder.Build();

app.UseHttpsRedirection();

app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Component = "API Gateway" }));

// Reverse Proxy Mock Route
app.MapGet("/api/gateway/routes", () => Results.Ok(new[] {
    new { Route = "/api/auth/*", Destination = "Identity Service" },
    new { Route = "/api/security/mfa/*", Destination = "Identity Service" },
    new { Route = "/api/devices/*", Destination = "Device Trust Service" },
    new { Route = "/api/policies/*", Destination = "Security Service" },
    new { Route = "/api/audit/*", Destination = "Audit Service" }
}));

app.Run();
