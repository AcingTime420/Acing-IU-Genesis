# HumanAuthority .NET 10 migration — local review evidence

Research and execution date: November 18, 2026. Verdict: **Implemented with validation blocked as listed below.** No pilot or production approval. Nothing pushed, merged, deployed, or submitted to GitHub.

## Provenance and scope

Canonical repository: https://github.com/AcingTime420/Acing-IU-Genesis

Verified default branch `master`: `4cf3181951ddc3366a193d49cb8ca32dce346bf7`.
PR #222: open draft, head `9d0876aa7d9794f9547d57fe42a2a7e980cd8cda`, base `a72349737cd6424c2f5f9bb82de1c11a5881e7c8` (#165). Copilot review was COMMENTED, not approval.
PR #223: open draft, head `e200b031b59126f5034b556022614eaa55f04080`, base #222; no submitted reviews returned.
The integrated candidate is #223, not master. Existing runtime-related work was searched before implementation; no matching HumanAuthority migration was found. PR #236's test-SDK update is separate work, not proof this slice was migrated.

Starting commit: `e200b031b59126f5034b556022614eaa55f04080`.
Isolated local branch: `codex/human-authority-net10`.
Local worktree: `/workspace/scratch/793af41f1407/genesis-net10`.
The owner's Windows worktree was not accessed or changed. A separate fresh clone and linked worktree were created. No repository AGENTS.md was present in the inspected tree. Repository governance, stabilization policy and supply-chain finding policy were read; the owner's explicit isolated-worktree authorization governed this work.

Local implementation commits:

- `eaa5eac67c3b24a24d525401e76e8f9624a8694d`: Gradle executable bit only, 100644 → 100755. Blob `adff685a0348c64b2b64f0b302f1f82b28eeaaea` unchanged; contents and line endings preserved.
- `e373a45fa77bcc7d81c4a02628905704bf5a75f5`: authority runtime migration. **Tested source head**; tree `83fd0c46199ceba619c6e9b4d9910a07ff04b9fe`.

This evidence document is added in a later documentation-only commit. The delivery manifest records that final commit and tree; tests above refer to the implementation head, not a falsely self-referential report hash.

## Runtime and compatibility decision

Microsoft's current support policy and release metadata were checked:

- https://dotnet.microsoft.com/en-us/platform/support/policy
- https://learn.microsoft.com/en-us/lifecycle/products/microsoft-net-and-net-core
- https://builds.dotnet.microsoft.com/dotnet/release-metadata/10.0/releases.json
- https://learn.microsoft.com/en-us/nuget/concepts/auditing-packages

.NET 8 support ended November 10, 2026. .NET 10 is LTS through November 14, 2028. The installed/tested SDK was **10.0.404**, MSBuild **18.9.15**, Microsoft.NETCore.App and Microsoft.AspNetCore.App **10.0.15** on Linux x64. Application and test-host host traces selected 10.0.15; this is actual process-runtime evidence, not merely `dotnet --version`. Child application traces selected the matching Debug or Release/net10.0 DLL. Tests also assert `Environment.Version.Major == 10`.

Other tools: Node 24.22.3; npm 11.9.0; PostgreSQL server 16.15; Java 21.0.13; Gitleaks 8.30.0. PostgreSQL binaries were reused read-only; cluster and state were task-owned, disposable and synthetic. No user database was used. Credentials were not committed. Local database access used a loopback-only disposable trust-authenticated role inside the isolated execution environment; this is not a production authentication recommendation.

Npgsql 8.0.6, Microsoft.NET.Test.Sdk 17.11.1, xUnit 2.9.2 and adapter 4.0.0 were retained: fresh direct/transitive audits reported no known vulnerabilities and both actual runtime configurations pass the existing enforcement tests. Package-major upgrades are not a prerequisite for retargeting and would widen scope. The test runner emits a nonfatal `VSTEST_ARTIFACTS_DIRECTORY` fallback warning suggesting an older Test SDK; record it as tooling debt, not a failed enforcement test or a clean-warning claim.

## Changes and preserved boundaries

Both authority project files target net10.0. Only the authority-specific Linux/Windows CI jobs switch to .NET 10. Other .NET 8 projects/containers are outside scope.

Artifact validation requires matching configuration, net10.0 runtime metadata and ASP.NET Core major 10. Missing/stale metadata fails rather than falling back to net8 or another configuration. The connected-browser harness explicitly uses Release/net10.0 and LatestPatch roll-forward. The test child service also uses LatestPatch.

