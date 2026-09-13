# Supply-Chain Finding Register — Acing-IU-Genesis

**Status:** Active  
**Last reviewed:** 2026-09-13  
**Policy:** `docs/security/SUPPLY_CHAIN_FINDING_POLICY.md`  
**Tracking:** Phase 4 Task 4.5 · [#58](https://github.com/AcingTime420/Acing-IU-Genesis/issues/58)

> Metadata only. No secret values. Each row is a detected or accepted supply-chain finding.

## Open / tracked findings

| Finding ID | Source | Component | Severity | Status | Detected | Remediated | Evidence | Owner | Exception expiry |
|---|---|---|---|---|---|---|---|---|---|
| SCF-2026-001 | Manual review (#62) | Container base images (`mcr.microsoft.com/dotnet/*`, `postgres:16-alpine`) | High | Remediated | 2026-08-17 | 2026-08-17 | #62 closed; digest pinning + CI lint | Maintainer | — |
| SCF-2026-002 | Manual review (#63) | Frontend Knox/certification claim language | High | Remediated | 2026-08-17 | 2026-09-13 | #63 closed; `scripts/check-claim-surface.sh` | Maintainer | — |

## Accepted exceptions

| Finding ID | Source | Component | Severity | Status | Detected | Remediated | Evidence | Owner | Exception expiry |
|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | — |

*No accepted exceptions at baseline. Any future acceptance must follow §6 of the finding policy.*

## Review log

| Date | Reviewer | Notes |
|---|---|---|
| 2026-09-13 | Maintainer | Register created alongside finding policy; two remediated findings backfilled from closed blockers #62 and #63. |
