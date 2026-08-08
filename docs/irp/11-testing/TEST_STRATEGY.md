# Test strategy — Genesis

## Layers

| Layer | Scope | Tooling |
|-------|-------|---------|
| Unit | Hash, TOTP, trust score engine, token hash | xUnit + FluentAssertions |
| Integration | API + Testcontainers Postgres/Redis | WebApplicationFactory |
| Contract | OpenAPI vs running app | schemathesis / Redocly + smoke |
| E2E smoke | Full compose | `infrastructure/scripts/smoke-auth.sh` |

## Minimum gates before merge

1. `dotnet build` Release succeeds  
2. Unit tests for TrustScoreEngine and TotpMfaService  
3. Secret scan clean  
4. Smoke script green on compose (CI optional nightly if Docker-in-Docker costly)  

## Trust score cases

| Input | Expected score |
|-------|----------------|
| All positive, not rooted | 100 |
| Rooted | 0 |
| Only SELinux Enforcing | 40 |
| Empty/unknown SELinux, rest true | 60 |

## Auth cases

- Duplicate email → 409  
- Bad password → 401  
- Refresh reuse after rotation → 401 + family revoked  
- Logout → subsequent /me 401  
