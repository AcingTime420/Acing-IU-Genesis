# Supply-Chain Finding Register — Acing-IU-Genesis

**Status:** Active  
**Last reviewed:** 2026-10-08  
**Policy:** `docs/security/SUPPLY_CHAIN_FINDING_POLICY.md`  
**Tracking:** Phase 4 Task 4.5 · [#58](https://github.com/AcingTime420/Acing-IU-Genesis/issues/58)

> Metadata only. No secret values. Each row is a detected or accepted supply-chain finding.

## Open / tracked findings

| Finding ID | Source | Component | Severity | Status | Detected | Remediated | Evidence | Owner | Exception expiry |
|---|---|---|---|---|---|---|---|---|---|
| SCF-2026-001 | Manual review (#62) | Container base images (`mcr.microsoft.com/dotnet/*`, `postgres:16-alpine`) | High | Remediated | 2026-08-17 | 2026-08-17 | #62 closed; digest pinning + CI lint | Maintainer | — |
| SCF-2026-002 | Manual review (#63) | Frontend Knox/certification claim language | High | Remediated | 2026-08-17 | 2026-09-13 | #63 closed; `scripts/check-claim-surface.sh` | Maintainer | — |
| SCF-2026-003 | npm audit (#135) | `next` | Critical | Remediated | 2026-10-07 | 2026-10-08 | Follow-up #143 only; advisory and validation details below | Maintainer | — |
| SCF-2026-004 | npm audit (#135) | `brace-expansion` (both installed branches) | High | Remediated | 2026-10-07 | 2026-10-08 | Follow-up #143 only; advisory and validation details below | Maintainer | — |
| SCF-2026-005 | npm audit (#135) | `sharp` / bundled librsvg | High | Remediated | 2026-10-07 | 2026-10-08 | Follow-up #143 only; advisory and validation details below | Maintainer | — |
| SCF-2026-006 | npm audit (#135) | `source-map-js` | High | Remediated | 2026-10-07 | 2026-10-08 | Follow-up #143 only; advisory and validation details below | Maintainer | — |
| SCF-2026-007 | npm audit (#135) | `braces` via Tailwind and Next ESLint | High | Open | 2026-10-07 | N/A | GHSA-vfj7-8cjw-p6xm; no published patch; migration decision below | Maintainer | — |
| SCF-2026-008 | npm audit (#135) | `postcss-selector-parser` via Tailwind | Medium | Open | 2026-10-07 | N/A | GHSA-rj75-hqrm-r3gf; nonblocking; patched 7.1.6 is outside parent ranges | Maintainer | — |

### PR #135 npm audit investigation — 2026-10-08

**Scope:** isolated detached checkout of full head `89e2db8f9ee7964c7c6262e26f0c303913d120eb`, fetched and verified through the PR API before investigation and rechecked before updates. This remediation is delivered through **follow-up #143**, whose assigned branch is based on `master`, not by updating #135. Its original manifest, lockfile, and register match those at the investigated head. Only the targeted lockfile patch and this evidence are carried over; #135's unrelated changes are not incorporated. **#135 itself is not fixed**, and no PR was merged or review thread resolved.

**Historical evidence:** the full [job 112956171186 log](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37668471236/job/112956171186) was retrieved, superseding the earlier footer-only excerpt. Job and run APIs agree on run **37668471236**, attempt 2, head SHA above, and `.github/workflows/security.yml`; the previously supplied run ID 102047414672 is not supported by those APIs. Setup output records **Node v22.23.3 / npm 10.9.9**. Installation succeeded (479 packages); audit exited 1 with 2 moderate, 10 high, 1 critical package entries. The log also shows Actions actually checked out merge ref `3e26e72010c370dc187678c10dd2d019e9b95eb7`; this investigation deliberately reproduces the requested head, not that merge commit.

**Reproduction:** Node v22.23.3 with its bundled npm 10.9.9, default `https://registry.npmjs.org/`, complete committed npm v3 lockfile, including dev dependencies. No repository `.npmrc`, `.nvmrc`, `.node-version`, npm pin, or engines declaration was found. Both frontend workflows request Node 22. Original clean `npm ci` exited 0; `npm audit --json` and `npm audit --audit-level=high` each exited 1 with advisory data, no npm error object, and no registry/auth/network/peer/engine/integrity errors. Current audit adds six Next advisories absent from the historical log; they are explicitly marked below. Counts are package/meta-vulnerability entries, **not distinct advisories**: the current baseline has 14 distinct GHSAs, of which 7 are high/critical.

#### Advisory / patch table

Ranges are for the installed release branches. Links identify the authoritative GitHub advisories; patch availability and dependency ranges were also checked against version-specific npm registry metadata. All packages below are **transitive** except direct `next`. “Historical” means present in the retrieved job log; “Current only” means first observed in this reproduction.

| Advisory | Severity / title | Installed version; vulnerable range | Earliest applicable patch | Observation / result |
|---|---|---|---|---|
| [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | High — brace-expansion parseCommaParts recursion stack exhaustion | 1.1.18: `<1.1.19`; 5.0.9: `>=4.0.0 <5.0.10` | 1.1.19 / 5.0.10 | Historical; removed |
| [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | High — brace-expansion nested-group recursion stack exhaustion | 1.1.18: `<1.1.20`; 5.0.9: `>=4.0.0 <5.0.11` | 1.1.20 / 5.0.11 | Historical; removed |
| [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | Moderate (nonblocking) — brace-expansion quadratic `{a},b}` rewrite CPU DoS | 1.1.18: `<1.1.21`; 5.0.9: `>=4.0.0 <5.0.12` | 1.1.21 / 5.0.12 | Historical; removed by same targeted branch patches |
| [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | High — braces deeply nested pattern stack-exhaustion DoS | 3.0.3; `<=3.0.3` (audit displays `*`) | **None published** | Historical; still blocking |
| [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j) | Critical — Next.js RCE in next/og ImageResponse | 16.3.5; `>=16.2.0 <16.3.6` | 16.3.6 | Historical; removed |
| [GHSA-cjq9-62q9-8jv4](https://github.com/advisories/GHSA-cjq9-62q9-8jv4) | High — Next.js Image Optimization SSRF | 16.3.5; `>=16.0.0 <16.3.8` | 16.3.8 | Current only; removed; necessitates 16.3.8 rather than 16.3.6 |
| [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) | High — sharp bundled librsvg use-after-free, CVE-2026-96889 | 0.35.4; `<0.35.5` | 0.35.5 | Historical; removed |
| [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | High — source-map-js indexed section-offset event-loop DoS | 1.2.1; `>=1.0.0 <1.2.2` | 1.2.2 | Historical; removed |
| [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) | Moderate (nonblocking) — PostCSS flat-selector quadratic CPU exhaustion | 6.1.4; `<7.1.6` | 7.1.6 (major boundary) | Historical; remains open |
| [GHSA-3w37-wq28-93x7](https://github.com/advisories/GHSA-3w37-wq28-93x7) | Moderate (nonblocking) — Next.js pending use-cache fill leaks Draft Mode content | 16.3.5; `>=16.3.0 <16.3.8` | 16.3.8 | Current only; removed |
| [GHSA-4jqv-mc3x-m676](https://github.com/advisories/GHSA-4jqv-mc3x-m676) | Moderate (nonblocking) — Next.js self-hosted SSG/ISR cache poisoning | 16.3.5; `>=16.0.0 <16.3.8` | 16.3.8 | Current only; removed |
| [GHSA-39w2-rjm5-chcv](https://github.com/advisories/GHSA-39w2-rjm5-chcv) | Low (nonblocking) — Next.js development MCP endpoint information disclosure | 16.3.5; `>=16.0.0 <16.3.8` | 16.3.8 | Current only; removed |
| [GHSA-f87g-xv8r-7p7x](https://github.com/advisories/GHSA-f87g-xv8r-7p7x) | Moderate (nonblocking) — Next.js metadata image dynamicParams bypass information disclosure | 16.3.5; `>=16.0.0 <16.3.8` | 16.3.8 | Current only; removed |
| [GHSA-mcj8-r9mp-w47p](https://github.com/advisories/GHSA-mcj8-r9mp-w47p) | Moderate (nonblocking) — Next.js SSG/ISR cross-user cache substitution / persistent DoS | 16.3.5; `>=16.0.0 <16.3.8` | 16.3.8 | Current only; removed |

#### Affected dependency paths

Derived from original `npm explain … --json`, `npm ls … --all`, and the full lockfile. Alternatives in braces expand to separate complete declared dependency paths, not additional advisories. Peer relationships reuse the shared ESLint/PostCSS instances; they do not represent additional installed vulnerable copies.

- **brace-expansion 1.1.18** (`node_modules/brace-expansion`):
  - frontend → eslint 9.39.5 → minimatch 3.1.5 → brace-expansion 1.1.18
  - frontend → eslint 9.39.5 → {@eslint/config-array 0.21.2, @eslint/eslintrc 3.3.6} → minimatch 3.1.5 → brace-expansion 1.1.18
  - frontend → eslint-config-next 16.3.0 → {eslint-plugin-import 2.32.0, eslint-plugin-jsx-a11y 6.10.2, eslint-plugin-react 7.37.5} → minimatch 3.1.5 → brace-expansion 1.1.18
- **brace-expansion 5.0.9** (`node_modules/@typescript-eslint/typescript-estree/node_modules/brace-expansion`): frontend → eslint-config-next 16.3.0 → typescript-eslint 8.67.0 → each of the following → minimatch 10.2.6 → brace-expansion 5.0.9 (all @typescript-eslint packages are 8.67.0):
  - @typescript-eslint/typescript-estree
  - @typescript-eslint/parser → @typescript-eslint/typescript-estree
  - @typescript-eslint/utils → @typescript-eslint/typescript-estree
  - @typescript-eslint/eslint-plugin → @typescript-eslint/utils → @typescript-eslint/typescript-estree
  - @typescript-eslint/eslint-plugin → @typescript-eslint/type-utils → @typescript-eslint/typescript-estree
  - @typescript-eslint/eslint-plugin → @typescript-eslint/type-utils → @typescript-eslint/utils → @typescript-eslint/typescript-estree
- **braces 3.0.3** (`node_modules/braces`):
  - frontend → tailwindcss 3.4.19 → chokidar 3.6.0 → braces 3.0.3
  - frontend → tailwindcss 3.4.19 → micromatch 4.0.8 → braces 3.0.3
  - frontend → tailwindcss 3.4.19 → fast-glob 3.3.3 → micromatch 4.0.8 → braces 3.0.3
  - frontend → eslint-config-next 16.3.0 → @next/eslint-plugin-next 16.3.0 → fast-glob 3.3.1 → micromatch 4.0.8 → braces 3.0.3
- **Next / sharp:** frontend → next 16.3.5 (`node_modules/next`); frontend → next 16.3.5 → sharp 0.35.4 (`node_modules/sharp`, optional dependency installed on Linux).
- **source-map-js 1.2.1** (`node_modules/source-map-js`):
  - frontend → next 16.3.5 → postcss 8.5.23 → source-map-js 1.2.1
  - frontend → postcss 8.5.26 → source-map-js 1.2.1
  - frontend → tailwindcss 3.4.19 → postcss 8.5.26 → source-map-js 1.2.1
  - Shared postcss 8.5.26 also satisfies peers of direct autoprefixer 10.5.4 and Tailwind's postcss-import 15.1.0, postcss-js 4.1.0, postcss-load-config 6.0.1, and postcss-nested 6.2.0.
- **postcss-selector-parser 6.1.4** (`node_modules/postcss-selector-parser`): frontend → tailwindcss 3.4.19 → postcss-selector-parser 6.1.4; frontend → tailwindcss 3.4.19 → postcss-nested 6.2.0 → postcss-selector-parser 6.1.4.

#### Compatible changes and unresolved decision

Only `frontend/package-lock.json` changes: next **16.3.5 → 16.3.8**, brace-expansion **1.1.18 → 1.1.21** and **5.0.9 → 5.0.12**, sharp **0.35.4 → 0.35.5**, source-map-js **1.2.1 → 1.2.2**. Required @next/env and all @next/swc binaries follow **16.3.5 → 16.3.8**; @img/sharp binaries follow **0.35.4 → 0.35.5** and their libvips packages **1.3.3 → 1.3.4**. No unrelated package records change.

All targets satisfy existing manifest/parent ranges (`next ^16.3.0`, minimatch's brace-expansion `^1.1.7` / `^5.0.8`, Next's sharp `^0.35.4`, PostCSS's source-map-js `^1.2.1`). npm 10.9.9 generated the lockfile, registry URLs and integrity values; lockfile v3 and the manifest are preserved. eslint-config-next stays 16.3.0 because alignment is not required for these fixes.

**Decision required, not applied:** braces has no published patched release (latest 3.0.3; GHSA patched version is null). Tailwind **3 → 4** removes its three affected paths: published 4.0.0 already omits them, while audit recommends 4.3.3. This requires the v4 PostCSS plugin (`@tailwindcss/postcss`) and CSS/config migration, not a compatible lockfile patch. Independently, even [@next/eslint-plugin-next 16.4.0](https://registry.npmjs.org/@next/eslint-plugin-next/16.4.0) still pins fast-glob 3.3.1, so a Tailwind upgrade alone does **not** clear the audit. No fixed Next ESLint parent was verified; an upstream fix or separately approved maintained replacement is needed. The moderate selector-parser fix 7.1.6 also crosses Tailwind/postcss-nested's 6.x ranges. No forced upgrade, override, accepted exception, omitted dev dependencies, or weakened check is introduced.

The JSON audit instead proposes **eslint-config-next 16.3.0 → 14.2.35**, a breaking downgrade marked `isSemVerMajor: true`. Its [plugin uses glob rather than fast-glob](https://registry.npmjs.org/@next/eslint-plugin-next/14.2.35), but [the config requires ESLint 7/8](https://registry.npmjs.org/eslint-config-next/14.2.35), incompatible with this project's ESLint `^9.35.0`. This proposal was not applied and is not a compatible forward upgrade.

#### Validation results

Performed with Node v22.23.3 / npm 10.9.9 in the exact-head worktree after applying the patch. The follow-up lockfile is byte-for-byte identical to that validated file; frontend sources are unchanged between the two starting checkouts. Complete stdout, stderr, JSON reports, explain/ls output, and individual exit-code files were retained separately under `/tmp/pr135-reports/` for this session (temporary evidence, not committed CI artifacts).

| Command / check | Exit / result |
|---|---|
| Original `npm ci` | 0; 479 packages installed |
| Original `npm audit --json` | 1; no error object; 2 moderate / 10 high / 1 critical package entries |
| Original `npm audit --audit-level=high` | 1; confirmed vulnerabilities, not installation/network errors |
| Updated clean `npm ci` | 0 |
| `CI=true npm run lint --if-present` | 0; 19 unused-variable warnings in unchanged application sources, no errors |
| `CI=true npm test --if-present` | 0 **no-op**; no frontend test script or existing frontend test suite; not a passing test suite |
| `npm run build --if-present` | 0; Next 16.3.8 production build and TypeScript check succeed |
| Updated `npm audit --json` | 1; no error object; 2 moderate / 7 high / 0 critical package entries |
| Updated `npm audit --audit-level=high` | **1, still blocked** by GHSA-vfj7-8cjw-p6xm |
| Production `npm run start`, loopback requests to `/`, `/audit`, `/devices`, `/rootmaster`, `/users` | All HTTP 200 |
| Manifest/lock root comparison, lockfile version, focused diff / whitespace check | Synchronized, v3, only targeted package families; no generated artifacts |
| Automated review / CodeQL validator | Review binary unavailable; CodeQL found no analyzable source changes and performed no analysis |
| Fallback read-only dependency diff review | No significant issues found |

Remaining **distinct** advisories: high GHSA-vfj7-8cjw-p6xm (`braces`, plus chokidar/micromatch/fast-glob/@next/eslint-plugin-next/eslint-config-next/tailwindcss meta-vulnerabilities); moderate GHSA-rj75-hqrm-r3gf (`postcss-selector-parser`, plus postcss-nested meta-vulnerability). No critical, low, or info package entries remain. Audit retrieval succeeded; the nonzero result is an unresolved vulnerability, not an environmental limitation. This is a compatible **partial remediation**, not a green audit or a fix already present in #135.

## Accepted exceptions

| Finding ID | Source | Component | Severity | Status | Detected | Remediated | Evidence | Owner | Exception expiry |
|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | — |

*No accepted exceptions at baseline. Any future acceptance must follow §6 of the finding policy.*

## Review log

| Date | Reviewer | Notes |
|---|---|---|
| 2026-09-13 | Maintainer | Register created alongside finding policy; two remediated findings backfilled from closed blockers #62 and #63. |
| 2026-10-08 | Contributor (#143) | Investigated #135 at its exact head; compatible partial dependency remediation validated; braces blocker and moderate selector-parser finding remain open, with breaking changes awaiting a separate decision. |
