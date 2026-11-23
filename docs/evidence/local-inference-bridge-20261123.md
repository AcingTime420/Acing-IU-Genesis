# Local inference proposal bridge: current validation

Recorded November 23, 2026 (America/Los_Angeles). Parent: PR #250 at
`c6f82dd652fd6747f9a19b6f63f29434324dae0a`. Its hosted
[CI](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/45114706297) and
[security/dependency checks](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/45114706315)
were inspected as successful before this work. They are not this candidate's checks.

## Scope

Adapt the separate #220 local inference boundary without its ephemeral authority
policy. The new guarded Node/Python command may stage an unapproved durable
reimbursement proposal only. The operator fixes target, amount limit and TTL;
the model returns propose/abstain plus untrusted rationale. Human approval and
agent execution stay separate. An agent-only context endpoint checks current
organization, project, manager and agent scope; manager record/evidence/browser
access stays human-only. No migration, payment or external inference API was added.

The temporary checkout was cleared during a session restart before publication.
Source/tests were restored from the session records onto a fresh #250 clone.
All results below were rerun on the restored files; earlier session results are
not being substituted for current validation or claimed as byte identity.

## Fresh executed checks

Linux; Node 24.22.3, npm 11.19.1, .NET SDK 10.0.404 / ASP.NET runtime 10.0.15,
PostgreSQL 17.11 and cached Playwright 1.65 Chromium. Tests used new task-owned,
loopback-only disposable databases and synthetic records.

| Check | Current result |
|---|---|
| Provider/proposer cases and direct HTTP proxy regression | 60 passed; simulated model responses |
| Entire authority HTTP/PostgreSQL Debug suite | 179 passed, 0 skipped |
| Entire authority HTTP/PostgreSQL Release suite | 179 passed, 0 skipped |
| Fresh frontend production webpack build / TypeScript | Passed |
| Frontend adapter/session/lint-rule/production HTTP tests | 30 passed |
| ESLint | 0 errors, 19 existing warnings |
| Fresh npm audit | 0 known vulnerabilities reported |
| Actual Node/Python CLI, simulated Ollama protocol, real database/backend/browser | Passed |
| Claim-surface, whitespace, YAML, local references and links | Passed |

The 179 backend cases include the existing regressions plus 11 context cases for
current membership/role/organization/project scope, read-only allocation counts,
foreign/unknown equivalence, nonpending conflict and foreign-row lock avoidance.
Debug/Release rerun the same scenarios, not 358 distinct tests. Existing test-SDK
artifact-directory warnings remain nonfatal.

The 60 Node cases reject malformed or extra-authority output, model substitution,
remote metadata, tools, oversized/truncated responses and failures; they verify
fixed tuple/minimized input and no staging on abstention. Transport review found
that Node's global HTTP agent may honor environment proxy configuration. Explicit
agent isolation was added. Fresh reproduction without isolation failed under a
local proxy fixture; the restored fix passed with two local requests and zero
proxy requests. This is simulated transport evidence, not host-wide isolation.

The staged change received a redacted Gitleaks scan before publication; record
its result in the PR description. This is not repository-history clearance.

## Connected observations

A test-owned simulated Ollama server listened on 127.0.0.1:11434 after checking
that the port was unused. The actual Node command invoked the protected Python
client and real context/proposal API. A valid-shaped hostile model rationale
staged exactly one caller-bound proposal, with zero decisions, grants or attempts
and a pending record. Model payloads excluded credentials, authority IDs, private
paths and backend configuration. The saved actual proposal used POSIX mode 0600.

A separately authenticated manager approved through the production-built browser
reviewer. Separate agent execution and retry produced one effect/attempt and
matching UI/SQL/evidence. Abstention, malformed output and provider failure
allocated no authority state. Trusted test injections removed membership or
committed another authorized approval after inference; real staging then denied
with 404/409, without a new stale proposal. These injections are not model tools.
Fixtures/processes were cleaned up; no customer data was used.

## Limits and next gate

**No actual model inference was executed.** Installed-model quality, schema
reliability, hardware use, model/license choice and native Windows execution of
this bridge remain unverified. Historical #220 Windows inference is separate
evidence. No model downloads or paid resources were used.

Rationale is untrusted text, not eligibility or execution proof. Model names and
modified times are runtime-reported diagnostics; no weight digest is pinned or
attested. The daemon's cloud-disable setting and host-wide egress are outside
this bridge's enforcement. Production identity/organization administration,
privacy/recovery, independent human review and launch gates remain open.
Separate AI review of the restored current source found no blocking issue in
its bounded scope; it is not independent human certification.

CI now selects Node 24 for the relevant jobs and includes the Node suite and
simulated-model governance harness. Newly published hosted results must be
observed before claiming success. No merge or deployment was performed.

Setup: [local inference guide](../../backend/LocalInference/README.md).