Security CI now explicitly restores/audits the authority test project and its service project reference with transitive NuGet auditing. Audit warning codes NU1900–NU1905 are errors, including source failures. The workflow also runs on stacked pull requests rather than only PRs targeting master. No production permissions or pull_request_target trigger was added.

No changes were made to AuthorityDatabase.cs, AuthorityEndpoints.cs, AuthorityModels.cs, Program.cs, database migration, frontend API proxy or session authority. No schema changes. Existing human/agent separation, exact proposal matching, database-time expiry after locks, serialization, atomic append/evidence/idempotency, and same-key recovery remain under the existing PostgreSQL integration tests. Passing tests support these scenarios; they are not independent security certification.

## Reproducible validation and results

Commands ran from the isolated worktree unless a frontend directory is stated. `dotnet` resolved to the task-owned SDK. Logs were kept outside the repository. Services and tests must share the same execution network namespace in this environment; initial cross-invocation attempts could not connect. They were rerun in one shell with PostgreSQL and passed. The final results below supersede that resolved infrastructure setup failure.

The disposable database guard was inspected before execution. The cluster contained only synthetic `genesis_authority_test`, role `authority_test`, bound to 127.0.0.1:55439 with Unix sockets disabled. The test connection string was supplied via environment, never a tracked configuration. The service was stopped and the database preserved after validation.

| Command/check | Exit | Result |
|---|---:|---|
| `dotnet --info` | 0 | SDK 10.0.404, runtime 10.0.15 |
| `dotnet restore tests/HumanAuthority.IntegrationTests/HumanAuthority.IntegrationTests.csproj` | 0 | Restore succeeded |
| `dotnet restore tests/HumanAuthority.IntegrationTests/HumanAuthority.IntegrationTests.csproj --force-evaluate -p:NuGetAudit=true -p:NuGetAuditMode=all -p:NuGetAuditLevel=low '-p:WarningsAsErrors=NU1900%3BNU1901%3BNU1902%3BNU1903%3BNU1904%3BNU1905'` | 0 | Strict audit including feed warning failures |
| `dotnet build tests/HumanAuthority.IntegrationTests/HumanAuthority.IntegrationTests.csproj --configuration Release --no-restore` | 0 | Both projects built; zero compiler warnings/errors |
| `dotnet test tests/HumanAuthority.IntegrationTests/HumanAuthority.IntegrationTests.csproj --configuration Debug --no-restore --logger trx --results-directory <external-results>` | 0 | Service built/launched, 81 passed, 0 failed/skipped |
| Same test command, `--configuration Release` | 0 | Service built/launched, 81 passed, 0 failed/skipped |
| `DOTNET_HOST_TRACE=1` / external `DOTNET_HOST_TRACEFILE` during tests | 0 | Test host and launched app selected runtime 10.0.15 |
| `dotnet list <service-or-test.csproj> package --vulnerable --include-transitive --format json --no-restore` | 0 each | Both explicit project audits found no known vulnerabilities |
| Frontend `npm ci` | 0 | Lockfile installation; no dependency changes |
| `npm run test:genesis` | 0 | 9 adapter tests passed |
| `npm run test:genesis-session` | 0 | 3 session tests passed |
| `npm run test:genesis-live-http` | 0 | 3 HTTP boundary tests passed; synthetic upstream, not PostgreSQL enforcement |
| `npx tsc --noEmit --incremental false` | 0 | Explicit type check passed |
| `npm run lint` | 0 | 19 existing warnings, no errors |
| `npm run build` | **1** | Next 16.4.3 compiles then raises SecurityFatalError for its pinned version; production build not passed |
| `npm audit --json` | **1** | 10 moderate, 0 high/critical vulnerabilities |
| `npm audit --audit-level=high` | 0 | No high/critical findings; moderate findings remain |
| `node --check frontend/tests/genesis-connected-browser.mjs` | 0 | Syntax only, not browser execution |
| YAML parse of modified workflows | 0 | ci.yml 7 jobs; security.yml 5 jobs |
| `bash scripts/check-claim-surface.sh` | 0 | Passed |
| Recursive tracked artifact inventory / `git diff --check` | 0 | Passed; no tracked build outputs |
| `git ls-files --stage gradlew` | 0 | 100755, original blob |
| `./gradlew --version` | **1** | Permission fixed; Gradle 9.3.1 distribution download failed with Network is unreachable |
| `gitleaks git . --log-opts='e200b031b59126f5034b556022614eaa55f04080..HEAD' --redact=100 ...` | 0 | No findings in implementation changes |
| `gitleaks git . --redact=100 ...` | **1** | 907 historical potential findings across 477 commits; untriaged, not 907 proven live secrets |

