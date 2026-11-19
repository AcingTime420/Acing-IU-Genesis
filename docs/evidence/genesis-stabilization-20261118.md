# Genesis stabilization decision and evidence package

Research/execution date: **November 18, 2026 (America/Los_Angeles)**.
Verdict: **Implemented with specifically listed validation blocked.** Local only;
no push, PR mutation, merge, deployment, tester contact, external credential test,
live rotation, production setting change or pilot approval.

## Verified baseline and dependency order

Repository: https://github.com/AcingTime420/Acing-IU-Genesis . GitHub plugin verified
default `master`, SHA `4cf3181951ddc3366a193d49cb8ca32dce346bf7`.
PR #222 remains open/draft, head `9d0876aa7d9794f9547d57fe42a2a7e980cd8cda`,
base `a72349737cd6424c2f5f9bb82de1c11a5881e7c8`; its sole retrieved review is
Copilot COMMENTED. PR #223 remains open/draft, head
`e200b031b59126f5034b556022614eaa55f04080`, base #222; retrieved reviews empty.
Current plugin results for that head include successful Repository Integrity run
43325293081 and CI run 43325292857. These remote results do not validate local work.

Starting local head `8808b0c5de15f4634c6c7a45f9094c3fd1f8abeb` and tree
`5db36d6417a44c360ef60c2ae896732c18f225a8` matched supplied values. Both preceding
evidence documents were inspected. Local commits are not claimed remote or merged.
The owner worktree and earlier local worktrees were preserved. A new worktree
`/workspace/scratch/793af41f1407/genesis-stabilize` uses branch
`codex/stabilization-boundaries`. No repository AGENTS.md was found; governance,
stabilization, supply-chain and capability controls were read. Isolated work is
explicitly owner-authorized. Build/security stabilization fits the active freeze.

Task dependencies: verified integrated candidate → listener/dependency repairs →
real database and connected regressions → recovery validation → platform/release
review. Secret triage and runtime inventory are independent investigations.
Windows is unavailable; no Docker or PowerShell executable was found.

Overlap inspected before implementation: Gradle mode PRs #244/#243/#240 and many
older duplicates; DeviceTrust #135 and #107; frontend container #218; lint #184 and
#194; DeviceTrust container runtime #183/#230. No PR was modified. Only four
canonical DeviceTrust source patches from #135 at
`016f3a0ebbcaa551d18ba746896ac8cd7793c48a` were adapted, with additional regression
repairs; no unrelated files or ignore rules from that PR were imported. Reconcile
overlap before publication, not by merging every competing candidate.

## Focused implementation

| Local commit | Change |
|---|---|
| f66fdbb | Own authority listeners explicitly; reject wildcard, hostname, port-only and Kestrel overrides; disable reloadable endpoint configuration; add 11 actual process cases |
| 3097a3f | Frontend authority upstream accepts literal 127.0.0.1/[::1], not DNS hostnames; browser-origin/session rules otherwise preserved |
| e979124 | Pin Gradle 9.3.1 distribution SHA256 to the verified official archive |
| 3688f98 | Align eslint-config-next/plugin 16.4.6; remove older plugin/glob override and compat shim; update transitive TypeScript ESLint to 8.73.0; retain App Router link coverage; add 10 lint checks and CI invocation |
| 800672d | Adapt DeviceTrust owner checks and atomic telemetry/audit; test real HTTP/database behavior, denial evidence failure, transfer/concurrency, generic errors; wire CI/audit and document provenance |
| d5d0195 | Refuse CLI credential read/write on unsupported Windows controls before file access or fixture insertion; three synthetic-file/platform-guard tests |

Authority transaction, grant, revocation and execution logic and database migration
are unchanged. Listener compatibility is deliberately narrower: literal explicit
HTTP loopback URLs/ports only; no hostnames, HTTPS, port-only configuration or
alternate Kestrel configuration. Frontend browser origin may still be localhost;
its server-side authority destination must be literal loopback.

The initial native-lint trial missed `/devices` App Router anchors. That failing
regression was not weakened. The existing App Router link rule was retained;
native aligned location navigation rules replace the other local shim. The
application's rule/severity/line/column diagnostic set remained exactly the same
19 warnings. Existing deferred compiler-rule settings were not expanded.

