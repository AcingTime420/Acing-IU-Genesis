# Executive Summary — Genesis IRP v1.0

## Mission

Ship **Acing IU Genesis Foundation v1.0**: a security-first modular control plane where Identity and Device Trust are the first runnable vertical slices.

## In scope (v1.0)

| Capability | Sprint | Status in codebase |
|------------|--------|-------------------|
| Docker Compose plane (Postgres 16, Redis 7, Nginx) | S1 | Implemented |
| Identity API (register, login, refresh, logout, MFA TOTP, me) | S2 | Implemented |
| Device Trust API (telemetry, score, registry) | S3 | Implemented |
| SharedKernel (Result, ProblemDetails) | — | Scaffolded |
| Windows installer (Inno + NSIS) | Packaging | Implemented |
| CI (GitHub Actions) | Platform | Specified in IRP |
| OpenAPI + migrations + ADRs + threat model | Governance | This package |

## Out of scope (v1.0)

- Firmware Intelligence service (S4)  
- Policy Engine runtime (S5)  
- Next.js control plane UI (S7)  
- Multi-region HA, service mesh, YARP replacement for Nginx  
- Production IdP federation (OIDC external IdP)  

## Success criteria (Genesis DoD)

1. `docker compose up` yields healthy gateway on `:8080`  
2. Smoke: register → login → me → MFA enroll → telemetry (score 100) → logout → 401  
3. Secrets never committed; `.env.example` only  
4. OpenAPI published and CI contract-check passes  
5. Migrations idempotent on empty Postgres volume  

## Architecture snapshot

```
Client → Nginx :8080
           ├─ /api/auth/*   → identity:8080
           ├─ /api/trust/*  → device-trust:8081
           └─ /api/firmware/* → 503 (S4)
         Postgres 16  |  Redis 7 (revocation + AOF)
```

Eight-layer Zero Trust model remains the long-term north star; Genesis implements **Layer 1 Identity** and **Layer 2 Trust** with audit hooks into shared `security_audit_logs`.
