# Dependency map — Genesis

## Runtime services

```
gateway (nginx)
  ├── identity (ASP.NET 8)
  │     ├── postgres:16
  │     └── redis:7
  └── device-trust (ASP.NET 8)
        └── postgres:16
```

## NuGet (Identity)

| Package | Purpose |
|---------|---------|
| Microsoft.AspNetCore.Authentication.JwtBearer | JWT auth |
| System.IdentityModel.Tokens.Jwt | Token create/validate |
| Npgsql | Postgres |
| StackExchange.Redis | Revocation store |
| (Argon2 package as implemented) | Password hashing |
| Swashbuckle.AspNetCore | Swagger |

## NuGet (Device Trust)

| Package | Purpose |
|---------|---------|
| Microsoft.AspNetCore.Authentication.JwtBearer | Validate Identity JWTs |
| Npgsql | Devices + audit |
| Swashbuckle.AspNetCore | Swagger |

## SharedKernel

No external dependencies (net8.0 class library).

## Infrastructure images

| Image | Role |
|-------|------|
| postgres:16-alpine | State |
| redis:7-alpine | Cache / revocation |
| nginx:1.27-alpine | Gateway |
| mcr.microsoft.com/dotnet/sdk:8.0 | Build stage |
| mcr.microsoft.com/dotnet/aspnet:8.0 | Runtime stage |

## Tooling (dev/CI)

- Docker Compose v2  
- GitHub Actions  
- TruffleHog, Trivy  
- Inno Setup 6 / NSIS 3 (Windows artifacts only)  
- optional: Redocly CLI for OpenAPI  

## Explicit non-dependencies (Genesis)

- Kubernetes, Helm  
- YARP / Envoy  
- Entity Framework Core (raw Npgsql by design for thin vertical slice)  
- Message bus (Kafka/Rabbit)  