DeviceTrust telemetry now updates only enrolled authorized rows; it no longer
creates/claims unknown devices. Foreign/unknown/unowned access shares a generic
404 response. Admin/Operator access follows #135's explicit role policy and still
needs owner review. Successful mutation and evidence share one PostgreSQL
transaction. Required denial evidence is not silently discarded. Database errors
return generic 503 problem JSON. The tests caught and repaired a content-type
mismatch in the upstream candidate. No database schema migration was introduced.

## Tested revisions and actual tools

Authority/lint implementation tested at `3688f98cae48cd6da57328bb06b0de09af70c0b8`,
tree `0fca5952e4760573d840503166052659e54b2eea`. DeviceTrust source/test bytes were
committed as `800672df75e0f037e8d730f7f2c697744441aeea`, tree
`3965f66a881f38b2b7aa923b9fabcb097221f0be`; those 17-case suites ran before that
commit, with identical source bytes. Final connected run also covers the added
POSIX credential-platform guard at d5d0195. Subsequent reporting and CI wiring do not change the tested application/test
sources; final exact head/tree are in the portable manifest.

Linux x64, Node 24.22.3/npm 11.9.0; .NET SDK 10.0.404, actual Microsoft.NETCore.App
and Microsoft.AspNetCore.App **10.0.15**. External host traces resolve those actual
framework versions for Debug/Release authority test/service processes, browser
service and DeviceTrust test host. PostgreSQL server 16.15; verified client 16.16
for backup/restore; Playwright 1.65.0, Chrome Headless Shell 158.0.8127.18; Gitleaks
8.30.0; Java 21.0.13 and Gradle 9.3.1.

Fresh official sources:

- https://dotnet.microsoft.com/en-us/platform/support/policy — .NET 10 LTS current patch 10.0.15, support through November 14, 2028.
- https://nodejs.org/en/about/previous-releases — Node 20 EOL; 24 supported LTS.
- https://nextjs.org/docs/app/api-reference/config/eslint — current aligned plugin/config guidance.
- https://github.com/vercel/next.js/releases/tag/v16.4.6 — current stable Next patch inspected in preceding evidence.
- https://docs.gradle.org/current/userguide/gradle_wrapper.html — distribution verification procedure.
- https://downloads.gradle.org/distributions/gradle-9.3.1-bin.zip.sha256 — verified archive digest `b266d5ff6b90eada6dc3b20cb090e3731302e553a27c5d3e4df1f0d76beaff06`.
- https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/kestrel/endpoints?view=aspnetcore-10.0 — alternate endpoint configuration paths. Its contradictory stale support banner is not treated as lifecycle authority; the dedicated Microsoft policy above confirms .NET 10 support.

## Commands and observed results

All ran in the isolated worktree, with task-owned tools/credentials outside Git.
The table uses actual completed command results, not hosted historical counts.

