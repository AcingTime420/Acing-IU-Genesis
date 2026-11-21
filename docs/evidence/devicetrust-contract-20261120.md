# DeviceTrust API contract reconciliation

Date: November 20, 2026 (America/Los_Angeles).
Branch: `fix/devicetrust-api-contract`, separate from the readiness disclosure
repair in draft PR #247. The parent source tree is
`865d5a8f40ca59c7d4ea7e328f7e6f3166aca5f1`, published in #247 as commit
`114aea0511a6889cd025eefbb22861d8fb9dfa20` and originally tested locally at
`3e0a45f7c2a34456ed1a9101775685031e047eca`.

## Problem and changes

The DeviceTrust OpenAPI document described a different request/response model:
`hardwareId`, `trusted`, device-name/platform fields and historical telemetry
flags did not describe canonical source. It also claimed strict rejection of
unknown input properties despite ASP.NET accepting them, and declared health
and authentication response shapes without runtime evidence.

The document now uses canonical wire fields: `hwIdentifier`, `socModel`, optional
defaulted telemetry flags, `allowed`, `threshold`, score breakdown and actual
device-list properties. Required fields and input length bounds reflect model
annotations; undocumented enum/range enforcement is not invented. Caller-supplied
Knox-related flags are explicitly not hardware attestation or certification.
Policy scores do not grant AI execution authority.

Seven new HTTP cases cover minimal telemetry with an unknown property, missing
required input, owned and foreign lookup, privileged listing, role denial and
anonymous access. A Python runner validates captured HTTP payloads against the
actual OpenAPI document using JSON Schema 2020-12, internal refs and format
checks. It requires exactly 11 observations including the four health cases.
Temporary synthetic observations are deleted after each run. CI invokes the
runner in both Debug and Release with pinned Python validator versions.

The initial new multi-class test run failed closed at the existing advisory
lease. The database tests now share one collection fixture and run serially
within that collection; the database guard and lease were not relaxed.

The first runtime contract comparison also rejected the old documented media
type for invalid telemetry. Actual automatic model-validation failures return
`application/json` under the controller's production attribute. The contract was
corrected to match that observed response; production response logic was not changed.

## Actual validation

Linux; .NET SDK 10.0.404 / runtime 10.0.15; PostgreSQL 17.11 in a new task-owned,
loopback-only cluster with exact disposable database `genesis_devicetrust_test`.
PyYAML 6.0.3 and jsonschema 4.26.0. No existing databases or live data were used;
the temporary PostgreSQL server stopped after each attempt.

| Check | Result |
|---|---|
| Complete canonical-source test project, Debug | 28 passed, no failures/skips |
| Complete canonical-source test project, Release | 28 passed, no failures/skips |
| Runtime OpenAPI observations, Debug | 11 validated |
| Runtime OpenAPI observations, Release | 11 validated |
| Obsolete `hardwareId` request shape | Rejected by corrected request schema |
| Claim-surface guard, YAML parsing, whitespace | Passed |

The 28 cases consist of 17 existing ownership regressions, 4 readiness/liveness
privacy cases and 7 new contract cases. Running the 11-case subset again for
observation capture is not additional distinct coverage. Test SDK emitted its
existing nonfatal artifacts-directory warning. Local runs used cached restored
packages and `--no-restore`; no fresh dependency-audit clearance is claimed.

## Limits and remaining gates

This is bounded conformance evidence, not complete API certification. The test
host links canonical source with synthetic identities; it does not validate the
production JWT launcher or native Windows behavior. Successful readiness,
whitespace-only input, all length extremes, every role/token combination and
all database failures remain outside these contract samples. The list endpoint's
uncaught database-failure boundary is explicitly documented rather than claimed
fixed. Full OpenAPI semantic linting was not performed.

No product capability, authorization policy, database schema, external model
integration, device operation or production access changed. Independent human
review and current hosted validation remain integration requirements. No merge,
deployment, outreach or pilot authorization is included.

Reproduction: follow the disposable-database instructions and contract commands
in `tests/DeviceTrust.OwnershipTests/README.md`. The CI addition uses the already
created disposable database after the complete suite, with the same safety guard.
