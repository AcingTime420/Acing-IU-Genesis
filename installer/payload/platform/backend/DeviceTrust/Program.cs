var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSingleton<AcingOS.DeviceTrust.FirmwareCenter>();

var app = builder.Build();

app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Component = "Device Trust Engine" }));

app.Run();
