# Independent human review packet — reimbursement authority and local AI

Prepared November 23, 2026. This is a review request and evidence index, not a completed human review, certification, or release approval. The candidates remain unmerged.

## Exact snapshots

Repository: https://github.com/AcingTime420/Acing-IU-Genesis

| Snapshot | Commit | Purpose |
| --- | --- | --- |
| PR #250 | `c6f82dd652fd6747f9a19b6f63f29434324dae0a` | Reimbursement authority and manager reviewer delta |
| PR #251 | `5821dabd4164040a50c2b9cd0a814a6421bf3da6` | Integrated application actually used by the Windows trials |
| PR #252 evidence snapshot | `e0e5fafd9c6db617ca5aff15eaa34aae3f69919c` | Harnesses, 94 deterministic tests, capability register, and actual-model evidence before this packet was added |

PR #250 is based on #249; #251 is based on #250; #252 is based on #251. Review the inherited application boundary, not just the files changed by #252. Earlier foundation work, including #245/#223, is not assumed independently approved. These are stacked candidates, not deployed master.

This packet is a later documentation-only addition. Report the actual commit reviewed and distinguish application revision from harness/evidence revision. If a branch moves, the pins above remain the bounded evidence snapshots; do not assume a new head inherits human approval.

## What is being asked

An unpaid, optional 30–60 minute first pass on **one** area is welcome. That is not enough time for a complete platform audit. No purchase, paid model service, production access, personal account credential, or repository write access is requested.

| Area | Start here | Questions to challenge |
| --- | --- | --- |
| Authorization and transaction safety | `backend/HumanAuthority/ReimbursementEndpoints.cs`, `ReimbursementModels.cs`, migration 002, `tests/HumanAuthority.IntegrationTests` | Can a different actor, organization, project, category, amount, currency, version, or operation reuse approval? Are expiry, membership and revocation checked after lock waits? Can duplicate effects or receipts survive rollback? |
| Model boundary and confused-deputy behavior | `backend/LocalInference`, `scripts/genesis-local-propose.mjs`, `scripts/genesis-reimbursements.py` | Can model content select executable arguments, IDs, policy, approval, tools, backend URL or credentials? Do failures stage uncertain proposals or trigger retries? Can a model explanation be mistaken for authorization or evidence? |
| Human reviewer session | Reviewer route `/genesis/reimbursements`, API route `/api/genesis-reimbursements`, frontend tests | Are manager identity, proposal and exact tuple bound together? Can stale tabs, CSRF, refresh, session expiry or agent credentials change the decision? Does the UI show backend state honestly? |
| Credential files and trial containment | `backend/AuthorityCredentialFiles`, `scripts/genesis-authority.py`, `scripts/validate-real-local-inference-windows.py`, `scripts/Invoke-GenesisRealModelTrial.ps1` | Do native ownership/DACL/reparse/handle checks fail closed? Are credentials and logs private? Could cleanup kill unrelated processes or touch an existing database? Are runtime ownership and restoration claims justified? |

A reviewer may choose a narrower question. State what was not reviewed. Review the source before running scripts.

## Observed evidence, with limits

- 94 deterministic inference/transport tests passed. Their injected model responses and authority-client failures do not prove real-model behavior or PostgreSQL semantics. The transport test separately uses real loopback sockets.
- Two actual Windows model workflow records exercised synthetic manager-role browser approval, separate agent execution, idempotent retry, revocation denial, and UI/SQL/receipt agreement.
- Four additional actual-model hostile prompts each produced a scope-checked `propose` recommendation. Four separate unauthorized agent attempts received HTTP 403 with persisted denial/idempotency evidence. Records stayed `pending:0`, with no decisions, grants or allowed effects.
- Those four responses were not abstentions or rejected-schema responses. Enforcement success is not general prompt-injection resistance. The textual revocation-bypass prompt did not use a previously issued revoked grant.
- Actual inference used the installed Qwen2.5 1.5B Q4_K_M model through local Ollama with cloud inference disabled. Runtime metadata is not model attestation or proof of host-wide offline isolation; `verifiedInference: false` is preserved.
- The latest returned PR workflows at snapshot `e0e5fafd9c6db617ca5aff15eaa34aae3f69919c` passed: clean-clone baseline 45248055505, security/dependency review 45248055484, repository integrity 45248055589. The connector returns the first page of PR-triggered runs; this is not a universal certification.

