# DeviceTrust #107 / #135 reconciliation proposal

Status: maintainer-review plan, not a merge or architecture approval.
Reviewed source heads: #107 `e9b762fecd01640f69677d5a05559a95d9e44d8a`
and #135 `89e2db8f9ee7964c7c6262e26f0c303913d120eb`.
Manus's independent report is supporting evidence; its records remain unchanged.

## One delivery vehicle

Use existing PR #107 as the proposed canonical implementation/test vehicle;
do not create another competing ownership implementation or merge #135 wholesale.
The choice still requires maintainer review because packaging, Identity/MFA and
administrative-policy scopes differ. Preserve #135 as comparison evidence until
its useful changes and acceptance criteria are accounted for.

| Boundary | Preserve from current implementations | Reconciliation action |
|---|---|---|
| Caller identity | JWT middleware; parsed subject for device GET/POST; privilege derived from authenticated roles | Retain #107 HTTP middleware tests; add missing/malformed/empty-subject HTTP cases and explicit list/role boundaries. Never accept caller/owner/privilege from telemetry JSON. |
| Resource ownership | Owner-aware reads; cross-owner and ordinary null-owner reads return indistinguishable 404 | Retain #135 database read cases plus #107 middleware/unit cases; use one fixture/project. |
| Telemetry | One owner-or-privileged SQL UPDATE, no INSERT and no owner reassignment | Preserve this shared implementation; keep unknown IDs rejected even for privileged callers. |
| Success audit | UPDATE and required audit INSERT on the same connection/transaction, commit after audit | Preserve rollback/rethrow; test every changed telemetry field and absence of success audit after injected audit failure. |
| Denial audit | Best-effort audit cannot turn denial into success or expose existence | Preserve #135 unknown-read auditing; test audit outage with unchanged denial response. Best-effort denial logs are not guaranteed durable. |
| Concurrency | #107 real multi-connection PostgreSQL lock/wait telemetry tests | Retain runtime-role execution; add ownership-reassignment versus UPDATE ordering tests. |
| Response contract | Existing response shape and anti-enumeration behavior | Bring #135 application/problem+json behavior after contract tests; reconcile OpenAPI schemas with actual serialized responses. |
| Installer and smoke | #135 root-context builds, SharedKernel payload preparation and explicit smoke provisioning | Validate staged installer and canonical builds; keep #107 drift gate but exclude intentional packaging/build outputs correctly. |

## Explicit policy choices

- **No tenant-isolation claim.** The schema and checks use owner_user_id and global
  Admin/Operator roles. Current privileged access includes existing unowned devices;
  a tenant-specific administrator boundary requires a separate approved contract,
  schema, migration and negative-path tests. Do not silently invent a tenant field.
- **No telemetry enrollment.** Unknown hardware IDs return 404 for every role.
  Enrollment remains a separate authorized operation. Test fixtures may provision
  disposable records; that is not a product enrollment API.
- **Posture is not authorization.** Authorized low-trust telemetry is currently
  recorded with HTTP 200 and Allowed=false. This captures a posture result rather
  than authorizing a device action. Confirm this contract with the maintainer;
  do not treat the score flag as an independent authority grant.
- **No immutable-audit claim.** A transactional database row is not tamper-proof
  evidence against schema owners/administrators. Runtime grants, retention,
  authenticated readers and recovery require their own evidence.
- **No implicit Identity/MFA adoption.** #135's additional synchronization work
  must be traced to reviewed canonical sources and validated separately if kept.
  Frozen legacy source is not an alternative authority root.

## Ordered implementation and validation

1. Keep the common canonical controller/service/repository/model contract and the
   atomic UPDATE/audit transaction. Preserve source/test history on the existing PR.
2. Integrate #135's read-audit and response-format improvements with focused tests.
   Do not copy both PostgresFixture definitions or CI setups verbatim.
3. Use one explicit disposable PostgreSQL fixture: verify loopback or an exact
   approved local socket, a dedicated test database and actual resource ownership
   before any schema/reset operation. A name merely containing `test` is not
   sufficient isolation. Keep privileged setup/observation separate from repository
   operations using the runtime acing_device_trust role.
4. Retain #107's HTTP/unit/telemetry race and audit-rollback suites and incorporate
   #135's database read/null-owner cases. Verify missing/invalid caller, untrusted
   owner/privilege inputs, cross-owner denial, privileged unknown-device denial,
   null-owner behavior, deny-audit failure and no enrollment. Add owner-reassignment
   races and assertions for every changed column, not just the score.
5. Correct payload generation/build contexts and smoke provisioning, then run both
   canonical and staged installer builds. Do not weaken drift checks to hide
   unintended divergence or independently edit generated payload logic.
6. Run the full exact-head database suites, migration/grant checks and safe smoke
   workflow against newly created isolated resources. Never use an existing
   persistent database/volume or production credentials for destructive fixtures.
7. Reconcile the complete authorization matrix rather than replacing its Identity,
   Audit, policy and other deny-path sections with only AUTHZ-04 notes. Obtain
   independent review and all applicable gates before any merge decision.

## Evidence and current limits

Fresh local runs at the reviewed heads passed 35 #107 tests and 6 #135 tests.
The #135 unit project covers scoring; it does not inherit #107's authorization
coverage merely because the implementations overlap. PostgreSQL test projects
must be distinguished from these executed suites.

The #107 follow-up corrects the falsely named "read unowned" fixture, adds real
JWT/HTTP checks for missing authentication, ordinary null-owner denial, privileged
existing-null-owner writes/unknown-ID rejection and authorized low-score capture,
and removes an unmapped gitlink from the index without deleting local files.
These changes do not implement a tenant model, enrollment API or new permission.

Local full PostgreSQL execution and reconciled installer/smoke validation remain
outstanding. Compilation or fake-repository HTTP tests cannot establish database
rollback, runtime grants or concurrency. This plan does not lift the stabilization
freeze, approve either PR or authorize deployment.
