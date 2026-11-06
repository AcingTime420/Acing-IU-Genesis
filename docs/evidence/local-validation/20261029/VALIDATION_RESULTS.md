# Validation results and coverage limits

Date: 2026-10-29. Prepared by Manus AI from preserved local evidence. **These are historical staged results, not a fresh run of this documentation branch.** Full SHAs and scope are in [README](README.md); structured allowlisted counts/exits are in [VALIDATION_RESULTS.json](VALIDATION_RESULTS.json).

## Application results

| Tested source | Check | Result | Meaning / limitation |
|---|---|---|---|
| C67 | Public-only NuGet restore and backend Release build | PASS, exit 0 each | Process-local environment repair; normal TLS; isolated package config/cache. Not a deployment or all-project integration result. |
| C67 | Identity unit tests | PASS, 15/15, exit 0 | No skipped tests reported. |
| C67 | DeviceTrust scoring unit tests | PASS, 6/6, exit 0 | Distinct from ownership integration coverage below. |
| C67 | Frozen frontend install | PASS, exit 0 | Node 24.18.0 / npm 11.16.0; public registry; normal TLS. Lifecycle permissions were not blindly broadened. |
| C67 | TypeScript / ESLint / production build | PASS, exit 0 each | ESLint reports 19 warnings, not zero warnings. Production build used the reviewed webpack lane. |
| C67 | Frontend dependency audit | **FAIL, exit 1** | Two vulnerable package nodes, four GHSA records; one critical and one high package classification. See frontend analysis. |
| C67 | Frontend unit suite | NOT RUN | No declared unit-test script/files were found. No fabricated test pass. |
| C67 | Android Gradle task discovery / debug Kotlin compile | PASS, exit 0 each | Online retry resolved a missing offline dependency into a fresh scratch-only Gradle cache. JDK 21.0.8; Gradle 9.3.1; platform 36.1. |
| C67 | Selected Android JVM/Robolectric tests | PASS, 4/4, exit 0 | Three Robolectric and one ordinary unit test; no skips. Not screenshot, emulator, physical-device or signed release validation. |
| Guardian PR #179 | Guardian build | PASS, exit 0 | Recovered Kotlin CLI 2.0.0, JDK 21.0.8 and GNU Make toolchain; detached candidate only. |
| Guardian PR #179 | Build-exit-status and Make-failure fixture regressions | PASS, exit 0 each | Fixture-only tests; shell/tool adapter issues were corrected in scratch, not repository source. |
| Guardian PR #179 | Package parity / shell syntax / JAR table | PASS | Six artifacts copied byte-for-byte; syntax and JAR-list exits 0. Artifact hashes are preserved in structured evidence, not the binary files. |
| Guardian PR #179 | Disposable PostgreSQL SQL initialization / constraint test | PASS, exit 0 | Eight reviewed initialization files and constraint SQL on isolated PostgreSQL 17.11; teardown verified. Not the PostgreSQL 16 container lane. |
| HumanAuthority PR #164 | Complete suite on UTF-8 PostgreSQL | **FAIL, 76/77, exit 1** | 0 skipped; one artifact-path portability assertion. Authorization, revocation, idempotency, evidence and concurrency tests did execute. |
| DeviceTrust local ownership candidate | Authorization/unit tests | PASS, 35/35, exit 0 | Exact tested SHA is older than the active remote PR #107 head. |
| DeviceTrust local ownership candidate | Real PostgreSQL ownership/concurrency/rollback tests | PASS, 4/4, exit 0 | Real database tests, not mocks. Same older-head limitation. |

## Important environment and retry qualifications

The October 27 reports reflect a different constrained executor state and mostly blocked builds. Later October 29 evidence supersedes those environment observations where explicitly verified; it does not rewrite the original reports. Java/Kotlin/Make and package access were restored using isolated/process-local mechanisms. No TLS verification was disabled and no global Python alteration was made for skill validation.

The first application-database attempt used a Windows default encoding that could not represent test Unicode data. A fresh UTF-8 cluster (`initdb --encoding=UTF8 --locale=C`) and unchanged Release assemblies eliminated those encoding failures. The final HumanAuthority result is still 76/77; runner exit 0 for evidence capture must not be confused with the test child's exit 1. DeviceTrust's four database tests passed on the UTF-8 retry. Raw first-attempt and retry logs remain private and preserved.

Temporary database validation used a fresh loopback-only cluster, verified data-directory identity, scoped SCRAM roles, and fresh `_test` databases. The fixture drops its test schema, so both target and isolation were reviewed before execution. The cluster was stopped and its marker-owned data directory removed; the test port was confirmed idle. No native database, existing Docker resources or production system was targeted.

The Guardian package check parses shell scripts; it does not execute their device-changing entrypoints. No Guardian firmware installation, hardware security certification, device attestation or production tamper-resistance claim is supported by a successful local JAR build.

## Not performed / still required

No full clean-clone premerge validation was run for this documentation publication. No deployment, release, master push, PR merge or stabilization-issue closure was performed. Repository-prescribed CI and independent review remain required before merge.

The following must not be silently inferred from partial successes: exact PostgreSQL 16 image compatibility; complete Compose runtime and installer runtime; end-to-end behavior on an integrated final source head; default versus alternative frontend bundler equivalence; Android screenshot/device/emulator/release-signing coverage; production Guardian integration; or runtime exploitability of package advisories.

Source-candidate changes require affected suites at the new SHA. Preserve raw results and count changes instead of simply reusing this table. [Codex handoff](CODEX_HANDOFF.md) defines that boundary.
