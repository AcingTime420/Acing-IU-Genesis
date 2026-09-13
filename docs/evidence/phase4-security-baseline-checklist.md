# Phase 4 Security Baseline Checklist — Issue #58

**Recorded:** 2026-09-13  
**Last updated:** 2026-09-13  
**Tracking:** [#58](https://github.com/AcingTime420/Acing-IU-Genesis/issues/58)  
**Canonical branch:** `master`  
**Related closed issues:** #60 (audit), #61 (object-level auth), #62 (container digests), #63 (claim surface)

## Task map (Master To-Do 4.1–4.6)

| Task | Required evidence | Evidence in tree | Status |
|---|---|---|---|
| **4.1** Threat model | Versioned threat model covering frontend, gateway, services, database, Android, CI, AI providers, updates; data flows, trust boundaries, abuse cases, prioritized mitigations | `docs/evidence/phase4-threat-model.md` **v1.0** | **Met** |
| **4.2** Secret-management standard | Secret register (metadata only), ownership, approved destination, rotation rule, leak-response procedure | `docs/evidence/phase4-secret-register.md` **v1.0** | **Met** |
| **4.3** Authentication and session management | Tests: success, replay, expiry, revocation, lockout, recovery, safe security events | Backend Identity unit tests (MFA/protector); rate-limit probe (HTTP 429) on #58; full lifecycle matrix not yet committed | **Partial** |
| **4.4** Server-side authorization | RBAC/ABAC matrix, deny-by-default enforcement, automated deny-path tests | #61 closed with deny-path integration intent; dedicated matrix document still pending | **Partial** |
| **4.5** Software supply-chain controls | CI-published SBOM, dependency + secret scanning, pinned actions/bases, provenance, finding policy | `sbom.yml`, `security.yml`, #62, `docs/security/SUPPLY_CHAIN_FINDING_POLICY.md`, finding register | **Met** (SLSA attestation = post-baseline target) |
| **4.6** Unsupported-claim correction | No public surface presents target/simulation/architecture as implemented/certified | #63 closed; claim-surface lint; `docs/CAPABILITY_REGISTER.md` | **Met** |

## Dependency status

| Issue | Topic | Status |
|---|---|---|
| #60 | Audit service durability / tenant boundary | Closed |
| #61 | DeviceTrust object-level authorization | Closed |
| #62 | Immutable container base digests | Closed |
| #63 | Unsupported Knox/certification/firmware claims | Closed |

## Exit criteria

1. Threat model committed and reviewed. ✅ v1.0  
2. Secret register committed (metadata only). ✅ v1.0  
3. Auth test matrix documented with passing evidence. ⏳  
4. Authorization matrix + deny-path test evidence linked. ⏳  
5. Supply-chain finding policy documented. ✅  
6. Claim-surface lint remains green in CI. ✅  

Until 3 and 4 are met, issue #58 remains **open**.
