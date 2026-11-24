# Understanding, reviewing and implementing Genesis

**Audience:** anyone evaluating, contributing to or considering using Acing IU: Genesis.
**Creator and project lead:** Micki Hart.
**Status:** development/research; this guide is a review map, not production approval.

## The problem being addressed

An AI system can suggest useful work without being entitled to perform it. Genesis explores how to connect assistance to explicit human permission and an independently checked execution boundary.

The central questions are: Who authorized the action? What exact operation and destination were approved? Has anything changed? Can the permission still be withdrawn? Did the action occur once? What evidence can the person inspect?

Device trust, authentication and interface design support those questions. None substitutes for action authorization. Fluent conversation, emotional language and possible AI consciousness are not sources of authority.

## Read in this order

1. Read the root README for identity, maturity and branch distinctions.
2. Read the capability register and architecture. Compare claims to source and dated evidence.
3. Choose a single prototype candidate and record its head and base SHAs. For the stale-approval workflow, review #222 before #223.
4. Read that candidate's setup and test documentation before starting services.
5. Inspect its implementation and reproduce relevant checks in an isolated environment.
6. Write a verdict that separates inspected evidence from checks personally rerun.

A conceptual review requires no account or execution. A technical review needs component-specific tools, synthetic fixtures and a disposable database. Do not use personal files or real device operations to demonstrate a document prototype.

## Required execution boundary

| Stage | Required behavior | Evidence to seek |
|---|---|---|
| Proposal | Identify requester, action, destination, exact content, expected state and expiry | Immutable proposal and input validation |
| Human decision | Display the actual scope and bind a decision to it | Authentication/session boundary, scope fingerprint and stale-review checks |
| Grant | Constrain the permitted actor and action; prevent self-expansion | Server-owned validation and negative tests |
| Execution | Recheck current authority and relevant state before mutation | Independent server checks and transactional locking |
| Retry | Return the recorded outcome for the same attempt | Idempotency binding and unchanged document/version |
| Revocation | Serialize revocation against execution and deny subsequent unused authority | Tests for both orderings, no unintended mutation |
| Evidence | Persist mutation and outcome consistently, or fail without partial effects | Database assertions and evidence-failure rollback |
| Failure | Show unavailable or uncertain results explicitly | Outage tests; no silent mock fallback |

A mock adapter demonstrates interaction design. A connected Development/Test service can demonstrate a bounded enforced workflow. Neither alone proves production identity, host-compromise resistance, durable operations or device control.

## Current candidate evidence

PR #222 describes stale first-approval denial and actual HTTP/PostgreSQL tests. PR #223 adds connected browser/API/PostgreSQL verification and reconciles selected dependencies. Its evidence distinguishes Linux CI, focused hosted Windows tests and historical owner-workstation results. Historical workstation results without durable public logs require reproduction where relevant.

PR #220 is a separate local-inference candidate. Running a local model avoids requiring a paid model API for that prototype; it does not make the model trusted, create a Genesis-trained model or reconcile the Node prototype with the C#/PostgreSQL service.

These candidates are not interchangeable. Check PR status and exact revisions when reviewing; older results do not establish the current head's behavior.

## Implementation sequence and completion conditions

| Work | Completion condition before expanding scope |
|---|---|
| Reconcile baseline and prototype branches | Reviewed dependency order, current tests and coherent docs at one selected revision |
| Reconcile identity and authorization | Explicit human/agent identities; enforced ownership, scope, expiry and revocation; denial tests |
| Complete one bounded action | Exact document workflow passes connected tests, concurrency and failure cases |
| Reconcile local inference | Model output remains untrusted; no route from generated text to self-approval or execution |
| Establish operational controls | Secrets, migrations, backups, recovery, audit access/retention and failure handling tested |
| Independent review and supervised usability | Findings resolved and remaining risks recorded; explicit pilot decision |
| Consider additional actions or device research | New threat model, narrow authorization, recovery path and action-specific evidence |

This is a delivery sequence, not a promise that all listed controls are implemented. OS images, hardware attestation and device-changing executors require separate engineering and safety evidence.

## Reviewer verdict

Record the reviewed head/base, files inspected, commands run, environment, outcomes, skipped checks and evidence links. Give each finding a reproducible trigger, expected versus observed behavior, affected location and needed correction.

Use one of three conclusions: no blocking findings in the reviewed scope; changes required with concrete blockers; or review incomplete with the missing evidence. Approval of code is not permission to merge, deploy or begin a pilot.

Report suspected vulnerabilities privately by following SECURITY.md, whether or not exploitability has been confirmed. Keep ordinary design feedback and non-sensitive findings in the relevant public review.

## Authorship and contribution boundaries

Micki Hart's creator attribution and the canonical history should remain visible. Identify contributions accurately and retain third-party notices. The repository currently states that its license is to be determined; this guide adds no reuse license and no contributor ownership assignment.

Do not assume a contributor invitation, public repository or AI-assisted draft settles ownership of every component. Licensing and contributor terms remain separate decisions. Keep credentials, signing keys and private operational records out of public documentation.
