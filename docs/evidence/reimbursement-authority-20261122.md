# Internal reimbursement authority validation

Recorded November 22, 2026 (America/Los_Angeles). Additive candidate stacked on
baseline PR #249, commit `2042df3e2962e52e4e1fb72955aadf3c4b2ab78f`.
Local tests used an isolated Linux checkout and synthetic disposable databases.
No existing Windows checkout, production service, payment system or device changed.

## Result and scope

The existing HumanAuthority service now supports a separate exact internal
reimbursement-approval operation, with a human manager reviewer at
`/genesis/reimbursements`. Each proposal binds one agent and one record to its
organization, project, designated manager, category, USD amount, maximum amount,
version and expiry. A single-use human-approved grant permits one internal
pending/version-0 → approved/version-1 transition. The original document-append
schema and API remain separate and their connected demonstration still passes.

The model is not an authority source and is not integrated in this change.
Organization/project membership is provisioned through trusted local fixtures;
there is no production identity, organization administration or employee expense
intake. The maximum is per exact record, not a reusable or cumulative budget.
There is no payment execution or paid inference API.

Implementation and setup: [prototype guide](../prototypes/genesis-reimbursements.md).
Machine-readable contract: [OpenAPI](../irp/03-openapi/genesis-reimbursements.openapi.yaml).

## Final executed validation

Toolchain: .NET SDK 10.0.404 / ASP.NET runtime 10.0.15, PostgreSQL 17.11,
Node 24.22.3, Next 16.4.6 and cached Playwright 1.65 Chromium headless shell.
PostgreSQL listened only on loopback in a task-owned temporary cluster. Backend
suites used `genesis_reimbursement_test`; connected demonstrations used a separate
new `genesis_authority_test`. No customer data or existing database was used.

| Check | Final result |
|---|---|
| Entire authority HTTP/PostgreSQL suite, Debug | 168 passed, 0 failures, 0 skips |
| Entire authority HTTP/PostgreSQL suite, Release | 168 passed, 0 failures, 0 skips |
| Next production webpack build | Passed, including new API and reviewer routes |
| Explicit TypeScript check | Passed |
| Frontend adapter/session/lint rule suites | 24 passed |
| Production Next HTTP boundary suites | 6 passed, using synthetic upstreams |
| ESLint | 0 errors; 19 pre-existing warnings |
| Fresh frontend npm audit | 0 known vulnerabilities reported at run time |
| Real reimbursement Chromium/API/PostgreSQL demo | Passed |
| Existing append Chromium/API/PostgreSQL demo | Passed |
| Actual reimbursement CLI workflow | Passed |
| Existing Python credential guards | 5 passed, 3 native-Windows-only skips |
| Claim-surface / whitespace / YAML / relative links | Passed |
| OpenAPI local-ref and JSON Schema checks | Passed; bounded structural checks, not full runtime conformance certification |

The 168 backend tests include existing append/listener/database guards and the
new reimbursement cases; Debug and Release runs are repeat executions, not 336
distinct scenarios. Test SDK emits an existing nonfatal artifacts-directory
warning. The local .NET dependency restore used available package caches;
frontend audit does not establish whole-repository vulnerability clearance.

New real HTTP cases exercise each execution scope field, missing approval,
agent self-approval, foreign and same-organization principal mismatch, rejected
and stale proposals, per-record limits, strict required fields and integer money,
expired proposals including expiration during lock waits, enabled/disabled
principals, memberships/role changes, offboarding during a lock wait, generic
foreign-target denials, identical and modified retries, separate append key
namespace, simultaneous same/different-key executions, both revocation orderings,
and evidence-storage failure rollback for allowed and denied attempts. Assertions
check PostgreSQL state and receipts, not only HTTP status. A row-lock regression
also verifies foreign reads/proposals reject without waiting on the resource.
Migration 002 reruns preserve records and active authority.

The 19 missing-field regressions verify every new create/propose/execute field,
including expectedVersion, returns 400 without allocating authority, attempt,
evidence or retry records. New request records use JsonRequired explicitly so
omission cannot silently select a constructor default.

## Connected browser and CLI observations

The production-built reimbursement reviewer authenticated the human manager,
showed the exact scope, and recorded explicit approval. Separate agent execution
created one approval; retry returned the same attempt. The UI refreshed to
approved/version 1 with the corresponding evidence. A second proposal made stale
by that execution received 409, disabled approval after refresh and remained
rejectable. Another record was approved then revoked through the reviewer;
agent execution returned 403, pending/version 0 remained unchanged, and the
revoked grant/denial evidence agreed with SQL.

The initial browser attempt stopped on a test selector that matched both the
application error and Next's accessibility announcer. The selector was scoped to
the reimbursement error and the complete harness rerun passed; no enforcement
failure was observed. Early database process-lifetime setup was corrected before
counting the final suite results above.

The original connected append harness independently passed exact append, same-key
retry, stale rejection and revoked execution with the updated service. The actual
CLI smoke provisioned a new synthetic organization/project for existing private
principals, created a record, proposed, reviewed, explicitly approved, executed,
retried/reconciled and fetched actual evidence. General authority reset was then
attempted and rejected because reimbursement records depend on those principals;
the approved record was preserved. Private temporary credentials and test process
output were not committed.

## Review and remaining gates

A separate AI code review inspected the new backend, migration, browser boundary,
CLI and reset guard and identified no blocking issue in the reviewed code.
Implementation/design reviewers also prompted corrections for entitlement-before-
lock filtering, deterministic identity/membership locking and explicit required
JSON fields. This is AI review, not independent human review or certification.

Native Windows reimbursement execution, full accessibility evaluation, production
JWT/organization provisioning, database runtime-role hardening, backup/restore,
privacy/retention policy, cryptographic evidence authentication and external pilot
readiness remain unverified. Ordinary persisted evidence is not tamperproof.
Missing optional schema 002 fails reimbursement requests closed; the old general
readiness endpoint still checks schema 001 only. Existing connected workflows
remain Development/Test-only and must stay on loopback.

CI now includes the new frontend suites, the opt-in reimbursement migration and
the connected reimbursement harness. Local results above are not a claim that
those newly published hosted checks have completed. No merge, deployment, paid
service, legal filing, model installation or independent human approval occurred.
