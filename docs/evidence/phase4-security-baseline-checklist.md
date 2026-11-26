# Phase 4 Security Baseline Checklist — Issue #58

**Recorded:** 2026-09-13  
**Last updated:** 2026-09-14  
**Tracking:** [#58](https://github.com/AcingTime420/Acing-IU-Genesis/issues/58)  
**Canonical branch:** `master`  
**Related:** #60, #61, #62, #63; AUTHZ-04 branch `fix/authz-04-device-ownership`

## Task map (Master To-Do 4.1–4.6)

| Task | Required evidence | Evidence in tree | Status |
|---|---|---|---|
| **4.1** Threat model | Versioned threat model | `docs/evidence/phase4-threat-model.md` v1.0 | **Met** |
| **4.2** Secret-management standard | Secret register metadata | `docs/evidence/phase4-secret-register.md` v1.0 | **Met** |
| **4.3** Authentication and session management | Lifecycle test matrix + evidence | `docs/evidence/phase4-auth-test-matrix.md` | **Partial** (unchanged by AUTHZ-04) |
| **4.4** Server-side authorization | RBAC/ABAC matrix + deny-path tests | Matrix v1.1; **AUTHZ-04 tests passing** (20 DeviceTrust unit tests) | **Partial** — AUTHZ-04 met; other AUTHZ IDs open |
| **4.5** Software supply-chain controls | SBOM, scanning, finding policy | finding policy + register | **Met** |
| **4.6** Unsupported-claim correction | Claim-surface lint | #63; claim-surface script | **Met** |

## Exit criteria

1. Threat model ✅  
2. Secret register ✅  
3. Auth test matrix with passing evidence ⏳  
4. Authorization matrix + deny-path evidence ⏳ (AUTHZ-04 verified; suite incomplete)  
5. Supply-chain finding policy ✅  
6. Claim-surface lint green ✅  

Issue #58 remains **open** until remaining AUTH and AUTHZ cases have evidence.
