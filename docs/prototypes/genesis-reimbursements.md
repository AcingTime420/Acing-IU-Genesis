# Internal reimbursement approval prototype

**Development/Test only, synthetic data, not production.** This additive workflow
uses the existing HumanAuthority authentication boundary and a separate
`genesis_reimbursements` schema. Document append remains available unchanged.
It records approval of an internal reimbursement; it cannot transfer money.

## Exact authority

An enabled human manager in an enabled organization creates one synthetic record
for an enabled project: category, positive integer USD cents and designated
manager. An enabled agent member proposes one exact approval with a maximum
amount and a lifetime of 1–600 seconds. The server derives organization, manager,
project, category, currency and amount from the record, not from model output.

The manager reviews and explicitly approves or rejects that proposal. Approval
creates a single-use grant; it does not execute the approval effect. The agent
executes separately. Approval is allowed only when the exact amount is within
the reviewed limit. The limit is per exact reimbursement, not a cumulative budget
or reusable delegation. Only USD is supported. Values use integer cents, bounded
at 1,000,000,000,000 to stay exactly representable in JavaScript.

Membership and projects are provisioned by trusted local fixture administration.
There is no self-enrollment, organization-management UI, production organization
identity or employee reimbursement submission integration. A model cannot assign
memberships, approve a proposal or change enforcement. The subsequent experimental
[local proposal bridge](../../backend/LocalInference/README.md) connects local
inference to proposal staging only. Its governance pipeline is tested with simulated
model responses; actual inference validation remains pending.

## Local setup

Use an isolated checkout and the existing
[authority setup](genesis-live-integration.md), with a newly created disposable
`genesis_authority_test` database on loopback, Node 24, .NET 10 and PostgreSQL.
Keep the existing private human/agent fixture file outside the checkout. Existing
`genesis-authority.py` database-name, environment and credential-file guards apply.
On native Windows, build the Release credential helper as required by that setup.
Do not copy credentials into source, browser storage, terminal screenshots or logs.

The existing `migrate` command applies authority migration 001 only. Reimbursements
require a separate explicit command, after 001:

```sh
python3 scripts/genesis-reimbursements.py --credentials "$GENESIS_CREDENTIAL_FILE" migrate
python3 scripts/genesis-reimbursements.py --credentials "$GENESIS_CREDENTIAL_FILE" fixtures
```

`GENESIS_CREDENTIAL_FILE` is the actual private fixture path from local setup.
The fixture command prints generated `organizationId` and `projectId`; it grants
the two existing test principals manager/agent membership only in that new
synthetic organization. It requires trusted PostgreSQL fixture credentials and
never prints bearer credentials. Each invocation creates a separate organization.
The migration is idempotent; it neither grants memberships nor migrates live data.
The general `/health/ready` still describes authority schema 001, not the optional
reimbursement schema; missing 002 causes reimbursement requests to fail closed.

The script's `create --help`, `propose --help`, `review --help`, `execute --help`
and other subcommands expose exact required arguments. Example sequence using
IDs returned by the commands:

1. With the loopback authority service running, human `create`: organization, project, category and amount in cents.
2. Agent `propose`: reimbursement ID, expected version 0, maximum amount in cents,
   lifetime and a new private output file outside the checkout.
3. Start the production-built frontend
   with `GENESIS_LOCAL_LIVE=1` and `GENESIS_AUTHORITY_URL` set to its literal
   loopback origin. Open `/genesis/reimbursements`.
4. Enter the human manager development credential and proposal UUID. Review every
   field, then approve, reject or revoke through the browser.
5. Separately run `execute` with the saved proposal file, granted UUID and a new
   idempotency key. Retry an uncertain request with the **same** key and exact body.
6. Refresh the reviewer and inspect record status/version and evidence. Repeat on
   another record, revoke before execution, and confirm denial with no state change.

The CLI also supports explicit human `approve`/`reject`, requiring matching
`--proposal-id` and `--confirm-exact-proposal`; these commands are not invoked by
proposal generation or agent execution. `record`, `evidence` and `reconcile`
retrieve actual server records. On HTTP/transport failure the CLI exits nonzero;
it does not print invented success. Browser data loads use separate reads and
are labeled accordingly. Browser sessions are isolated from append sessions,
process-local, HttpOnly, SameSite Strict and limited to 15 minutes.

## HTTP contract

Machine-readable contract:
[OpenAPI 3.1](../irp/03-openapi/genesis-reimbursements.openapi.yaml).