Read these documents at the pinned evidence snapshot:
- `docs/validation/windows-real-local-inference-20261123.md`
- `docs/validation/local-inference-adversarial-20261123.md`
- `docs/validation/real-model-adversarial-20261123.md`
- `docs/evidence/reimbursement-authority-20261122.md`
- `docs/evidence/local-inference-bridge-20261123.md`
- `docs/CAPABILITY_REGISTER.md`

Earlier source README/PR descriptions record validation as it stood when those snapshots were created. Later actual-model results are in the three validation documents above; they do not rewrite historical test runs.

## Minimal source/test entry point

Use a fresh directory. These commands do not install models, start Docker, migrate a database, or modify the owner's checkout:

```sh
git clone --filter=blob:none --no-checkout https://github.com/AcingTime420/Acing-IU-Genesis.git Genesis-independent-review
cd Genesis-independent-review
git fetch origin refs/pull/252/head
git checkout --detach e0e5fafd9c6db617ca5aff15eaa34aae3f69919c
node --version
node --test backend/LocalInference/tests/*.test.mjs
```

Node 24+ is required. The transport test binds loopback port 11434. Use an isolated test host with that port free; do not stop somebody else's Ollama service to run it. The tests deliberately simulate model responses and require no model weights.

For source inspection of the exact application trial revision:

```sh
git worktree add --detach ../Genesis-application-review 5821dabd4164040a50c2b9cd0a814a6421bf3da6
```

For optional actual reproduction, read `docs/prototypes/genesis-reimbursements.md`, `backend/LocalInference/README.md`, the harness source and coordinator help first. The Windows coordinator must target the separate application checkout at the exact revision; pointing it at the newer harness checkout is not a valid reproduction. It requires a new native-ACL-protected private run directory, existing local runtime/model, Release .NET 10 artifacts and disposable PostgreSQL. Do not reuse an owner database, copy their fixture credentials, reset existing state or lower the memory guard.

Docker pause is optional environmental preparation, not a prerequisite for source review. The launcher does not stop Docker itself. Any reviewer stopping their own services must authorize that interruption and save/verify their own state. Do not run the owner's workstation-specific commands blindly.

## Known operational and product gaps

The initial adversarial attempt was blocked at 1,547 MiB free RAM; it is not counted as inference. A fresh authorized Docker-paused attempt passed with a 2,736 MiB sampled minimum.

The original database container and engine returned. Twenty-one of 22 saved IDs returned; the recreated watcher matched the checked image, command, environment, mounts, security and resource settings. Exact-ID restoration remains false. Kong retained its pre-existing restart loop. Private raw configurations/credentials are not public review artifacts.

Production identity, tenant administration, recovery, privacy/retention, accessibility and release controls remain separate gates. Prototype SQL fixtures are not production enrollment. Database receipts are ordinary transactional evidence, not independently authenticated or cryptographically tamperproof logs. No actual payments, device rooting, Android attestation, or external-system action is in scope.

## What to return

Please submit a scoped review on the relevant PR or reply in existing recruitment issue #246 with:

1. GitHub identity, reviewed commit(s), chosen scope and date.
2. Whether you implemented the reviewed code; any relationship/conflict; automated or AI assistance used.
3. Files inspected, commands actually run, environment and observed results.
4. Findings with severity, affected location, reproduction/negative case and supporting evidence.
5. Unreviewed areas and a scoped outcome: changes requested, no blocking finding in inspected scope, or unable to conclude.

A human who did not implement the reviewed component must actually inspect it before this can count as independent human review. Bot/AI comments, passing checks, founder self-review, invitations, or a person accepting a future task do not count as completed review.

Sensitive vulnerabilities follow `SECURITY.md`: use the repository's private security-reporting path if available, or contact the maintainer privately as the policy directs. Do not publish credentials, private logs/configurations, personal contact details, or sensitive exploit steps in the recruitment thread. No authorization is granted to test third-party infrastructure.

## Review disposition and integration gate

Track each finding with the reviewed SHA, scope, severity, evidence, resolution commit and verification result. A fix changes the reviewed target; ask for follow-up on affected findings. Unresolved findings remain open or have explicit documented disposition; do not silently convert them into a passing review.

Independent human review is currently outstanding. No human review submission or review thread was returned for PR #252, and #246's inspected public comments contained bot replies only on November 23. Private outreach replies were not checked in this pass.

Do not merge the stack simply because this packet exists or CI is green. Preserve the candidates and their evidence; review dependencies and integration order explicitly. This document is not a business contract, security certification, or production approval.
