# Supply-Chain Finding Register — Acing-IU-Genesis

**Status:** Active  
**Last reviewed:** 2026-10-10

**Policy:** `docs/security/SUPPLY_CHAIN_FINDING_POLICY.md`  
**Tracking:** Phase 4 Task 4.5 · [#58](https://github.com/AcingTime420/Acing-IU-Genesis/issues/58)

> Metadata only. No secret values. Each row is a detected or accepted supply-chain finding.

**Current scope:** PR #143 is draft and unmerged. The executed PR workflows passed the full npm audit, lint, production build, backend tests, container builds, claim-surface validation, limited-range secret scan, and SBOM generation. These results are not remediation on `master` or in PR #135. Findings below retain the policy's **In progress** status until maintainer review and integration; removal of a dependency path is recorded separately from upstream fixes and closure.

## Current implementation and evidence reconciliation — 2026-10-10

### Inspected source and executed GitHub results

The refreshed source head is **`cc7ae5b6c3ebb413f0f0d5d10f20ac904e0bc7a3`**, unchanged from the prior local review. The refreshed base is **`3d22e3c20abbe9e8cd3e168b4e4a8d800d17f7c7`**. Source inspection confirms Tailwind **3.4.19 → 4.3.3**, the v4 PostCSS plugin, removal of separate Autoprefixer/configuration, CSS theme tokens and migrated templates. `eslint-config-next` remains 16.3.0, with the official **`@next/eslint-plugin-next@14.2.35`** compatibility override, **`glob@10.5.0`** override, `@eslint/compat`, and local navigation rules in `frontend/lint/next-navigation.mjs`. This is not a compatible lockfile-only repair or a demonstrated identical Next 16 implementation.

The four PR-triggered runs below completed successfully on **attempt 2** on 2026-10-10. Their API head is the source head above, but every checkout log identifies synthetic PR merge commit **`f905537226ff5502339cac354cffd06b9654528d`**. Its parents are the refreshed base and head. Both head and merge commit have Git tree **`fee06a7635250d34163710b50736db9817daa219`**: source equivalence for these runs, not identical commit provenance.

| Executed workflow | Run | Observed results |
|---|---|---|
| CI — Clean-Clone Baseline | [37839236330](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37839236330/attempts/2) | `npm ci` passed (470 installed / 471 audited); `npm run lint --if-present` passed with 0 errors / 19 warnings; `npm run build --if-present` passed compilation, TypeScript and seven static pages; backend build and 6/6 plus 15/15 tests passed; Gateway and frontend container builds exported images; `bash scripts/check-claim-surface.sh` passed. |
| Repository Integrity | [37839236592](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37839236592/attempts/2) | No tracked generated artifacts detected. |
| Security and Dependency Review | [37839236433](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37839236433/attempts/2) | `npm ci` and **full `npm audit --audit-level=high` passed with zero reported vulnerabilities**, without omitting dev dependencies. Dependency review found no high-or-higher vulnerabilities; .NET audit reported no vulnerable packages from its configured sources. Gitleaks passed its PR range. |
| Generate SBOM | [37839236597](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37839236597/attempts/2) | Downloaded and parsed `acing-iu-genesis-sbom`: SPDX-2.3, Syft 1.42.3, 171 packages / 15 file records. Inventory generation is not proof of dependency safety or exhaustive coverage. |

All executed jobs' token-permission logs report **contents read / metadata read**. Security explicitly passes `GITHUB_TOKEN` to Gitleaks. There are no OIDC, inherited secrets, or broader write permissions in these four workflow families.

Important scope limits:

- Frontend `npm test --if-present` was a **no-op**, not a passed frontend test suite; no test script exists.
- `bash scripts/validate-premerge.sh --skip-compose` completed, but **Compose and endpoint checks were skipped**. It is not an executed deployment or HTTP integration test.
- Gitleaks 8.24.3 used `--no-merges --first-parent 13d32b1a1fb729a1d8aedf9aaaf5a599cacddcb7^..cc7ae5b6c3ebb413f0f0d5d10f20ac904e0bc7a3`: eight commits / approximately 119.56 KB, no leaks. The downloaded SARIF-2.1.0 artifact has zero results. Full-history checkout did not make this a full-history scan.
- CI and Integrity had no published artifacts; their logs were inspected. Security's SARIF and SBOM's JSON were downloaded and parsed. A green check or generated SBOM is not an unqualified safety claim.
- Historical pending-run statements below describe their checkpoints. Separate push runs [37839228463](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37839228463) and [37839228600](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37839228600) still have `action_required` and no executed jobs; duplicate push runs are **not** additional merge requirements established by the effective rules.

### Explicit corrections and local compatibility evidence

**Withdrawn:** the unsupported Tailwind literal-only restriction and quotation. Tailwind's [Referencing other variables](https://tailwindcss.com/docs/theme#referencing-other-variables) documents `@theme inline` for variable references. The prior local generated-CSS/browser fixtures at the source head above showed working root-level runtime colors; nested alias scoping was a separate synthetic-fixture limitation, not a reproduced current application defect.

**Withdrawn:** the claim that `no-async-client-component` is missing. Direct inspection and execution of the locked 14.2.35 plugin found it enabled as a warning (`[1]`) and reporting default async declarations, indirect default exports, and default-exported async arrows. A named async export produced no diagnostic in both tested 14.2.35 and 16.3.0 plugins. That is a shared limitation, not a demonstrated downgrade regression. Warnings allow normal ESLint exit 0; `--max-warnings=0` exits 1 for the default-export fixture. No replacement rule or severity change was introduced.

Those prior tests used **Node 24.18.0 / npm 11.16.0 on Windows**, not GitHub CI. Commands were an isolated `npm ci --no-audit --no-fund --ignore-scripts`, `node ...\verify.cjs lint`, `node ...\verify.cjs css` (both exit 0), and `node ...\named-client-enforcement.cjs` (expected assertion failure, exit 1). Session evidence includes `verify.cjs`, `eslint-results.json`, `css-results.json`, `actual-generated.css`, `original-fixture.css`, `inline-fixture.css`, and `named-client-enforcement.cjs`. The original two-version comparison was an inline `Linter.verify` probe whose raw result is in the session conversation (shellId 26), not a separately saved original comparison file.

This reconciliation executed a **controlled configuration comparison** at the same source head: original base flat configuration plus official Next plugin 16.3.0, versus current flat configuration plus 14.2.35 and local navigation rules. Other packages were held at head-lock versions; this is not a fresh installation of the complete original dependency tree. Both `node ...\compare-lint.cjs original` and `node ...\compare-lint.cjs replacement` completed with exit 0. Full effective rule maps and severities matched, including Core Web Vitals errors and the async-client warning. Of 21 representative fixtures, 20 had matching Next rule IDs/severities.

**Observed behavior difference, not parity:** the local rule reported the App Router `<a href="/devices">` fixture at error severity, while the tested official 16.3.0 rule did not. Inspecting that official rule's URL helper showed `^/devices$`, while its href normalization produces `/devices/`. Thus equal effective settings do not establish equal route behavior. The shared named-export and unknown template-destination limitations remain. Earlier documented differential-probe counts below are historical agent reports, not independent proof of complete compatibility.

### Current-head browser execution and focused defect proposals

An isolated archive of the exact source head was installed with `npm ci --no-audit --no-fund --cache ...` (exit 0; 461 packages on Windows) and built with `npm run build` (exit 0; seven static pages), using Node 24.18.0 / npm 11.16.0. npm reported the `unrs-resolver` install script was not approved by the local allow-scripts policy; this run is not described as a pristine Linux CI installation. Local `npm run lint` passed with 19 warnings and `npm audit --audit-level=high` passed with zero vulnerabilities. A production server was checked responsive before browser execution and stopped afterward.

Playwright executed fresh navigations with Chromium **154.0.4258.62**, timezone **America/Los_Angeles**, at **1440×1000 and 390×1000**:

| Check | Executed observation | Limitation / proposal |
|---|---|---|
| `/`, `/users`, `/devices`, `/audit`, `/rootmaster` | All ten route/viewport navigations returned HTTP 200. | A route response is not complete interaction coverage; RootMaster renders its unavailable state. |
| Hydration | `/audit` emitted React text-hydration error #418 at both widths; no captured page error on the other tested navigations. | Confirmed current defect. The earlier controlled before/after comparison documented it before migration; this turn did not rebuild the original frontend, so migration attribution remains unverified. Proposed focused follow-up: isolate the mismatch, then use deterministic/timezone-explicit fixture dates and generate export timestamps on the export action rather than during server/client rendering. No fix applied. |
| Desktop colors and navigation | Body/sidebar `rgb(11,15,25)`, active link `rgb(47,88,205)`, glass card `rgba(21,29,48,0.7)`; hover reached `rgb(21,29,48)` / white; clicking Users navigated to `/users`. | These selected samples are not exhaustive visual parity. |
| Runtime theming | Root `--background` / `--foreground` updates produced body `rgb(34,51,68)` / `rgb(221,238,255)`. After waiting for its transition, `--color-royalBlue` update produced active-link `rgb(18,52,86)`. | Actual current runtime token updates work; no literals substituted and no theming change applied. |
| Responsive layout | At 390px, sidebar remained 256px; main client width 119px versus scroll width 334px, with horizontal `auto` overflow. | Confirmed narrow-main horizontal overflow, not a mobile-layout pass. The same width/layout classes exist in base source, but no baseline mobile execution occurred here. Proposed focused follow-up: compare baseline, then review breakpoint-aware sidebar/header layout and minimum widths without redesigning the UI. No fix applied. |

Session-local outputs include `lint-original.json`, `lint-replacement.json`, `lint-comparison-summary.json`, `current-lint.log`, `current-audit.log`, and browser result summaries; they are **local evidence, not GitHub CI artifacts**. Full cross-browser, screenshot-diff, interaction, and causal hydration analysis remain untested.

### Actual policy and effective merge requirements

Authenticated `GET /repos/AcingTime420/Acing-IU-Genesis/rules/branches/master` on 2026-10-10 confirmed active **master-stabilization** ruleset **23200339**. This supersedes the earlier review's incomplete classic-branch-protection probe: a classic endpoint's 404 did **not** mean no effective rules existed.

- Required status contexts are **Repository Integrity (no tracked artifacts)**, **Backend Build & Test (.NET)**, and **Frontend Build & Test (Node.js)**, from GitHub Actions, with strict up-to-date checks.
- One approving review is required; stale approvals are dismissed on push, last-push approval and review-thread resolution are required, and extra approval for unattributed changes is enabled. No code-owner review is required by that rule. The inspected PR had no submitted reviews and no unresolved review threads; it remained `REVIEW_REQUIRED`.
- `CONTRIBUTING.md` requires clean-clone CI and repository integrity; the supply-chain policy requires detection results to remain green and maintainer sign-off for finding review. These four PR workflow runs now provide executed baseline/security/SBOM evidence for the recorded source, not integration on `master`.
- A documentation-only reconciliation commit will have a new head: the prior executions remain source-bound evidence, not results of the new commit. Observe the new required checks and strict base freshness before merge; do not demand duplicate push runs, optional CodeQL, SLSA target attestation, or Gemini merely because they have not executed.
- Maintainer review must address the migration/override/local-rule trade-offs and disposition the reproduced hydration and narrow-layout concerns. No exception or risk acceptance is recorded here.
- Gemini Dispatch remains outside this baseline review: its reusable workflows request broader write permissions, OIDC and inherited secrets. No workflow was approved; PR #143 stays draft and no merge or deployment is performed.

The PR title/body is reconciled with this current section; historical statements below are preserved as explicitly checkpoint-scoped evidence, not current audit blockers.

## Open / tracked findings

| Finding ID | Source | Component | Severity | Status | Detected | Remediated | Evidence | Owner | Exception expiry |
|---|---|---|---|---|---|---|---|---|---|
| SCF-2026-001 | Manual review (#62) | Container base images (`mcr.microsoft.com/dotnet/*`, `postgres:16-alpine`) | High | Remediated | 2026-08-17 | 2026-08-17 | #62 closed; digest pinning + CI lint | Maintainer | — |
| SCF-2026-002 | Manual review (#63) | Frontend Knox/certification claim language | High | Remediated | 2026-08-17 | 2026-09-13 | #63 closed; `scripts/check-claim-surface.sh` | Maintainer | — |
| SCF-2026-003 | npm audit (#135) | `next` | Critical | In progress | 2026-10-07 | N/A | Patched to 16.3.8 in unmerged #143; full audit run 37839236433 attempt 2 reports zero; review/integration outstanding | Maintainer | — |
| SCF-2026-004 | npm audit (#135) | `brace-expansion` (both original branches) | High | In progress | 2026-10-07 | N/A | Original branches patched in unmerged #143; same full audit passed; review/integration outstanding | Maintainer | — |
| SCF-2026-005 | npm audit (#135) | `sharp` / bundled librsvg | High | In progress | 2026-10-07 | N/A | Patched to 0.35.5 in unmerged #143; same full audit passed; review/integration outstanding | Maintainer | — |
| SCF-2026-006 | npm audit (#135) | `source-map-js` | High | In progress | 2026-10-07 | N/A | Patched to 1.2.2 in unmerged #143; same full audit passed; review/integration outstanding | Maintainer | — |
| SCF-2026-007 | npm audit (#135) | `braces` via Tailwind and Next ESLint | High | In progress | 2026-10-07 | N/A | Both paths removed in unmerged #143 through migration/plugin replacement, not an upstream patch; same full audit passed | Maintainer | — |
| SCF-2026-008 | npm audit (#135) | `postcss-selector-parser` via Tailwind | Medium | In progress | 2026-10-07 | N/A | Path removed with Tailwind 4 in unmerged #143; same full audit passed; review/integration outstanding | Maintainer | — |

### Historical PR #135 investigation and initial partial remediation — 2026-10-08

This section preserves the original investigation and results recorded through PR #143 head `fd4a4298f2fc986eaa1b4f500e0a170ced089b8e`. “Current,” “updated,” “remaining,” and “not applied” below describe that historical stage, not the final dependency changes. The final-head evidence section supersedes those conclusions. The earlier register labeled SCF-2026-003 through SCF-2026-006 Remediated on 2026-10-08; the current table conservatively records In progress because the follow-up is unmerged and final CI has not executed.

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
| Fallback read-only dependency diff review | Historical session reported no significant issues; independently identifiable SHA-bound review evidence is Unverified |

Remaining **distinct** advisories: high GHSA-vfj7-8cjw-p6xm (`braces`, plus chokidar/micromatch/fast-glob/@next/eslint-plugin-next/eslint-config-next/tailwindcss meta-vulnerabilities); moderate GHSA-rj75-hqrm-r3gf (`postcss-selector-parser`, plus postcss-nested meta-vulnerability). No critical, low, or info package entries remain. Audit retrieval succeeded; the nonzero result is an unresolved vulnerability, not an environmental limitation. This is a compatible **partial remediation**, not a green audit or a fix already present in #135.

### Final dependency changes and local verification — PR #143, 2026-10-08

**Tested source head:** [`9f11d71aecdb5a171f5356fc4ddba057d92fce65`](https://github.com/AcingTime420/Acing-IU-Genesis/commit/9f11d71aecdb5a171f5356fc4ddba057d92fce65), rechecked against the [PR API](https://github.com/AcingTime420/Acing-IU-Genesis/pull/143) before this investigation. This documentation reconciliation is a subsequent documentation-only commit; it is not the SHA on which the frontend commands below ran. No permissions, security settings, workflow gates, merge state, or review threads were changed.

#### Actual changes and audit coverage

- [`1086e618c9d35df852a6b34ceea645a1a1c5cf7b`](https://github.com/AcingTime420/Acing-IU-Genesis/commit/1086e618c9d35df852a6b34ceea645a1a1c5cf7b) migrates Tailwind 3.4.19 to 4.3.3, adds `@tailwindcss/postcss`, removes the separate Autoprefixer dependency, moves custom colors from the deleted JavaScript configuration into CSS `@theme`, and migrates templates (including gradient, outline, and radius utilities). Tailwind 4 automatic content detection replaces the old `src/pages`, `src/components`, and `src/app` globs.
- That commit retains `eslint-config-next` 16.3.0 and ESLint 9.39.5, but **overrides** its Next plugin to the official `@next/eslint-plugin-next` 14.2.35 and the plugin's `glob` to 10.5.0. The older plugin declares `glob` 10.3.10; 10.5.0 is the patched same-major override. `@eslint/compat` 2.1.1 adapts the legacy rule APIs to ESLint 9. This is a deliberate dependency replacement/downgrade, not a patched Next 16 plugin or proof of identical Next 16 coverage.
- `9f11d71aecdb5a171f5356fc4ddba057d92fce65` places glass-card/glow CSS in the components cascade layer and adds an internal-anchor selector for App Router links. Explicit Core Web Vitals link and synchronous-script severities remain errors.
- The full lockfile and clean installed tree contain no `braces`, `chokidar`, `micromatch`, `fast-glob`, `postcss-nested`, or `postcss-selector-parser`. Thus both the Tailwind and Next ESLint braces paths, and the selector-parser path, are **removed**, not suppressed or fixed by an unpublished braces patch. `npm ls` confirms Tailwind 4.3.3, the overridden plugin 14.2.35, and glob 10.5.0.
- The [audit gate](https://github.com/AcingTime420/Acing-IU-Genesis/blob/9f11d71aecdb5a171f5356fc4ddba057d92fce65/.github/workflows/security.yml#L56-L74) is unchanged: `npm ci` followed by `npm audit --audit-level=high`. It includes development dependencies, with no omit/production-only flags, audit exclusions, advisory suppressions, `continue-on-error`, or masked exit codes. Local npm `omit`/`include` settings were empty and `audit` was true. No repository `.npmrc` was found. This was and remains a full-dependency gate, not a production-only gate.

#### SHA/runtime-scoped validation

All commands below ran locally from `frontend/` at **`9f11d71aecdb5a171f5356fc4ddba057d92fce65`** using the installed CI-compatible runtime **Node v22.23.3 / npm 10.9.9** (`/opt/hostedtoolcache/node/22.23.3/x64/bin`), not in the pending CI workflows.

| Command | Exit | Observed result |
|---|---|---|
| `npm ci` | 0 | 470 packages installed; 471 audited; glob 10.5.0 deprecation warning |
| `npm audit --json` | 0 | Empty vulnerability map; 0 info/low/moderate/high/critical; **0 total vulnerable package entries and 0 reported advisories** |
| `npm audit --audit-level=high` | 0 | Zero high/critical findings, and also zero total vulnerabilities; not merely below-threshold success |
| `npm run lint` | 0 | ESLint 9.39.5; 0 errors, 19 unused-variable warnings |
| `npm run build` | 0 | Next 16.3.8 production compilation, TypeScript check, and seven static pages succeed |
| `npm ls` for affected packages and replacements | 0 | Removed packages absent; replacement versions above installed |

Audit metadata reports 547 dependency entries: prod 84, dev 425, optional 95, peer 1, peerOptional 0. These overlapping inventory categories include platform-optional packages and are not the 471 installed/audited package count.

The sandbox initially selected **Node v24.21.0 / npm 11.19.0** at the same full SHA. The same five validation commands exited 0 (468 installed/469 audited; zero vulnerabilities; 19 lint warnings; build passed), but that preliminary run is **not CI-runtime evidence**. A fresh Node 22 `npm ci` and all subsequent commands superseded it. The earlier read-only verification at the same full SHA also reported Node v22.23.3 / npm 10.9.9, all five exits 0, zero vulnerabilities, and HTTP 200 for `/`, `/audit`, `/devices`, `/rootmaster`, and `/users`; those remain local session results, not executed CI.

#### Lint compatibility and rendered-page limitations

Local ESLint API inspection confirms React, React Hooks, import, JSX accessibility, TypeScript, and Next plugin families are loaded. There are 21 enabled Next rules. The four existing rule disables and generated-file ignore patterns are unchanged from `fd4a4298f2fc986eaa1b4f500e0a170ced089b8e`; no additional audit suppression was introduced.

Coverage is **not identical** to the official Next 16.3.0 plugin: its recommended `no-location-assign-relative-destination` warning is missing after the downgrade. The new anchor selector rejects literal `/audit` and `/audit/details` and allows protocol-relative external links; it does not inspect expression-valued hrefs. The old Next 16 link rule also skips expression-valued hrefs, so that particular limitation is not a newly demonstrated regression. The replacement selector also rejects download anchors that the upstream rule exempts, and is not route-aware. Maintainer review of these compatibility trade-offs remains required.

At the tested SHA, the Node 22 production server was inspected in installed **Chrome 154.0.8037.57**, at a 1440×1000 viewport, on `/`, `/devices`, `/users`, and `/audit`. Rendered DOM/computed styles confirm the dark body color `rgb(11, 15, 25)`, custom royal-blue theme, visible nonzero-width glass cards, and loaded CSS gradients. All four report document width 1440 without horizontal overflow. A dashboard screenshot was visually inspected; screenshots and computed-style reports for all four routes were retained only under `/tmp`, not published artifacts.

These are representative checks, **not baseline visual equivalence**. Chrome reported React text-hydration error **#418** on dashboard and audit navigation; attribution to the migration versus pre-existing time-dependent rendering is Unverified. Headless Chrome reported `(hover:hover)` false, so mouse movement did not demonstrate the hover border transition. Generated CSS has the correct components-before-utilities layer order, but actual desktop hover behavior remains Unverified. No frontend test script exists. A clean build is not evidence that hydration, all interactions, responsive layouts, or older browser targets are regression-free.

#### Pending workflows and required maintainer action

At source head `9f11d71aecdb5a171f5356fc4ddba057d92fce65`, these workflows are `action_required`, with **zero jobs executed**:

| Workflow | Run |
|---|---|
| Security and Dependency Review | [37832041839](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37832041839) |
| CI — Clean-Clone Baseline | [37832041896](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37832041896) |
| Generate SBOM | [37832041955](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37832041955) |

The rendered GitHub HTML on **each** run states exactly: **“This workflow is awaiting approval from a maintainer in #143”**. This is an approval barrier, not an npm/build/SBOM job failure. A maintainer must review the changed code and use GitHub's workflow approval control on PR #143 for the pending runs, then inspect the actually executed checks and their checkout SHAs (PR workflows can test merge refs). New commits can require another approval. No permission relaxation or security-setting change is needed or made. Final CI audit, backend/container validation, and SBOM generation remain **Unverified** until jobs execute.

#### Scan and review evidence — no final-head clean claim

| Evidence | Scope / result / limitation |
|---|---|
| [Historical Secret Scan job 113494587565](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37730486973/job/113494587565) | Gitleaks 8.24.3 actually scanned three commits, approximately 26.86 KB, with no leaks. Its `--no-merges --first-parent` range ended at `fd4a4298f2fc986eaa1b4f500e0a170ced089b8e`; it covers neither final dependency commit. Full-history checkout did not make this a full-history scan. |
| [Copilot execution job 113495115582](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37830740647/job/113495115582) | Logs show JavaScript CodeQL database creation/query analysis with PR-diff filtering at approximately 19:22 and zero alerts, after `1086e618c9d35df852a6b34ceea645a1a1c5cf7b` and before `9f11d71aecdb5a171f5356fc4ddba057d92fce65`. The job metadata itself names starting SHA `fd4a4298f2fc986eaa1b4f500e0a170ced089b8e`, not a SHA-bound final-head analysis artifact. At 19:27 the checker explicitly skipped analysis. **Final-head CodeQL is Unverified**; skipped analysis is not a clean scan. |
| Changed-file secret-scanning calls in that session | Calls completed before both dependency commits, but no published SHA-bound final-head report is available. **Final-head secret scanning is Unverified**; this is not a replacement for the pending Gitleaks workflow. |
| AutoFind automated review | Both invocations failed because the requested `claude-sonnet-4.6` model was unavailable. Empty returned findings are not a completed review. **Unverified**. |
| [CodeRabbit status](https://github.com/AcingTime420/Acing-IU-Genesis/pull/143#issuecomment-6052568991) | Explicitly skipped review for a bot author. A review request referenced `fd4a4298f2fc986eaa1b4f500e0a170ced089b8e`, not the final source head. **Unverified**. |
| Session-local fallback review | Prior session reported two issues at `1086e618c9d35df852a6b34ceea645a1a1c5cf7b`, followed by no significant issues when reviewing both commits through `9f11d71aecdb5a171f5356fc4ddba057d92fce65`. No formal GitHub review or independently attributable SHA-bound report is available. **Independent final-head review is Unverified**. |

**Blockers at this checkpoint (superseded where addressed by the follow-up below):** maintainer approval and executed final-head CI/SBOM/security checks; confirmed CodeQL/secret-scan/reviewer scope and SHA; lint downgrade trade-off review; hydration diagnosis and real desktop-hover/visual-regression evidence. No exception has been accepted, and no finding is represented as remediated on `master`. PR #143 stays draft; PR #135 was not updated.

### Hydration comparison and workflow-control follow-up — 2026-10-08

The follow-up started from draft PR #143 head `90bb4f4647f3defd7f927e6809f442868ec9df70`. Its complete workflow diff against base `3d22e3c20abbe9e8cd3e168b4e4a8d800d17f7c7` is empty: this PR proposes no changes to Security, CI, or SBOM workflows or permissions.

The requested approval page was opened through the available browser tool, but it returned **“MCP request failed: Transport closed”** before displaying a page or approval control. No run was approved. The available GitHub tools have no workflow-approval or PR-body-update operation; attempts to use the progress description do not update the existing PR body. Maintainer approval and correction of the stale PR description remain required, not completed. The linked pending runs at this starting head are [Security 37836860790](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37836860790), [CI 37836860393](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37836860393), and [SBOM 37836860323](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37836860323). No settings were changed, and the PR remains draft.

For a controlled hydration comparison, the unchanged pre-migration frontend at full SHA **`fd4a4298f2fc986eaa1b4f500e0a170ced089b8e`** was extracted into `/tmp` (not another branch), installed with `npm ci`, and built with `npm run build`. Both exited 0 on **Node v22.23.3 / npm 10.9.9**; the original dependency audit still reported its historical nine package findings. The migrated frontend at starting SHA **`90bb4f4647f3defd7f927e6809f442868ec9df70`** also installed and built successfully on that runtime. A shared-directory installation overlap produced transient tar warnings during the latter install; the build succeeded, but that install is not claimed as a pristine independent final-head installation.

Both production builds were served locally and navigated in the same clean **Chrome 154.0.8037.57**, 1440×1000 viewport, with timezone **America/Los_Angeles**. Runtime exception events were collected separately after each full navigation:

| Source SHA | `/` dashboard | `/audit` | `/users` |
|---|---|---|---|
| `fd4a4298f2fc986eaa1b4f500e0a170ced089b8e` (before migration) | No captured runtime exception | React text-hydration error #418 | No captured runtime exception |
| `90bb4f4647f3defd7f927e6809f442868ec9df70` (after migration, before this follow-up) | No captured runtime exception | React text-hydration error #418 | No captured runtime exception |

Thus the audit hydration failure **predates the Tailwind migration**; no migration-caused hydration regression was demonstrated. The previously reported dashboard error was not reproduced under this controlled comparison and is not labeled fixed. The audit source in both revisions renders `new Date().toUTCString()` directly in the print report and uses local date arithmetic/default-locale month/weekday formatting for fixture heatmap dates. Those unchanged server/client-dependent values are candidate mismatch sources; a complete attribution of every mismatch remains Unverified. They are not silently suppressed or changed as an unrelated application repair. The comparison is local evidence, not CI or proof that all browser interactions are error-free.

The full JSON and high-threshold audits during this follow-up again exited 0 with **zero total vulnerabilities and zero reported advisories**; the affected braces and selector-parser package paths remain absent. No dependency or audit-gate changes were required.

The lint follow-up retains the existing dependency overrides but replaces the broad `no-restricted-syntax` anchor selector with a local, route-aware compatibility rule registered under `@next/next/no-html-link-for-pages`. It scans this repository's JS/TS App Router and Pages Router routes, permits non-route assets/external links, and preserves upstream download and `_blank` exemptions. A second local rule restores `@next/next/no-location-assign-relative-destination` at its original warning severity, including static destination prefixes and global/shadowed location handling. All other configured lint families, existing disables, generated-file exclusions, and Core Web Vitals severities are retained. These are compatibility implementations, not an upgrade to the Next 16 plugin; literal-only href inspection and static analysis cannot establish every runtime destination.

The implementation agent validated its own working-tree changes based on `90bb4f4647f3defd7f927e6809f442868ec9df70` using **Node 22.23.3 / npm 10.9.9**: `npm run lint` exited 0 with the existing 19 warnings; 42 configured probes, 188 differential cases against the official Next 16.3.0 navigation rules, and 20 route probes passed. Those counts are session-local ESLint API checks, not a newly committed test suite or executed CI. The unchanged manifest/lockfile means no vulnerable paths were reintroduced. The production build comparison above occurred before the lint edits; lint configuration does not participate in `next build`.

A final-head SHA-bound build/audit/scan/review report still requires the pending workflows. The available automated review service is unavailable; any skipped CodeQL analysis or local agent review is not recorded as completed independent final-head review evidence. A changed-file secret check before committing this follow-up is only that limited local check, not the required GitHub Gitleaks run.

### Committed lint follow-up and approval recheck

The lint restoration and hydration comparison were committed as **`0ebcb0816987329cf7e6c7a8bf8dcb47f890f86b`**. The GitHub PR API confirmed that exact head, `draft: true`, and `merged: false`. At that head, [Security 37838664574](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37838664574), [CI 37838664434](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37838664434), and [SBOM 37838664612](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/37838664612) all concluded `action_required`. Security's jobs API and failed-job log retrieval reported **zero jobs**; this is not a successful security analysis. Each linked approval page was attempted again, but the browser now returned **“Browser-based OAuth required for http://localhost:3100/mcp”** before exposing its control. No approval was performed. The earlier GitHub banner remains the observed reason: **“This workflow is awaiting approval from a maintainer in #143”**. A maintainer must open the current runs and use their approval controls.

Validation requested after that commit again reported an unavailable AutoFind binary and skipped JavaScript CodeQL analysis because there were no changes since the previous run. Neither establishes a completed review or executed analysis of this SHA. Final-head independent review, CodeQL, and GitHub secret-scan evidence remain **Unverified**. Successful Gradle/NuGet dependency-submission runs are not substitutes for these checks.

The actual PR description was re-read and still contains the obsolete partial-remediation, remaining-braces and nine-finding statements. It is **not updated** by progress-description calls; authenticated PR-body editing remains unavailable. The replacement must describe the Tailwind 4 migration, braces-free Next lint override, navigation compatibility rules, zero-total local audit, pre-existing audit hydration error, exact tested SHAs/runtimes, and unexecuted final-head checks. Keep the PR draft and retain the historical partial-remediation evidence in this register; none of this asserts remediation on `master`.

A session-local read-only review of `0ebcb0816987329cf7e6c7a8bf8dcb47f890f86b` identified missing optional catch-all base-route coverage. The implementation agent corrected the route regex in a working-tree follow-up based on that SHA and validated on **Node 22.23.3 / npm 10.9.9**: 25 route probes and 191 official/local differential probes passed; `npm run lint` exited 0 with zero errors and 19 existing warnings. The other reported concern—warning on an unknown template destination such as an unresolved host—was reproduced in official Next 16.3.0 too, so upstream-compatible behavior was retained. This preserves a known static-analysis limitation, not proof that runtime navigation is internal. These are local agent results, not a formal independent review or an executed CI run. Dependency versions and production application code are unchanged by this correction.

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
| 2026-10-08 | Contributor (#143), final source-head reconciliation | Reproduced full audit/lint/build at `9f11d71aecdb5a171f5356fc4ddba057d92fce65` on Node 22.23.3/npm 10.9.9; zero total audit findings locally. Recorded applied migration/overrides, rendered-page limitations, exact maintainer-approval banners, and Unverified final CI/scan/review evidence. Findings remain In progress in this unmerged draft. |
| 2026-10-10 | Contributor (#143), executed-evidence reconciliation | Inspected attempt-2 PR logs/artifacts and head/merge tree equivalence; full npm audit and baseline checks passed at `cc7ae5b6c3ebb413f0f0d5d10f20ac904e0bc7a3`. Executed controlled lint comparison and current-head browser probes; recorded one anchor diagnostic difference, reproduced audit hydration and narrow-layout concerns, corrected unsupported findings and effective-rules conclusions. No maintainer sign-off, merge or claim of remediation on `master`. |
