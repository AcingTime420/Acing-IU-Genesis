# Genesis authority API — PROPOSED

Pending Manus and independent ChatGPT cross-workstream review; not an agreed
contract or production capability. This is a fresh implementation, not recovery
of the unavailable earlier implementation. Earlier reported tests are unverified
and are not evidence for this work.

## Inspected baseline and publication gate

- Base: `4cf3181951ddc3366a193d49cb8ca32dce346bf7`.
- Assigned branch: `copilot/prototypehuman-authority-backend`.
- PR #161 head verified before inspection:
  `a73f9b569ab07a915841eac675448806c8ac2b67`.
  Its prototype guide, adapter and adapter tests are presentation references,
  not an authorization design. Manus's branch remains unchanged.
- No applicable AGENTS.md was found. ADR-003/004/005, contribution guidance,
  canonical Identity source and existing OpenAPI location were inspected.
- Publishing uses the environment's progress tool, never a shell push.
  Substantial implementation starts only after the first contract commit is
  published and independently retrievable from GitHub.

## Proposed surface

All protected paths start `/v1/authority`; JSON names are camelCase.
Authentication is an opaque bearer credential validated against a persisted
SHA-256 credential hash on every request. Separate human and agent principals
have server-generated UUIDs and display names. No actor ID in a request is
authentication. Credentials are explicit local development fixtures, never
browser service secrets. Existing Identity JWT/MFA foundations do not establish
agent enrollment; production identity integration is outside this prototype.
Service startup accepts Development/Test only and binds loopback by default.

| Method/path (relative to prefix) | Caller | Request | Result |
|---|---|---|---|
| POST `/documents` | human | `{title,content}` | 201 document owned by caller |
| GET `/documents/{id}` | current human owner | none | 200 current document |
| POST `/proposals` | agent | `{documentId,expectedVersion,text,ttlSeconds}` | 201 immutable proposal |
| GET `/proposals/{id}` | owner or proposing agent | none | 200 proposal |
| POST `/proposals/{id}/decision` | current human owner | `{decision:"approved"|"rejected"}` | 200 decision/grant ID |
| GET `/grants/{id}` | current human owner | none | 200 current grant |
| POST `/grants/{id}/revoke` | current human owner | `{reason}` | 200 current grant |
| POST `/execute` | agent | `{proposalId,grantId,documentId,operation,text,expectedVersion}` and `Idempotency-Key` | 200 allowed attempt or 403 denied attempt |
| GET `/attempts/{id}` | executing agent or current proposal-document owner | none | 200 historical attempt |
| GET `/attempts/by-key?key=...` | original executing agent | none | 200 historical attempt |
| GET `/documents/{id}/evidence` | current human owner | none | 200 evidence array |

Public `GET /health/ready` probes PostgreSQL and migration version; returns
200 ready or 503 unavailable, without configuration details.

Document fields: `id,ownerId,title,content,version,createdAt`.
Proposal fields: `id,agentId,agentName,documentId,operation:"append",text,
expectedVersion,expiresAt,singleUse:true,createdAt`.
Decision fields: `proposalId,decision,grantId` (null when rejected).
Grant fields: `id,proposalId,documentId,agentId,expiresAt,singleUse:true,state,
createdAt`; state is active, expired, revoked or consumed.
Attempt fields: `id,proposalId,grantId,documentId,operation,text,expectedVersion,
outcome,reason,documentVersion,createdAt`; version is null on denial.
Evidence fields: `id,documentId,requesterId,approverId,proposalId,grantId,
attemptId,action,decision,outcome,details,createdAt`.
Nullable linkage is explicit for events without an approval/grant/attempt.

## Authority and transaction invariants

Proposals are immutable. Approval binds the authenticated proposing agent,
proposal, application-managed document, append operation, exact text, expected
document version, frozen server expiry and single use. Approval cannot extend
expiry. One immutable decision and at most one grant exist per proposal.
Repeated identical decisions return the original grant, including its terminal
state; an opposite decision conflicts. Agents cannot approve, revoke, change
owners, issue grants, select their identity or expand authority.

Append means exactly `old content + approved text + LF`: no trimming,
normalization, separator insertion or existing-newline removal. A proposed
trailing LF therefore produces two trailing LFs. Content is PostgreSQL text,
not a filesystem path or device command. Version starts at zero.

Use READ COMMITTED transactions. Lock ordering is execution's
principal/operation/key advisory lock, then the immutable proposal's document
row, then that proposal's unique grant row. Approval and revocation lock the
same document before the grant. Read the decision after taking the document
lock, serializing even initial concurrent approval with no decision row.
Never lock arbitrary caller-supplied document/grant targets to authorize work.

