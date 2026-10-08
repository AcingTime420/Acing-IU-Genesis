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
| SCF-2026-003 | npm audit (#135) | `next` | Critical | In progress | 2026-10-07 | N/A | Patched to 16.3.8 in unmerged #143; local audit clean; CI pending; historical evidence in [#143 register](https://github.com/AcingTime420/Acing-IU-Genesis/blob/90bb4f4647f3defd7f927e6809f442868ec9df70/docs/evidence/supply-chain-finding-register.md) | Maintainer | — |
| SCF-2026-004 | npm audit (#135) | `brace-expansion` (both original branches) | High | In progress | 2026-10-07 | N/A | Original branches patched in unmerged #143; local audit clean; CI pending; historical evidence in [#143 register](https://github.com/AcingTime420/Acing-IU-Genesis/blob/90bb4f4647f3defd7f927e6809f442868ec9df70/docs/evidence/supply-chain-finding-register.md) | Maintainer | — |
| SCF-2026-005 | npm audit (#135) | `sharp` / bundled librsvg | High | In progress | 2026-10-07 | N/A | Patched to 0.35.5 in unmerged #143; local audit clean; CI pending; historical evidence in [#143 register](https://github.com/AcingTime420/Acing-IU-Genesis/blob/90bb4f4647f3defd7f927e6809f442868ec9df70/docs/evidence/supply-chain-finding-register.md) | Maintainer | — |
| SCF-2026-006 | npm audit (#135) | `source-map-js` | High | In progress | 2026-10-07 | N/A | Patched to 1.2.2 in unmerged #143; local audit clean; CI pending; historical evidence in [#143 register](https://github.com/AcingTime420/Acing-IU-Genesis/blob/90bb4f4647f3defd7f927e6809f442868ec9df70/docs/evidence/supply-chain-finding-register.md) | Maintainer | — |
| SCF-2026-007 | npm audit (#135) | `braces` via Tailwind and Next ESLint | High | In progress | 2026-10-07 | N/A | Both affected paths removed in unmerged #143; not an upstream `braces` patch; CI pending; historical evidence in [#143 register](https://github.com/AcingTime420/Acing-IU-Genesis/blob/90bb4f4647f3defd7f927e6809f442868ec9df70/docs/evidence/supply-chain-finding-register.md) | Maintainer | — |
| SCF-2026-008 | npm audit (#135) | `postcss-selector-parser` via Tailwind | Medium | In progress | 2026-10-07 | N/A | Affected package removed with Tailwind 4 in unmerged #143; CI pending; historical evidence in [#143 register](https://github.com/AcingTime420/Acing-IU-Genesis/blob/90bb4f4647f3defd7f927e6809f442868ec9df70/docs/evidence/supply-chain-finding-register.md) | Maintainer | — |
| SCF-2026-009 | Manual review (#130) | Frontend ESLint coverage removed during config migration (React, Hooks, accessibility, Next.js) | Medium | In progress | 2026-10-08 | N/A | Prior rule coverage and severities restored on unmerged #130 branch; JS/JSX/TS/TSX comparison and Node 22 validation; review pending | Maintainer | — |

Finding IDs SCF-2026-003 through SCF-2026-008 and their detailed historical npm-audit evidence are reconciled with the latest unmerged PR #143 register. Their in-progress status reflects that its dependency remediation has not been merged; SCF-2026-009 separately tracks the lint-coverage regression on PR #130.

## Accepted exceptions

| Finding ID | Source | Component | Severity | Status | Detected | Remediated | Evidence | Owner | Exception expiry |
|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | — |

*No accepted exceptions at baseline. Any future acceptance must follow §6 of the finding policy.*

## Review log

| Date | Reviewer | Notes |
|---|---|---|
| 2026-09-13 | Maintainer | Register created alongside finding policy; two remediated findings backfilled from closed blockers #62 and #63. |
| 2026-10-08 | Contributor (#130) | Reconciled finding IDs 003–008 with unmerged #143; tracked the lint-coverage regression as SCF-2026-009 and restored prior enabled-rule coverage pending review and merge. |