| Command/check | Exit | Result |
|---|---:|---|
| `npm ci --no-audit --no-fund` (frontend) | 0 | Clean lockfile installation |
| `npm run test:lint` | 0 | 10 meaningful navigation cases |
| `npm run test:genesis` / `npm run test:genesis-session` | 0 each | 9 adapter / 3 session cases |
| `npm run lint` | 0 | 0 errors, 19 unchanged warnings |
| `NEXT_TELEMETRY_DISABLED=1 npm run build` | 0 | Production build, no safeguard bypass |
| `npx tsc --noEmit --incremental false` | 0 | Explicit TypeScript check |
| `npm run test:genesis-live-http` after build | 0 | 3 HTTP boundary cases; synthetic upstream, not counted as DB enforcement |
| `npm audit --json --fetch-retries=0 --fetch-timeout=30000` | 0 | Zero reported vulnerabilities, full graph including development dependencies |
| `dotnet restore tests/HumanAuthority.IntegrationTests/HumanAuthority.IntegrationTests.csproj --force-evaluate -p:NuGetAudit=true -p:NuGetAuditMode=all -p:NuGetAuditLevel=low '-p:WarningsAsErrors=NU1900%3BNU1901%3BNU1902%3BNU1903%3BNU1904%3BNU1905'` | 0 | Strict direct/transitive audit including feed failures |
| Same strict restore for `tests/DeviceTrust.OwnershipTests/DeviceTrust.OwnershipTests.csproj` | 0 | New explicit test graph audited |
| `dotnet list <authority-test-or-DeviceTrust-app.csproj> package --vulnerable --include-transitive --format json --no-restore` | 0 | No known vulnerable packages reported for each inspected graph |
| `dotnet test tests/HumanAuthority.IntegrationTests/HumanAuthority.IntegrationTests.csproj --configuration Debug --no-restore --logger trx --results-directory <external-results>` | 0 | **92/92**, no skips, real PostgreSQL |
| Same authority command with Release | 0 | **92/92**, no skips, real PostgreSQL |
| `node tests/genesis-connected-browser.mjs <private-fixtures> <external-playwright-root>` | 0 | Real production Next → .NET 10 → PostgreSQL in Chromium; exact append/replay, stale denial, revocation denial/evidence; repeated after credential guard |
| `dotnet test tests/DeviceTrust.OwnershipTests/DeviceTrust.OwnershipTests.csproj --configuration Debug/Release --no-restore` | 0 each | **17/17 each**, real canonical-source HTTP and PostgreSQL, synthetic identity |
| `dotnet build backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/AcingIU.DeviceTrust.Api.csproj --configuration Release` | 0 | Actual net8.0 project compiles, 0 warnings/errors; unsupported launcher NOT run |
| `python -m unittest discover -s tests -p test_authority_credentials.py` | 0 | 3 cases; native POSIX mode, existing-file/symlink rejection; simulated unsupported-platform refusal, NOT native Windows ACL validation |
| `./gradlew --version` with preseeded verified archive in private cache | 0 | Actual wrapper startup, Gradle 9.3.1; original executable blob preserved at 100755 |
| Gradle `--no-daemon help` | 1 | Initial plugin-resolution failure under inherited proxy settings |
| `./gradlew --no-daemon --info help` with task-process proxy settings | timeout 55s | Foojay/Android/Kotlin plugins resolved; later dependency resolution still incomplete; no successful project build/submission claimed |
| Matching-major `pg_dump -Fc --no-owner --no-privileges`, `pg_restore --exit-on-error ...` into NEW DB | 0 | Logical row counts and digests match across all **11 authority tables** |
| Gitleaks committed implementation range with `--redact=100` | 0 | No findings in changes; historical findings are separately triaged |
| Claim surface / tracked build-artifact inventory / whitespace | 0 | Passed; no tracked bin/obj/node_modules/.next |
| YAML parsing of CI/security/OpenAPI | 0 | Parsed successfully; not hosted execution or full contract conformance |

The authority increase from 81 to 92 is exactly the 11 new process-level listener
cases. Existing enforcement cases remain. DeviceTrust is a separate 17-case
suite; it is not added to the authority count. Its test host links actual canonical
source and table definitions but uses synthetic identity, not the production JWT
validator. Full launcher/JWT and service-role privilege checks remain unverified.
The existing Test SDK emits a nonfatal artifacts-directory fallback warning.

PostgreSQL guards were inspected before any reset: authority uses its suffix/host
and advisory lease; DeviceTrust requires exact loopback `genesis_devicetrust_test`
and resets only its private schema under a separate lease. Task-owned clusters
bind 127.0.0.1 only with sockets disabled. Fixtures are synthetic, private mode
0600 under mode-0700 directories outside repositories. Local trust authentication
is for isolated synthetic tests, not production. Connected processes and database
servers stopped cleanly; data and private dumps retained. No raw dumps, credentials
or unsanitized host traces are in the delivery.

## Secret triage and owner action

See `stabilization-secret-triage-20261118.json`: 907 historical occurrences become
46 exact-value/semantic records across commits and locations. All 890 memory
matches were checked to be the JSON `idempotency_key` field, yielding 39 operation
identifier false positives. One mock-token fixture spans three controller copies.
Two signing-key examples and four documentation-example values require private
owner confirmation of actual use; all six remain in corresponding current paths.
No live credential was confirmed, and no external validation was performed.

The inventory contains no values, matches, authors/emails or secret-derived hashes.
It records safe locations/lines, commit references, classification, evidence and
action. If any example was used in an environment, replace/revoke its material
there and inspect appropriate access records. Source deletion/history cleanup
does not invalidate a credential. No ignore rules, history rewriting, live
rotation, external calls or false claim of repository-wide clearance occurred.

## Before/after gates and remaining work

