using System.Text.Json.Serialization;
using HumanAuthority;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);
if (!builder.Environment.IsDevelopment() && !builder.Environment.IsEnvironment("Test"))
    throw new InvalidOperationException("HumanAuthority is restricted to Development/Test.");

if (string.IsNullOrEmpty(builder.Configuration["urls"]))
    builder.WebHost.UseUrls("http://127.0.0.1:5088");
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 7 * 1024 * 1024);
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow;
});
builder.Services.Configure<RouteHandlerOptions>(options => options.ThrowOnBadRequest = true);
builder.Services.AddSingleton(_ =>
{
    var configured = builder.Configuration.GetConnectionString("Default");
    if (string.IsNullOrWhiteSpace(configured))
        throw new AuthorityUnavailableException();
    try
    {
        var settings = new NpgsqlConnectionStringBuilder(configured)
        {
            IncludeErrorDetail = false,
            LogParameters = false,
            Timeout = 10,
            CommandTimeout = 30,
            Options = "-c lock_timeout=10000 -c statement_timeout=30000"
        };
        return NpgsqlDataSource.Create(settings.ConnectionString);
    }
    catch (ArgumentException)
    {
        throw new AuthorityUnavailableException();
    }
});
builder.Services.AddSingleton<AuthorityDatabase>();

var app = builder.Build();
app.Use(async (context, next) =>
{
    try
    {
        await next(context);
    }
    catch (BadHttpRequestException exception) when (!context.Response.HasStarted)
    {
        context.Response.Clear();
        var status = exception.StatusCode == 413 ? 413 : 400;
        await AuthorityErrors.Write(context, status, status == 413 ? "request_too_large" : "invalid_request");
    }
    catch (System.Text.Json.JsonException) when (!context.Response.HasStarted)
    {
        context.Response.Clear();
        await AuthorityErrors.Write(context, 400, "invalid_request");
    }
    catch (Exception) when (!context.Response.HasStarted)
    {
        // Never log database exceptions, connection strings or bearer material.
        context.Response.Clear();
        await AuthorityErrors.Write(context, 503, "authority_unavailable");
    }
});
app.UseStatusCodePages(async status =>
{
    var code = status.HttpContext.Response.StatusCode;
    await AuthorityErrors.Write(status.HttpContext, code, code switch
    {
        400 => "invalid_request",
        401 => "unauthorized",
        403 => "forbidden",
        404 => "not_found",
        413 => "request_too_large",
        _ => "authority_unavailable"
    });
});
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/v1/authority"))
    {
        var database = context.RequestServices.GetRequiredService<AuthorityDatabase>();
        var actor = await database.Authenticate(context.Request.Headers.Authorization);
        if (actor is null)
        {
            await AuthorityErrors.Write(context, 401, "unauthorized");
            return;
        }
        context.Items[typeof(AuthorityActor)] = actor;
    }
    await next(context);
});

app.MapGet("/health/ready", async (AuthorityDatabase database) =>
    await database.IsReady()
        ? Results.Ok(new { status = "ready" })
        : Results.Json(new { error = "authority_unavailable" }, statusCode: 503));

app.Run();

public partial class Program;
