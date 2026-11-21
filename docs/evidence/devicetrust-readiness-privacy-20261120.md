# DeviceTrust readiness failure privacy repair

Engineering date: November 20, 2026 (America/Los_Angeles).

## Scope and baseline

Branch: `fix/devicetrust-readiness-disclosure`.
Base: PR #245 candidate `a432e1c512201b8704214c525768d4e816ea9259`.
The repository's default HEAD was independently queried and remained master
`4cf3181951ddc3366a193d49cb8ca32dce346bf7`. The retrieved PR #245 metadata
still identifies an open, unmerged draft stacked on #223. Hosted candidate
integrity, clean-clone CI and security workflow results were retrieved as
successful. Those historical results do not validate this new repair.

This focused stabilization branch was created in a separate clean checkout.
No owner Windows worktree, existing reviewer candidate, database schema,
authorization policy or AI execution boundary was changed. No outreach,
repository access change, push, merge, deployment or pilot approval occurred.

## Reproduced defect and repair

The canonical DeviceTrust health controller allows anonymous requests to
`/health/ready`. Its failure response included `ex.Message`. A dependency
exception can therefore place private infrastructure diagnostics in the public
HTTP response. This is source and synthetic-runtime evidence of a disclosure
path, not evidence of a production incident or exposed live credential.

Before the repair, three real HTTP regression cases injected synthetic database,
timeout and configuration exceptions containing a private-looking hostname,
username, password marker and filesystem path. All three failed because the
response disclosed the diagnostic; the liveness case passed.

The readiness failure now retains HTTP 503 and `status: not_ready` while returning
the constant detail `Device trust is unavailable.`. Success behavior and liveness
are unchanged. The OpenAPI readiness-503 media type and schema now describe this
JSON payload rather than claiming a problem-details payload for that response.
Other existing DeviceTrust contract inconsistencies are outside this repair.

## Validation

Actual tools: .NET SDK 10.0.404, ASP.NET/.NET runtime 10.0.15;
PostgreSQL 17.11 in a new task-owned loopback-only cluster. The database was
exactly `genesis_devicetrust_test`, using only synthetic fixtures. The existing
schema-reset guard and advisory lease remained enabled. The cluster was stopped
after validation. No existing database was used.

| Check | Result |
|---|---|
| New failure-path HTTP regressions before repair | 3 failed, 1 passed; diagnostic disclosure reproduced |
| New health HTTP regressions after repair, Debug | 4 passed, 0 failed, 0 skipped |
| New health HTTP regressions after repair, Release | 4 passed, 0 failed, 0 skipped |
| Complete DeviceTrust canonical-source suite with real PostgreSQL, Debug | 21 passed, 0 failed, 0 skipped |
| Complete DeviceTrust canonical-source suite with real PostgreSQL, Release | 21 passed, 0 failed, 0 skipped |
| Claim-surface guard | Passed |
| OpenAPI YAML parsing and readiness response assertion | Passed; not full contract conformance |
| Whitespace check | Passed |

The total is the existing 17 ownership cases plus 4 new health cases. The tests
link canonical controller/service/repository sources into the isolated .NET 10
host. They do not validate the net8.0 production launcher, JWT configuration,
containers, native Windows behavior or production readiness. The health failure
tests use injected exceptions; successful readiness against PostgreSQL was not
newly tested. The existing ownership cases do use real PostgreSQL.

The initial normal restore and test completed and reproduced the defect. A later
local restore used the existing package cache with `NuGetAudit=false` for offline
test execution only. No dependency versions, repository audit settings or CI
security gates changed. No fresh vulnerability clearance is claimed. A nonfatal
existing Test SDK artifacts-directory fallback warning was emitted.

Reproduce the focused health checks without a database:

```sh
dotnet test tests/DeviceTrust.OwnershipTests/DeviceTrust.OwnershipTests.csproj --configuration Debug --filter FullyQualifiedName~HealthPrivacyTests
dotnet test tests/DeviceTrust.OwnershipTests/DeviceTrust.OwnershipTests.csproj --configuration Release --filter FullyQualifiedName~HealthPrivacyTests
```

For the full suite, use the disposable database instructions in
`tests/DeviceTrust.OwnershipTests/README.md` and omit the filter. Existing CI already
runs that complete project in Debug and Release; no workflow expansion was needed.

## Next gate

This branch needs review and current hosted validation before integration.
PR #245's independent human review remains outstanding; this patch is not a
substitute. Review its small delta separately and preserve the exact candidate
commit supplied to volunteers until a replacement is deliberately communicated.
Subsequent work should reconcile the remaining API contract and supported-runtime
gaps, with production identity/recovery and privacy/retention still pilot gates.