After all relevant locks, execution independently rechecks the complete tuple,
active unused grant, enabled authenticated agent, approved decision, approving
human's enabled human principal and current ownership, exact proposal/grant
association, unexpired frozen deadline, current version and content limits.
Use PostgreSQL `clock_timestamp()` after lock acquisition: transaction-start
`now()` is not an expiry clock. Expiry is evaluated at this decisive point;
an authorized transaction may commit just after its deadline.

Document append, version increment, consumption, successful attempt and required
evidence commit together. Required evidence failure rolls everything back and
returns 503. Semantic denial persists its attempt and evidence without mutation;
failed denial evidence also returns 503, never an unaudited denial.
Foreign IDs do not expose resource data. Wrong-target requests for the caller's
own proposal associate evidence with its real document, never the foreign
submitted target; owners inspect through that evidence association.

Revocation committing first blocks execution; execution committing first remains
completed and consumed. A later revoke does not reverse the append or change
consumed to active/revoked. Active to revoked/consumed are terminal transitions;
expired is computed using authoritative time, never a client countdown.
Database constraints and append-only triggers protect immutable records; database
administrators/schema owners are not claimed to be tamper-proof adversaries.
Bounded lock/statement waits, deadlocks and serialization errors roll back and
return 503 without automatic retries.

## Idempotency, uncertainty and errors

Scope keys to authenticated principal + execute operation + exact key.
Fingerprint a canonical typed representation of every request field, including
operation and exact text. Same key/request returns the original historical body
and status; changed inputs return 409, even after a denial. Unique constraints
and advisory locking serialize duplicate keys; separate keys still cannot
consume one grant twice. Authenticate and authorize caller kind before replay.
By-key lookup filters the exact caller, execute operation and key; foreign keys
return 404. Attempt history never contains/restores current document snapshots
or makes a revoked grant look active.

Keys, fingerprints, attempts, grants and evidence are retained indefinitely in
this prototype; there is no cleanup/retention expiry. Any future retention
policy must preserve consumption and prevent duplicate mutation. Malformed,
unauthenticated and wrong-kind requests do not allocate accepted keys.
An accepted execution is not cancelled merely because the client disconnects.
Reconcile the original key after uncertain transport/commit outcomes. A lookup
404 is not proof that a still-in-flight request cannot subsequently commit.

Errors use `{error:code}` except persisted execution denials, which return an
attempt. Mapping: 400 invalid_request; 401 unauthorized; 403 forbidden for
wrong kind, or denied attempt with redacted authorization_denied reason;
404 not_found for missing/foreign owner resources; 409 decision_conflict,
proposal_expired or idempotency_conflict; 413 request_too_large;
503 authority_unavailable for persistence/audit/lock failures.
Internal owner evidence retains precise denial reasons, while agents never
receive foreign ownership, grant state or document content in denials.

UUIDs are nonempty server-generated resource IDs. UTC RFC3339 timestamps have
`Z` suffix. Initial/resulting content limit: 1 MiB UTF-8; append text:
1–8192 UTF-8 bytes; title: 1–200 characters; reason: 1–500 characters;
key: 1–200 characters; operation: string up to 200 characters (non-append is
semantic denial); version: nonnegative signed 64-bit integer; TTL: integer
1–600 seconds. Reject unknown JSON properties, NULs and malformed values.
Request-body cap: 7 MiB to accommodate JSON escaping of bounded document text.

## Implementation increments and validation plan

1. Publish this contract and corresponding OpenAPI through the assigned branch;
   verify the exact commit using GitHub before writing service endpoints.
2. Publish an isolated canonical-backend service and versioned migration:
   principals, owned/versioned documents, immutable proposals/decisions, grants,
   revocations, attempts, fingerprints and evidence. No production init changes.
3. Publish complete transaction-enforced authority endpoints and reconciliation.
   Reuse .NET/PostgreSQL conventions, not legacy backend or installer copies.
4. Publish actual HTTP/PostgreSQL integration tests. Cover tuple mismatches,
   approval/role/owner isolation, expiry, revocation, duplicate decisions, key
   replay/conflicts, concurrent same/different keys, both revocation orderings,
   post-lock expiry, evidence rollback, historical lookup, connection loss and
   restart durability. Use independent connections and observed database-lock
   barriers, not arbitrary sleeps or mock security claims.
5. Publish guarded local migration/fixture/reset commands and deterministic
   agent harness; human approval stays a separate explicit action. Document
   startup/shutdown, health, secure distinct credentials and troubleshooting.
6. Execute available existing build/test tools, scan changed files for secrets,
   review/CodeQL, and record only newly obtained results. Open a draft PR against
   master and verify its remote head. No merge/deployment/frontend changes.

## Current validation record

This first increment contains a proposal, not an implemented service.
No backend tests have been run for this reimplementation yet. No previous
implementation results are carried forward. Production identity, frontend live
adapter, browser session/CSRF/CORS, operational retention/backups and deployment
remain outside the isolated prototype and require separate review.