| Workstream | Before → after | Verdict / remaining gate |
|---|---|---|
| Linux authority local boundaries | Loopback default → explicit enforcement, 92-case suite and connected run | Completed and validated in Linux scope |
| Lint/development dependencies | 10 moderate findings/old override → full audit zero, rules preserved | Completed and validated |
| Gradle | Permission repair but startup unverified → verified wrapper starts, checksum pinned | Implemented with project resolution/submission blocked; no hosted trigger authorized |
| Windows coverage | No runner → runbook prepared, native checks not claimed | Blocked before native validation: no Windows/PowerShell here |
| Credential controls | Windows mode bits could be misread → CLI explicitly refuses unsupported Windows credential operations; POSIX tests pass | Fail-closed guard implemented; native Windows ACL feature and full Windows workflow blocked |
| Secret findings | 907 untriaged → 46 sanitized classified records | Triage completed; six example-use questions need owner confirmation, no clearance claim |
| DeviceTrust | Missing per-device ownership and separate mutation/audit → atomic authorized update, generic denials/errors, 17 DB cases | Implemented with original launcher/JWT, Windows and service-role validation unverified; independent role-policy review required |
| Recovery | Restore unverified → 11 authority tables verified after new-DB restore | Completed in this synthetic Linux scope; Windows/real-data procedures unverified |
| Runtime/container debt | Mixed unsupported projects/images → concrete inventory below | Investigated; broad repair deferred to separate supported-runtime slices and existing candidates |
| Release/privacy/IP | No approval → explicit runbook/gates | Prepared; professional/owner decisions and independent human review outstanding |

Remaining runtime/container backlog: `frontend/Dockerfile` has three Node 20
stages and `npm install` rather than frozen installation; #218 overlaps. net8.0
remains in Audit, Gateway, Shared, Security, Identity wrappers, DeviceTrust wrapper,
SharedKernel and canonical Identity/DeviceTrust API projects. Gateway and canonical
Identity/DeviceTrust Dockerfiles retain .NET 8 images. #183/#230 overlap DeviceTrust
images, but installing SDK 11 alone would not retarget an app. These were not
broadly upgraded. No Docker engine/image-build/provenance evidence available.

The existing OpenAPI payload/response schema names do not fully match current
DeviceTrust model fields. This patch updates authorization/status documentation
only; full schema reconciliation remains a separate release gate. No root
LICENSE/COPYING file was found; licensing/contributor records need owner review.
A clean dependency audit does not prove license compatibility or code ownership.

## Recovery, reproducibility and review artifacts

See `docs/operations/authority-stabilization-review.md` for disabling, backup/
restore, original-key reconciliation, prepared Windows commands, hosted-CI gates,
retention/privacy/licensing decisions and proposed external-testing checklist.
Do not resume external use on unsupported .NET 8 or vulnerable frontend versions.
Reverting a focused change is a local code rollback, not a database reset; preserve
evidence and remain disabled until a supported candidate passes required gates.

Portable patches/manifest identify ordered application from the known base and
final head/tree. They are not execution permission for pushing or deploying.

### Draft PR descriptions (not submitted)

**Authority: enforce local listeners and fail closed on unsupported credential controls.**
The Development/Test service previously accepted overrides that could expose a
wildcard listener. Own explicit loopback endpoints, reject unsafe alternatives
and restrict frontend upstream to literal loopback. Windows CLI credential
operations are disabled pending native ACL validation. Linux 92/92 Debug and
Release, connected browser, session and three credential cases pass. Windows
native ACL and full Windows run remain blocked; authority transaction logic and
schema unchanged.

**Frontend: align lint dependencies without losing navigation diagnostics.**
Replace the legacy Next plugin/glob override with 16.4.6 config/plugin and current
compatible TypeScript ESLint dependencies. Retain local App Router link coverage
because a native-only trial missed a regression. Clean installation, 10 navigation
cases, 19 unchanged warnings, typecheck, production build and full audit zero pass.

**Gradle: verify wrapper distribution.**
Pin the official 9.3.1 archive checksum. Actual wrapper starts from verified private
cache. Project plugin/dependency resolution did not complete; hosted dependency
submission is not observed. Keep separate from existing duplicate mode-only PRs.

**DeviceTrust: enforce ownership and atomic mutation evidence.**
Adapt only four canonical source files from #135; add no-enrollment authorization,
atomic success audit, fail-closed denial evidence and generic problem responses.
17 canonical-source HTTP/PostgreSQL cases pass per configuration, including
rollback, concurrent callers and owner transfer under lock. Actual project builds;
net8.0 launcher/JWT and service-role validation remain unverified. Reconcile #107/
#135 overlap before publication; this is not independent human approval.

**Highest-value next engineering action:** implement and verify native Windows
credential ACL protection on a real Windows runner, then validate that protected
credential path in the full connected Windows workflow before restoring its use.
