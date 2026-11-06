# Frontend dependency findings and reconciliation

**The preserved frozen C67 audit fails; no competing lockfile is published here.** This document reports known public advisories and bounded source observations, not exploit instructions or proof of production compromise.

## Tested tree versus uncommitted local tree

At `67ce0fc02505885148cefdab1d063ca9a5555146`, the manifest permits `next: ^16.3.0`; the committed and frozen tested lock resolves Next **16.3.8**, Sharp **0.35.5**, and Zod **4.4.3**. Next is a direct production dependency. Zod is transitive development tooling:

```text
eslint-config-next@16.3.0 [dev]
  -> eslint-plugin-react-hooks@7.1.1
  -> zod@4.4.3 [dev]
```

The hooks plugin permits `^3.25.0 || ^4.0.0`. No root direct Zod dependency is needed to address this node.

The canonical checkout also has a **pre-existing uncommitted** `frontend/package-lock.json` modification. Exact diff and structured comparison show **10 changed Next-family nodes**: Next, its environment package, and eight optional SWC variants move from 16.3.8 to **16.4.2**, with corresponding tarball/integrity and companion metadata changes. Root dependency metadata is unchanged; Zod remains **4.4.3**, Sharp **0.35.5**, ESLint configuration **16.3.0**. This change is not mere formatting. It fits the older #177 Next family, but does not implement #181's Zod fix or #186's current Next target, and its originating intent was not independently established.

That local lock is **left intact and excluded**. It was not installed/audited during publication and must not be described as the frozen audited C67 tree or a reconciled successor. Codex should select the intended base and review the dependency delta rather than publish this local-only lock independently.

## Public advisory matrix

| Advisory | Severity | Affected tested node / first patched floor | Applicability qualification |
|---|---|---|---|
| [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw) | Critical | Next16.3.8; first patched16.4.1 in16.x | Native image-processing RCE under documented glibc Linux/Image Optimization conditions. The examined Sharp0.35.5 already meets the vendor's library workaround; package-level Next finding still exists. |
| [GHSA-p3m5-59mp-jv5r](https://github.com/advisories/GHSA-p3m5-59mp-jv5r) | High | Next16.3.8; first patched16.4.1 | Server Actions CPU denial of service; official prerequisite includes App Router with at least one Server Action. Not declared development-only. |
| [GHSA-673q-mjm6-r5xr](https://github.com/advisories/GHSA-673q-mjm6-r5xr) | Critical | Next16.3.8; first patched16.4.1 | App Router/Cache Components with a cached function returning multiple typed arrays. Not declared development-only. |
| [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | High | Zod4.4.3; GHSA first patched4.6.6 | Oversized constrained collections processed before upper-bound rejection. Dev-tooling chain is verified; production request use is not. |

The saved npm v2 audit represents **two vulnerable package entries with four advisory objects**, not four vulnerable package nodes. A prior summary's advisory-count field was undercounted; the corrected count derives from object-valued `via` entries in the raw audit. The reported package severity totals are critical1/high1.

The bounded scan of 18 tracked frontend files found App Router pages but no Server Action, `use cache`, Cache Components or Next-image marker and no tracked Next configuration file. This is not a complete runtime/call-graph proof. Sharp0.35.5 mitigation is not permission to suppress other findings or waive the audit. The vendor documents the image-library workaround in its [October security update](https://nextjs.org/blog/nextjs-security-update-october-14-2026).

Zod's upstream [bound-check patch](https://github.com/colinhacks/zod/pull/6652) does not impose a universal cap on unbounded collections or error counts. Do not promise that a version bump removes all resource-exhaustion risk, or invent an application Zod endpoint that was not found.

## Current PRs, not interchangeable historical audits

- [#177](https://github.com/AcingTime420/Acing-IU-Genesis/pull/177): closed/unmerged; Next16.4.2, head `5a73bc5bce57128313f3f264ed2f38bd79e8d97b`.
- [#181](https://github.com/AcingTime420/Acing-IU-Genesis/pull/181): closed/draft/unmerged; Zod4.6.7-only lock update, head `5f7ec3047f3593519e4d90a153a0131b0ec5b6bd`, stacked on #177. Its historical clean audit does not validate C67, the dirty local lock or #186.
- [#186](https://github.com/AcingTime420/Acing-IU-Genesis/pull/186): open/unmerged successor; Next16.4.3, head `865209c127e8609514311d41a84d42a4c1a1ea93`, base master `4cf3181951ddc3366a193d49cb8ca32dce346bf7`. Exact [registry metadata](https://registry.npmjs.org/next/16.4.3) verifies that version exists, with Node>=20.9.0 and compatible React18/19 peers.

No dependency PR is merged by this evidence branch. Codex should coordinate on the active successor instead of reviving a closed stack blindly. Both recommended upgrades remain within the current major but cross minor releases; framework/bundler and Zod validation/error-contract behavior still need tests.

## Narrow Codex proposal and unchanged gates

On the reviewer-selected candidate: use the reviewed #186 Next floor `^16.4.3` with exact locked Next/env/applicable SWC16.4.3; carry #181's narrow Zod4.6.7 version/tarball/integrity change; retain resolved Sharp>=0.35.5, Zod `dev:true`, valid integrity metadata, and existing ESLint compatibility overrides. Do not add a direct Zod dependency, force major upgrades or suppress findings merely to make the audit green.

Use a fresh worktree at the corrected SHA. Record Node/npm and run frozen install, `npm ls next zod sharp --all`, the existing audit threshold, TypeScript, lint, production build and applicable runtime checks. Preserve warnings and actual child exits. Do not automatically approve unreviewed install scripts, run `audit fix --force`, lower thresholds or transfer a prior candidate's success.

## Container reproducibility is a separate source finding

The C67 frontend Dockerfile copies only `package.json` into its dependency stage and runs `npm install`, then copies full `node_modules` into runtime. It does not reproduce the tested lock, and `NODE_ENV=production` set only in the final stage does not remove development packages. Zod can consequently be present in the designed image, although presence is not proof of request-time use. The template uses Alpine, not glibc; no current image was built or scanned.

Codex should separately review lockfile-aware `npm ci` installation and the intentional runtime dependency set. Validate image contents and behavior once Docker Engine is healthy. This evidence publication neither changes packaging nor claims deployed versions are known.