All paths below are relative to `/v1/authority/reimbursements`. Global strict JSON
binding rejects unknown properties and noninteger amounts; bearer authentication
is inherited from HumanAuthority. Human and agent credentials are distinct.

| Method/path | Caller and input | Result |
|---|---|---|
| POST `/records` | Human manager: organizationId, projectId, category, amountMinor, currency=USD | 201 record; manager derived from caller, pending/version 0 |
| GET `/records/{id}` | Designated manager, current enabled membership | Current record; foreign/unknown 404 |
| GET `/records/{id}/proposal-context` | Current agent member and enabled manager/project/organization | Pending context only; human 403, foreign/unknown/disabled scope 404, nonpending 409 |
| GET `/records/{id}/evidence` | Same manager boundary | Ordered persisted evidence |
| POST `/proposals` | Agent member: reimbursementId, expectedVersion, maxAmountMinor, ttlSeconds | 201 immutable derived scope |
| GET `/proposals/{id}` | Bound manager or requesting agent, current scope | Immutable proposal |
| POST `/proposals/{id}/decision` | Designated manager: decision=approved/rejected | Decision and nullable grantId; stale/expired/over-limit first approval 409 |
| GET `/grants/{id}` | Bound manager or agent, current scope | Grant state; validity also depends on proposal expiry and current policy |
| POST `/grants/{id}/revoke` | Designated manager: reason | Terminal revoked grant, or unchanged consumed/revoked state |
| POST `/execute` | Bound agent: exact tuple and `Idempotency-Key` | 200 allowed or 403 denied attempt; changed-body key replay 409 |
| GET `/attempts/by-key?key=` | Requesting agent, current scope for known owned proposal | Stored attempt, including historical outcomes |

Execution tuple: proposalId, grantId, reimbursementId, organizationId, projectId,
category, amountMinor, currency, expectedVersion and operation exactly
`approve_reimbursement`. Limit and expiry are immutable proposal fields, not
client overrides. The single-use invariant is enforced by schema and grant state.

## Concurrency, privacy and failure semantics

Lock order is reimbursement → grant → organization → project → sorted principals
→ sorted memberships. Exact decision scope is locked once; approval/rejection,
execution and revocation serialize through the reimbursement. Foreign direct
resource requests are entitlement-filtered before locking the supplied UUID,
then membership is checked again under locks. Administrative offboarding updates
wait for these shared policy locks; committed removal before the decisive check
denies execution. Expiry uses database time after lock waits.

Revocation that wins serialization blocks subsequent effects. An execution that
commits first remains approved. A completed identical retry can return its stored
receipt after grant consumption/revocation without approving again, but current
membership is checked before exposing known owned history. A new key never
reactivates a consumed or revoked grant. Rejected/stale/over-limit proposals do
not create authority. Rejection remains available if the requesting agent is
subsequently disabled.

The approval status/version transition, grant consumption, attempt, evidence and
idempotency response commit atomically. Missing database or failed audit storage
produces an unavailable response and rolls back; a transport interruption must be
reconciled rather than assumed to mean failure. Unknown/foreign supplied target
IDs produce generic denied receipts without linking evidence into another
organization's history. SQL constraints bind stored proposal scope to the exact
resource, prevent duplicate effects and preserve terminal/immutable records.
Database superuser compromise is outside these guarantees; evidence is durable,
not cryptographically authenticated or tamperproof.

The old destructive authority reset refuses while the dependent reimbursement
schema exists. Preserve evidence rather than silently dropping foreign-key
constraints. This prototype offers no automated reset of reimbursement records;
disposable test databases can be removed by their owner after tests finish.

## Verification

```sh
dotnet test tests/HumanAuthority.IntegrationTests/HumanAuthority.IntegrationTests.csproj --configuration Debug
dotnet test tests/HumanAuthority.IntegrationTests/HumanAuthority.IntegrationTests.csproj --configuration Release
cd frontend
node --experimental-strip-types --test tests/genesis-reimbursement-session.test.mjs
node --test tests/genesis-reimbursement-http.test.mjs
```

The backend suite requires `GENESIS_TEST_DATABASE` for a disposable loopback
`*_test` database, holds its existing advisory lease and resets only its two
prototype schemas. Never point it at customer data. The HTTP frontend suite
requires a production build and uses a synthetic upstream; it is not evidence
for PostgreSQL enforcement. The connected Chromium harness additionally runs the
real reviewer, API and PostgreSQL; see the evidence record for actual results.
Independent human review, production identity/administration, full accessibility
review, backup/recovery, retention/privacy and operational gates remain open.
