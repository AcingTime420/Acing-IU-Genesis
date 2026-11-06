# Publication scope, classification and exclusions

This is **documentation/evidence only**. The maintainer authorized a selective ordinary commit and non-force push to a new isolated branch, not publication of every local file. No application source, dependency manifest/lock, IDE setting, devcontainer, build output, skill package or diagnostic tool is included.

## Complete classification of the original changed paths

The canonical status snapshot contained40paths, with no staged changes:2modified tracked files and38untracked files. Each was inventoried, read as text where appropriate or identified as binary/IDE state, and reviewed for publication purpose/risk. The complete per-path table is retained in the private publication report; the following categories account for all40.

| Paths / family | Count | Classification | Publication decision and reason |
|---|---|---|---|
| `.vscode/settings.json` | 1 | Local development configuration | Excluded. Adds `DockerRun.DisableDockerrc:true`; not an approved project-wide configuration/security behavior change. Original preserved. |
| `frontend/package-lock.json` | 1 | Uncommitted dependency/source-related change requiring reconciliation | Excluded. Ten Next-family nodes move to16.4.2; root metadata unchanged; Zod remains4.4.3. Not a validated combined #186/#181 candidate and no intentional-change provenance established. |
| `.devcontainer/devcontainer.json`, `.devcontainer/devcontainer-lock.json` | 2 | Potential shared development configuration, unverified | Excluded from evidence PR. TypeScript/Node image plus .NET8 and Docker-outside-of-Docker features; no validated devcontainer execution or separate source/config review. Not alleged malicious, but not automatically approved. |
| `.vs/` state/index/layout files | 7 | Generated IDE binaries/private runtime state | Excluded. No source/evidence value; may contain workstation context. Nothing deleted. |
| `.work/` recovery scripts and notes | 16 | Temporary diagnostics/environment repair | Excluded. Environment-specific paths, process behavior and installation/config operations; not approved reusable repository tooling. The portable skill also stays outside Git. |
| `dependabot-alerts.json` | 1 | Unverified security-alert export | Excluded. Did not parse as UTF-8 JSON in the inspected reader; no raw contents are published and invalidity in every encoding is not assumed. Public GHSA IDs are summarized separately. |
| `docs/evidence/local-validation/20261027/` reports | 6 | Intended documentation/validation evidence, private raw originals | Relevant facts distilled into this publication. Raw reports contain machine paths, stale executor findings and local recovery details; not copied verbatim. |
| `docs/evidence/local-validation/20261029/` reports | 6 | Intended documentation/recovery evidence, private raw originals | Relevant verified facts distilled and superseded findings labeled. Raw originals preserved and excluded. |

No unrelated personal-file category was established among these40. No uncommitted implementation change other than the source-related lock delta was identified. Existing local branch history has no commit missing from every fetched origin ref, so no unpublished source-history branch needed an independent push. Other agents' branches are untouched.

## Other inspected local material

The initial inventory also identified **62 ignored groups/paths**, including Gradle/Kotlin/IDE caches, the isolated Python validator environment, backend/legacy/installer build outputs, frontend node_modules/Next output, Android build outputs, test results, local SDK properties and crash/replay logs. All remain local. Ignore rules and Gitleaks protections were not weakened; no force-add was used.

The external validation output inventory contained **123 files** at inspection time:72text logs,31JSON records,12Markdown files,7TRX files and1portable skill ZIP. These are source inputs/private diagnostics, not an instruction to publish123files. Reviewed final reports and structured summaries supplied the allowlisted facts. Raw logs/TRX, machine/service/pipe/disk metadata, local config, caches, binaries and the skill ZIP remain local. Newly generated publication/check/final-report files are additional task artifacts, not retroactive members of that inventory.

No real environment file, credential store, private key or production database was read for publication. The raw original reports and alert export are not certified secret-free merely because coarse pattern checks found no obvious token shape. Gitleaks is applied to the actual selected public content and staged/committed delta, not used as a substitute for privacy review.

## Sanitization and provenance

The public documents are **curated new summaries**, not byte-identical copies. Personal usernames, machine identifiers, absolute paths, private/internal network information, local disk details and credential-bearing source lines are omitted. The HumanAuthority artifact path uses an abstract source root while retaining the exact separator/relative-tail defect.

[PUBLICATION_PROVENANCE.json](PUBLICATION_PROVENANCE.json) records logical source filenames and SHA-256 fingerprints of original evidence where relevant, without machine paths or raw content. Hashes support maintainer traceability but do not make private raw logs independently available or prove that every historical command was rerun. [VALIDATION_RESULTS.json](VALIDATION_RESULTS.json) is explicitly allowlisted result data; no full PowerShell objects or raw CLI response dumps are serialized into this branch.

A separate worktree at verified master is used. Specific new evidence paths only are staged, reviewed and secret/privacy/whitespace checked. The original canonical branch,40statuspaths, stash and other worktrees are preserved. No local worktree is made artificially clean by resetting, deleting, stashing, cleaning or moving the original files.

## Required reviewer decisions

Review the evidence's source attribution and residual blockers; coordinate dependency work with open#186 and the closed#181 reference; review the minimal HumanAuthority correction separately; decide any Docker recovery window; and require affected validation on the intended final source head. This evidence does not approve a release or merge, bypass protection, close#54 or deploy any service.
