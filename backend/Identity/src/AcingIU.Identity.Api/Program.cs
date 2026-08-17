using System.Text;
using AcingIU.Identity.Api.Data;
using AcingIU.Identity.Api.Options;
using AcingIU.Identity.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services
    .AddOptions<MfaSecretProtectionOptions>()
    .Bind(builder.Configuration.GetSection(MfaSecretProtectionOptions.SectionName))
    .Validate(MfaSecretProtectionOptions.IsValid, "MFA secret protection requires a valid active key identifier and base64-encoded 32-byte key material.")
    .ValidateOnStart();

// ---------------------------------------------------------------------------
// Data & infrastructure
// ---------------------------------------------------------------------------
builder.Services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

var redisConn = builder.Configuration["Redis:Connection"]
    ?? throw new InvalidOperationException("Redis:Connection is required.");
builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(redisConn));
builder.Services.AddSingleton<ITokenRevocationStore, RedisTokenRevocationStore>();

// ---------------------------------------------------------------------------
// Domain services
// ---------------------------------------------------------------------------
builder.Services.AddSingleton<IPasswordHasher, Argon2idPasswordHasher>();
builder.Services.AddSingleton<ITokenService, TokenService>();
builder.Services.AddSingleton<IMfaService, TotpMfaService>();
builder.Services.AddSingleton<IMfaSecretProtector, AesGcmMfaSecretProtector>();
builder.Services.AddScoped<IAuthService, AuthService>();

// ---------------------------------------------------------------------------
// AuthN
// ---------------------------------------------------------------------------
var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName);
var signingKey = jwtSection["SigningKey"]
    ?? throw new InvalidOperationException("Jwt:SigningKey is required.");
if (signingKey.Length < 32)
    throw new InvalidOperationException("Jwt:SigningKey must be at least 32 characters.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSection["Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = "sub",
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async ctx =>
            {
                var jti = ctx.Principal?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti)?.Value
                       ?? ctx.Principal?.FindFirst("jti")?.Value;
                if (string.IsNullOrEmpty(jti)) return;
                var store = ctx.HttpContext.RequestServices.GetRequiredService<ITokenRevocationStore>();
                if (await store.IsAccessTokenRevokedAsync(jti))
                    ctx.Fail("Token has been revoked.");
            }
        };
    });
builder.Services.AddAuthorization();

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Acing IU Identity API",
        Version = "v1",
        Description = "S2 Identity & Access Management — register, login, refresh, profile"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddHealthChecks();

// Structured console logging (stdout → Docker / FluentBit / Loki)
builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(o =>
{
    o.IncludeScopes = true;
    o.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";
    o.UseUtcTimestamp = true;
});

var app = builder.Build();

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Acing IU Identity v1"));
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Expose for integration tests
public partial class Program { }