The historical 78 cases become **81**: one actual-runtime assertion and two stale-runtime artifact rejection cases. All prior cases remain. Meaningful existing cases include exact append/replay, wrong scope/identity/version, stale/expired approval, concurrency, both revocation/execution orderings, evidence rollback, changed fingerprint, disconnect/restart reconciliation and foreign evidence isolation. No historical result is counted as a current run.

Fresh npm audit identifies moderate Next advisories including https://github.com/advisories/GHSA-mfr8-8qww-v76h and https://github.com/advisories/GHSA-vc7v-qv4w-wrv8. A separately reviewed frontend dependency patch and full rebuild are needed; the runtime patch does not bypass the safeguard. No potentially sensitive full-history findings are reproduced here. Their presence requires triage and, if real credentials are confirmed, revocation/rotation before release.

### Checks explicitly not completed

- **Connected production-built frontend → real service → PostgreSQL**: blocked by failed production frontend build. The passing synthetic HTTP suite is not a substitute. No browser/database end-to-end success is claimed for this patch.
- **Windows artifact/database guards and full Windows browser/database run**: no Windows runner available. Modified CI is unexecuted remotely.
- **Gradle distribution startup and dependency submission**: network failure prevented download; no dependency submission was attempted or observed. Original job 131556087690 is historical, not repaired-run evidence.
- **New hosted CI/security jobs or independent human review**: not triggered; no push authorized.
- Full-history secret findings remain untriaged. No claim of repository-wide secret clearance.

Earlier exact-head GitHub CI (run 43325285681) reported 78 cases/configuration, Linux connected browser success, and focused Windows 14/configuration. Those are historical only and do not validate this migration.

## Disable and rollback

Stop the authority process and connected frontend; disable/unset the local live integration flag (`GENESIS_LOCAL_LIVE`) in the external environment. Confirm listeners have stopped. Keep the PostgreSQL data directory and evidence records intact; do not reset/drop schemas as a rollback action. Use the original idempotency key to reconcile an uncertain outcome before attempting new work.

To undo this code migration on an isolated branch, revert the migration commit (and its documentation commit if desired). The Gradle executable fix can remain. Do not run the reverted .NET 8 workflow for external use: remain disabled until a supported-runtime candidate and its release gates pass. No database migration or reversal is required by this patch.

## Remaining work, separately scoped

1. Review and patch frontend advisory/build blocker; rerun production build and the actual connected browser/service/PostgreSQL test.
2. Run Windows artifact/database guards and full connected run, then hosted CI after owner-authorized publication.
3. Complete Gradle distribution startup and observe dependency submission with network access.
4. Triage historical secret-scan findings without exposing values.
5. Keep separate: enforced loopback confinement; Windows credential ACL validation; DeviceTrust ownership/audit atomicity; other unsupported Node 20/.NET 8 containers; frontend container lockfile reproducibility; privacy/licensing/recovery/retention and independent human review gates.

## Draft PR description (copy after review; not submitted)

**Title:** Migrate the local HumanAuthority slice to .NET 10 LTS

The local authority service and integration tests targeted an unsupported runtime. Retarget both to net10.0, update authority CI, explicitly audit this project graph, and reject missing/stale runtime artifacts without configuration/runtime fallback. Preserve all authorization and database transaction logic. A preceding separate commit restores gradlew's executable bit without changing its contents.

Validation: actual .NET 10.0.15 service/test-host processes; 81/81 integration cases in Debug and Release against disposable PostgreSQL; adapter 9, session 3 and HTTP boundary 3 passing; explicit TypeScript and lint passing; NuGet audits clear. Three added cases verify runtime and stale-artifact rejection.

**Not ready for pilot/release:** production frontend build fails its pinned Next security safeguard, so real connected browser validation remains blocked. Windows and new hosted CI unrun; Gradle download blocked by network. npm has 10 moderate findings; full-history Gitleaks reports 907 untriaged historical potential findings, while this implementation diff has none. No schema or operating authority expansion. This migrates one local prototype slice, not the whole repository.
