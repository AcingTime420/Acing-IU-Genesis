# Configuration model

## Hierarchy

1. `appsettings.json` (non-secret defaults)  
2. `appsettings.{Environment}.json`  
3. Environment variables (Compose / host) — **override**  
4. User secrets (local only)  

## ASP.NET env binding

| Config path | Environment variable |
|-------------|----------------------|
| `ConnectionStrings:Default` | `ConnectionStrings__Default` |
| `Redis:Connection` | `Redis__Connection` |
| `Jwt:SigningKey` | `Jwt__SigningKey` |
| `Jwt:Issuer` | `Jwt__Issuer` |
| `Jwt:Audience` | `Jwt__Audience` |
| `Jwt:AccessTokenMinutes` | `Jwt__AccessTokenMinutes` |
| `Jwt:RefreshTokenDays` | `Jwt__RefreshTokenDays` |

## Required at startup (Identity)

- `Jwt:SigningKey` length ≥ 32 or process **fails fast**  
- Valid Postgres connection for `/health/ready`  

## Device Trust

- Same JWT issuer/audience/signing key as Identity  
- Postgres only (no Redis in Genesis Device Trust)  
