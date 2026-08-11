# Implementation checklist — start coding

## Day 0 — materialize

- [ ] Create GitHub repo / org per layout in `01-repo-structure`  
- [ ] Copy `backend/`, `infrastructure/`, `installer/` from artifacts  
- [ ] Copy IRP to `docs/irp/`  
- [ ] Copy workflows from `05-ci-cd/` to `.github/workflows/`  
- [ ] Sync `02-database/migrations` → `infrastructure/postgres/init/`  

## Day 1 — run

- [ ] Configure `.env` from `07-environment/env.example`  
- [ ] `docker compose up -d --build`  
- [ ] Smoke test green  

## Day 2 — harden

- [ ] Add xUnit projects per `11-testing`  
- [ ] Wire CI secrets scan + build  
- [ ] Confirm OpenAPI matches controllers  

## Do not block on

- Firmware service  
- YARP migration  
- UMUI installer skin  
- Multi-region  

Architecture is a **candidate baseline for Genesis v1.0** (pending local build, smoke test, and audit completion). New ADRs only for deviations.

## Governance status (post Phase-1 audit)

- Status: **Architecture candidate: Genesis v1.0**
- Implementation baseline: **Pending validation** (build + unit tests + smoke)
- Do not treat as frozen until audit Phases 2+ and a successful local `dotnet test` + compose smoke pass.
