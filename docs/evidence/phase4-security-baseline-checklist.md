# Phase 4 Security Baseline Checklist — Issue #58

**Recorded:** 2026-09-13  
**Tracking:** [#58](https://github.com/AcingTime420/Acing-IU-Genesis/issues/58)  
**Canonical branch:** `master`  
**Related closed issues:** #60 (audit), #61 (object-level auth), #62 (container digests), #63 (claim surface)

## Task map (Master To-Do 4.1–4.6)

| Task | Required evidence | Evidence in tree | Status |
|---|---|---|---|
| **4.1** Threat model | Versioned threat model covering frontend, gateway, services, database, Android, CI, AI providers, updates; data flows, trust boundaries, abuse cases, prioritized mitigations | `docs/evidence/phase4-threat-model.md` | **In progress** (stub created; full version pending) |
| **4.2** Secret-management standard | Secret register (metadata only), ownership, approved destination, rotation rule, leak-response procedure | `docs/evidence/phase4-secret-register.md` | **In progress** (stub created; full register pending) |
| **4.3** Authentication and session management | Tests: success, replay, expiry, revocation, lockout, recovery, safe security events | Backend Identity tests + rate-limit probe (HTTP 429 on 11th/12th request) noted in #58 | **Partial** — probe evidence exists; full test matrix pending |
| **4.4** Server-side authorization | RBAC/ABAC matrix, deny-by-default enforcement, automated deny-path tests | #61 closed with deny-path integration tests; matrix doc pending | **Partial** — defect closed; matrix pending |
| **4.5** Software supply-chain controls | CI-published SBOM, dependency + secret scanning, pinned actions/bases, provenance, finding policy | `sbom.yml`, `security.yml`, SHA-pinned actions in `ci.yml`, #62 closed (digest pinning), **`docs/security/SUPPLY_CHAIN_FINDING_POLICY.md`**, `docs/evidence/supply-chain-finding-register.md` | **Met** — provenance (SLSA attestation) remains a post-baseline target |
| **4.6** Unsupported-claim correction | No public surface presents target/simulation/architecture as implemented/certified | #63 closed; `scripts/check-claim-surface.sh` in CI; `docs/CAPABILITY_REGISTER.md` | **Met** |

## Dependency status

| Issue | Topic | Status |
|---|---|---|
| #60 | Audit service durability / tenant boundary | Closed |
| #61 | DeviceTrust object-level authorization | Closed |
| #62 | Immutable container base digests | Closed |
| #63 | Unsupported Knox/certification/firmware claims | Closed |

All four blocking dependencies for Phase 4 are closed. Remaining work is documentary evidence and test-matrix completion.

## Exit criteria (proposed)

1. Threat model committed and reviewed.
2. Secret register committed (metadata only, no live secrets).
3. Auth test matrix documented with passing evidence.
4. Authorization matrix + deny-path test evidence linked.
5. Supply-chain finding policy documented. ✅ `docs/security/SUPPLY_CHAIN_FINDING_POLICY.md` + finding register
6. Claim-surface lint remains green in CI.

Until these are met, issue #58 remains **open**.
