# Threat Model — Acing-IU-Genesis (Phase 4, Task 4.1)

**Status:** Stub — full version pending  
**Last updated:** 2026-09-13  
**Tracking:** [#58](https://github.com/AcingTime420/Acing-IU-Genesis/issues/58)

> This document is the versioned threat model required by Phase 4 Task 4.1. It will be expanded to cover every component, data flow, trust boundary, abuse case, and prioritized mitigation. Until then, this stub records scope and the maturity of each area.

## Scope (components in scope)

| Component | Maturity | Notes |
|---|---|---|
| Frontend (Next.js) | Simulator / fixture | Operator UI; claim-surface lint enforced |
| API Gateway | Experimental | .NET service; Swagger disabled in production mode |
| Identity service | Experimental | Auth routes rate-limited; full session tests pending |
| DeviceTrust service | Experimental | Object-level auth closed (#61); attestation emulated |
| Audit service | Experimental | Durable replacement closed (#60); tenant scoping pending full evidence |
| Database (PostgreSQL) | Target | Schema exists; secrets must not be committed |
| Android / device agents | Target | No live hardware path yet |
| CI / supply chain | Partial | SBOM + scanning + pinned actions; digest pinning closed (#62) |
| AI providers (Gemini workflows) | Experimental | Dispatch/triage only; no data exfiltration path documented yet |
| Updates / OTA | Target | OTA testing doc exists; no live update channel |

## Trust boundaries (to be detailed)

1. Browser ↔ Gateway (HTTPS, auth token)
2. Gateway ↔ services (internal network, service auth)
3. Services ↔ database (connection string, least privilege)
4. Device agent ↔ DeviceTrust (attestation payload, signature verification — target)
5. CI ↔ repository (OIDC / token scope — target)

## Abuse cases (initial list)

- Credential stuffing / brute force on Identity login → mitigated by rate limiter (HTTP 429 probe evidence)
- Privilege escalation via missing object-level checks → mitigated by #61 closure
- Secret leakage via committed files → mitigated by Gitleaks + claim-surface lint
- Supply-chain compromise via mutable base images → mitigated by #62 digest pinning
- Overstated capability claims misleading operators → mitigated by #63 + CI lint

## Prioritized mitigations (initial)

| Priority | Mitigation | Status |
|---|---|---|
| P0 | Remove unsupported Knox/certification claims | Done (#63) |
| P0 | Fail-closed on vault/auth failure | Present in GuardianService; tests pending |
| P1 | Complete auth test matrix (replay, expiry, revocation, lockout) | Pending |
| P1 | Authorization matrix + deny-path tests | Partial (#61) |
| P2 | Full threat-model narrative with data-flow diagrams | Pending |
| P2 | Provenance / SLSA-style build attestation | Pending |

## Next steps

1. Expand each component row with concrete data flows and trust boundaries.
2. Add sequence diagrams for auth, attestation, and policy evaluation.
3. Link each abuse case to a test or control with evidence.
4. Review and date-stamp; move status from Stub to Reviewed.
