# Delegated-action acceptance reference — simulator only

Status: local validation harness; application integration is deferred. This is
not a working Genesis authorization service, an AI integration, a payment system,
or production security evidence. It makes no device changes and calls no network
services. Its Python implementation is test infrastructure, not a new backend
language decision.

## Run

From the repository root, using Python 3.11 or later:

```sh
python3 tests/delegated_action/test_acceptance.py
```

Windows with the Python launcher:

```powershell
py -3 tests/delegated_action/test_acceptance.py
```

The standard-library suite exits nonzero on failure. Each test uses a fresh
temporary SQLite database containing synthetic records; cleanup deletes that
database after the test. Nothing persists between runs. The durability test
reopens a connection during the test, not after process or machine failure.

## Scenario and authority

Sarah, a fixture manager with authority only over Project Phoenix, grants one
fixture agent permission to approve eligible USD expenses of at most 50,000
integer cents **per expense** until a deadline. There is no aggregate spending
budget in this model. Approval changes a local record's status; it does not send
money. The fixture agent cannot grant, approve, or revoke authority.

Consequential execution also needs a separate human operation approval binding
the expense ID, project, amount, currency, recipient, eligibility and revision.
Material edits invalidate the approval. A new approval can authorize the revised
operation if it remains inside the grant. Identity tokens are random in-memory
fixture credentials, never caller-supplied role assertions or audit fields.
The manager's project authority is a fixed fixture, not an implemented ownership
or organizational authority service.

## Acceptance coverage

| Requirement | Reference coverage | Product evidence still needed |
|---|---|---|
| Named human grants bounded authority | Explicit principal, project, operation, currency, amount and expiry | Authenticated human identity and verified resource authority |
| Independent enforcement on every attempt | Simulator rechecks persisted grant and inputs | Enforcement in the real action service, outside model control |
| Outside-scope attempts do not mutate | Unknown resource, other project/principal, amount, currency, eligibility and operation denials | Real API and storage integration tests |
| Approval binds material inputs | Input digest and revision; cross-resource/grant approval rejection | Human review UI, normalization contract and real approval storage |
| Revocation and expiration | Checked inside the same write transaction as execution | Identity/session revocation and queued-worker integration |
| Retries and concurrency | Eight-connection retry, two distinct requests, revocation race | Cross-process/service tests against the product database |
| Durable, understandable evidence | Transactional audit, linked identifiers, denials, input origin and audit-failure rollback | Access control, retention, redaction, crash recovery and independent verification |
| Local-only bounded demonstration | Temporary synthetic database, no network, no device executor | Reviewed product adapter before any application capability claim |

## Ordering and failure semantics

SQLite `BEGIN IMMEDIATE` serializes writers across separate database connections.
Successful transaction commit is the linearization point. Execution that commits
before revocation may succeed; execution after a revocation commit is denied.
Already committed actions are not undone. The race test accepts either valid
ordering and verifies that the durable evidence agrees with the outcome.

Revocation and expiry are evaluated before replay receipts. An exact retry under
an active grant returns `replayed` without another mutation. After revocation it
returns `revoked`, even if the original request succeeded. A reused request ID
for another authorized operation returns `request_conflict`. An expense can be
approved only once even with distinct request IDs. Approval, revocation, and
execution evidence must commit; an audit write failure raises an error and rolls
back the mutation and receipt rather than returning success.

The implementation uses host wall-clock time. Production needs a defined trusted
time source and clock-failure behavior. A direct database writer can bypass the
model. Hashing input fields is approval binding, not tamper-proof audit storage.
No external side effect is covered by the SQLite transaction.

## Deferred application implementation

Under `docs/governance/STABILIZATION_POLICY.md`, keep product feature expansion
deferred until the gate is satisfied or the owner records an applicable exception.
This addition is limited to tests, validation automation and documentation.

After that gate, the proposed order is:

1. Define verified human/resource authority and authenticated agent identities.
2. Add reviewed migrations for grants, operation approvals, revocation, receipts
   and evidence under the canonical `backend/` ownership rules.
3. Implement an action service that rechecks all authorization and binds approval
   to normalized persisted inputs. Treat agent output as untrusted input.
4. Implement concurrency and idempotency using the actual database; specify queued
   work, already-started actions, retries and external side effects separately.
5. Adapt these cases into integration tests against that service. A passing
   reference model cannot substitute for those tests.
6. Add a human review/revocation view that shows exact scope, limits and outcomes.
7. Update capability claims only after reviewed implementation and evidence.

This follows ADR-005 audit boundaries and ADR-007 governed AI intent. Runtime
code, UI, installer payload, deployment settings and device executors are outside
this change. No stabilization-policy exception or release authorization is created.
