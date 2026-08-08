# Acing IU: Genesis — Implementation Readiness Package (IRP) v1.0

**Status:** Approved for implementation  
**Classification:** Genesis Foundation v1.0  
**Date:** 2026-07-25  
**Scope:** Identity (S2), Device Trust (S3), SharedKernel, Docker control plane, Windows installer packaging  

This package is the single source of truth for engineers starting implementation. Every artifact is cross-referenced; no architectural redesign is required to begin coding.

---

## Package contents

| # | Folder | Purpose |
|---|--------|---------|
| 00 | [00-overview](00-overview/) | Executive summary, scope, DoD, glossary |
| 01 | [01-repo-structure](01-repo-structure/) | Canonical monorepo layout |
| 02 | [02-database](02-database/) | Final PostgreSQL migrations |
| 03 | [03-openapi](03-openapi/) | OpenAPI 3.1 for Identity & Device Trust |
| 04 | [04-infrastructure](04-infrastructure/) | Docker Compose, Nginx, Redis, health model |
| 05 | [05-ci-cd](05-ci-cd/) | GitHub Actions workflows |
| 06 | [06-configuration](06-configuration/) | appsettings, compose env binding |
| 07 | [07-environment](07-environment/) | Environment matrix & secrets |
| 08 | [08-standards](08-standards/) | Coding standards & Definition of Done |
| 09 | [09-adrs](09-adrs/) | Architecture Decision Records |
| 10 | [10-security](10-security/) | Threat model (STRIDE) |
| 11 | [11-testing](11-testing/) | Test strategy & coverage gates |
| 12 | [12-deployment](12-deployment/) | Deployment guide |
| 13 | [13-operations](13-operations/) | Runbooks |
| 14 | [14-dependencies](14-dependencies/) | Dependency map |

**Existing implementation aligned with this IRP:**

- `artifacts/backend/` — Identity, DeviceTrust, SharedKernel  
- `artifacts/infrastructure/` — Compose, Postgres init, Nginx, scripts  
- `artifacts/installer/` — Inno + NSIS packaging  

---

## Quick start for developers

```bash
# 1. Materialize repo from IRP layout (01-repo-structure)
# 2. Copy infrastructure + backend from artifacts
# 3. Configure secrets
cp infrastructure/.env.example infrastructure/.env
# Edit JWT_SIGNING_KEY (≥32 chars), POSTGRES_PASSWORD, REDIS_PASSWORD

# 4. Boot stack
cd infrastructure && docker compose up -d --build

# 5. Smoke
./scripts/smoke-auth.sh
```

See [12-deployment/DEPLOYMENT.md](12-deployment/DEPLOYMENT.md).

---

## Consistency rules

1. API paths match OpenAPI and Nginx route table.  
2. Schema object names match migrations and C# models.  
3. JWT issuer/audience identical across Identity and Device Trust.  
4. Trust score weights match ADR-0004 and Device Trust engine.  
5. CI gates match coding standards DoD.  

**Document control:** IRP-GENESIS-1.0 · Next review: after S4 Firmware kickoff  
