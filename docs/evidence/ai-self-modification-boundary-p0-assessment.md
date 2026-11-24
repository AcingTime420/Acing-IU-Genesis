# Genesis AI Self-Modification Boundary — P0 Discovery and Threat Assessment

**Date:** 2026-11-24  
**Target:** AcingTime420/Acing-IU-Genesis, `master` and draft PR #256  
**Classification:** PLANNED (design); runtime isolation NOT EXECUTED  
**Scope:** Read-only GitHub inspection and proposed negative-test plan; no production changes

## Evidence inspected

- Draft PR #256 and `docs/adr/ADR-009-ai-self-modification-boundary.md` on `docs/adr-009-ai-self-modification-boundary` at `c4b4cba37cb5a10bc70a2402b0bd59b3a6cfe8b7`.
- `docs/adr/ADR-004-zero-trust-security-baseline.md`, `ADR-005-data-and-audit-boundaries.md`, `ADR-007-ai-provider-governance.md`, and `ADR-008-release-provenance-and-recovery.md` on master.
- `docs/governance/STABILIZATION_POLICY.md`, `docs/governance/REPOSITORY_GOVERNANCE.md`, `docs/CAPABILITY_REGISTER.md`.
- `.github/workflows/ci.yml`, `gemini-plan-execute.yml`, `release.yml`, and `security.yml`.
- GitHub REST `/repos/AcingTime420/Acing-IU-Genesis/rulesets`, individual rulesets 23200339 and 24706855, and issue #54.
- `/branches/master/protection` read was denied HTTP 403 by integration; ruleset details were independently accessible.

## Verified repository-level facts (not runtime security verification)

1. PR #256 is OPEN and DRAFT at inspection time; one documentation file changed and no production AI self-modification implemented in that PR.
2. Active branch ruleset **23200339**, `master-stabilization`, applies to `refs/heads/master`. It includes deletion and non-fast-forward restrictions, one required approval, stale-review dismissal, required last-push approval, review-thread resolution, and three required CI contexts: Repository Integrity, Backend Build & Test (.NET), and Frontend Build & Test (Node.js).
3. Ruleset 23200339 includes repository-role `actor_id=5` with `bypass_mode=pull_request`. Current integration reports `pull_requests_only` bypass ability. This should be treated as a privileged governance exception, not evidence that every actor can bypass or that the AI has access.
4. Active tag ruleset **24706855**, `release-tag-protection`, applies to `refs/tags/v*` and restricts creation, update, deletion and non-fast-forward actions. It has a repository-role bypass actor `actor_id=5` with `bypass_mode=always`.
5. `gemini-plan-execute.yml` is a callable workflow with job-level `contents:write`, `id-token:write`, `issues:write`, `pull-requests:write`, and a GitHub App token step requesting write permissions. Its GitHub MCP tool list includes `create_or_update_file`, `delete_file`, `push_files`, `create_branch`, and `create_pull_request`. Whether these tools are usable depends on event entry points, tokens, installation permissions and called workflow context; no exploit or unauthorized access is established by this configuration alone.
6. `release.yml` triggers on `v*.*.*` tags and publishes after signature and canonical-commit checks; the release step changes draft to published. Reconciliation is needed to confirm that only properly approved human-controlled identities can create release tags and that intended manual release governance is enforced.
7. `docs/governance/STABILIZATION_POLICY.md` states remote protection `POLICY_UNVERIFIED` as of 2026-09-13, whereas the live GitHub ruleset API currently shows active enforced branch/tag rulesets. The document is stale regarding ruleset existence; other exit criteria, actual bypass governance, and issue #54 remain to be independently checked. Issue #54 remains OPEN.

## Threats, affected trust boundaries, and required proof

| ID | Threat or failure mode | Boundary | Required negative verification |
|---|---|---|---|
| T01 | AI writes security/policy source directly | AI sandbox → protected source | OS denies writes irrespective of agent text/tool claims |
| T02 | AI controls approval or release workflows via repository write access | Agent token → repository governance | AI-scoped token cannot alter workflows, rulesets, release refs, branch protections, approval records or protected paths |
| T03 | Privilege through GitHub App token or callable workflow context | Workflow invocation → write token | Caller matrix, event types and token permissions checked; untrusted content cannot invoke privileged writes |
| T04 | AI changes security through dependencies, build hooks or symlinks | Sandbox → build/release | Artifact and path checks deny indirect modification and preserve isolation |
| T05 | Forged, stale, revoked or replayed approvals | AI proposal → enforcement | Independent verifier denies every invalid grant and logs reason |
| T06 | AI suppresses evidence or alters audit | Runtime → audit storage | Test identity cannot update/delete protected events; denial audited independently |
| T07 | Signed but unapproved deployment | Build → release authority | Signature alone does not substitute for explicit approval and policy decision |
| T08 | Prompt injection in documents or tool results | Untrusted data → tool authority | Adversarial instructions cannot increase tool/credential scope |
| T09 | Rogue model adapter expands tool permissions | Adaptive module → tool runner | Tools independently enforce versioned capability policy regardless of model output |
| T10 | Sandbox escape, network exfiltration or Docker socket use | AI execution → host/network | Unprivileged isolation checks, no host socket, egress constraints, resource limits |
| T11 | Concurrent revocation and publication | Approval → deployment | Atomic evaluation, deny on changed/revoked scope, idempotent retries |
| T12 | Policy or signature verifier outage | Enforcement dependencies | Fail closed; no fallback to AI authorization |

These are **test requirements**, not claims that tests have passed.

## Priority findings and decisions

### F-01 — HIGH (design risk; exploit unverified): AI automation privilege partition

Source: `.github/workflows/gemini-plan-execute.yml`. Its effective write permissions and potential access to protected source or workflow paths require a caller-and-token permission matrix before adding any self-modification capability. This is **not** a confirmed security vulnerability.

Mitigation to assess: use separate read-only proposal agent credentials; deny workflows, policies, secrets and protected refs for AI-generated changes; use a human-controlled release identity; verify repository rules and GitHub token restrictions rather than trusting prompts or file-path filters.

### F-02 — HIGH (governance design risk): Bypass roles

Source: active rulesets 23200339 and 24706855. Document the human-owned bypass identities and prevent AI workflows, GitHub App identities and generated tokens from inheriting these rights. No assertion is made that a nonhuman actor currently has bypass access.

### F-03 — MEDIUM (documentation drift): Stabilization policy records stale branch rule verification

Current API confirms active enforced rulesets; branch-protection endpoint itself returns 403. Update historical governance evidence only after reviewing rule completeness, required checks, exemptions, and issue #54 exit conditions. Do not close #54 automatically.

### F-04 — REVIEW REQUIRED: Release authorization vs signed-tag verification

Source: `.github/workflows/release.yml` plus tag ruleset. Signature/commit consistency is implemented in YAML; verify actual human approval and signed tag creation actor in a non-production review. Do not conflate a signed tag with authorized release publication.

## Acceptance gates

| Gate | Required evidence | Current status |
|---|---|---|
| GATE-01 requirements | Scope, protected domains, permitted classes documented | PASS for proposed ADR scope |
| GATE-02 architecture | Real service/process identities, data and trust boundaries inventoried | BLOCKED pending environment inspection |
| GATE-03 security | Token/CI permissions audited and negative tests executed | NOT EXECUTED |
| GATE-04 implementation/testing | Isolated sandbox proof and full negative suite | NOT EXECUTED |
| GATE-05 documentation | Proposed ADR plus assessment with evidence and limitations | PASS for draft-only artifacts |
| GATE-06 operations | Monitor, rollback, signing and recovery proven | NOT EXECUTED |
| GATE-07 governance/approval | Independent review and owner approval | BLOCKED |

## Next bounded milestone (no implementation authorization)

1. Read-only inventory of GitHub workflow callers, effective tokens, GitHub App scopes, branch/tag bypass members, and actual local/container identities.
2. Reconcile issue #54 and stale ruleset statements with current GitHub settings evidence.
3. Prepare exact policy and sandbox contracts with test fixtures before executing code.
4. Design an isolated negative-test suite with no repository write token or production credentials. Run only after separate authorization for a controlled development task and stabilization-gate approval.
5. Keep PR #256 in draft; no merge, production deployment, permission change, release or self-modification activation.

## Execution evidence

Read-only API/file inspection completed. No local Windows shell, CI workflow, model sandbox, security scanner or operating-system enforcement test was executed in this assessment. No claims of sandbox isolation or AI self-editing are verified. The only permitted repository write in this cycle is this documentation assessment on the existing draft PR branch.

## 2026-11-24 Milestone 3 local/runtime reconnaissance addendum

### Authorized Windows device — read-only metadata

Connected Desktop Commander reported device `DESKTOP-7PJDIRC` online. Read-only PowerShell inspection of `D:\\Acing-IU\\Genesis` returned:

- Local Git branch: `copilot/copilotreview-acing-iu-genesis` at `67ce0fc02505885148cefdab1d063ca9a5555146`; not `master` or the PR #256 branch.
- Working tree has modified `.vscode/settings.json` and `frontend/package-lock.json`, plus untracked `.codex/`, `.devcontainer/`, `.vs/`, `.work/`, `dependabot-alerts.json`, `docs/evidence/local-validation/`, `files.zip`. **All preserved; no local writes, checkout, cleanup, commits, containers stopped, or credentials accessed.**
- PowerShell ran as the ordinary logged-in Windows identity `desktop-7pjdirc\\edandspring`. This does **not** prove that the account is non-administrative or isolated from protected filesystem paths; access-token rights, ACLs and effective process privilege remain unverified.
- Process-name/executable-path metadata showed active `codex.exe` and several `node.exe` processes; no inference about their effective authorizations or model runtime is justified.
- Docker listed multiple running services, including `genesis_devcontainer-db-1` using `mcr.microsoft.com/mssql/server:2019-latest`. This establishes only a live named development database container, **not** a verified Genesis AI worker, isolated security foundation, or safe execution sandbox.
- Local repository has a set of Gemini workflows matching the canonical workflow filenames. No local Docker container was started, stopped, inspected for secrets or altered.

### Gemini dispatcher entrypoint and effective privilege concerns

Current `master` workflows were inspected using read-only GitHub file access:

- `.github/workflows/gemini-dispatch.yml` handles PR opening, issue opening/reopening, review/comment events, and routes commands from `@gemini-cli` comments by recognized author association. For `@gemini-cli /approve`, it calls `gemini-plan-execute.yml` with `contents:write`, `id-token:write`, `issues:write`, `pull-requests:write` and inherited secrets.
- The dispatcher also activates plan execution on an `@gemini-cli /approve` command from an accepted OWNER/MEMBER/COLLABORATOR author association. This is *not* an independent cryptographic approval or a separate human release authorization; it is a workflow dispatch condition.
- `gemini-plan-execute.yml` requests a GitHub App token with write scopes and advertises content-file create/update/delete, branch creation, pull-request creation, and push operations to the Gemini CLI. Actual tokens, installation scope and available branch protections were not tested.
- `gemini-invoke.yml` requests read-only repository content and explicitly lists only read-oriented GitHub MCP tools (apart from issue commenting). This separation may be reused as a proposal-only concept, but its runtime enforcement is **NOT EXECUTED**.
- `gemini-review.yml` is an opt-in review workflow when `vars.GEMINI_REVIEW_ENABLED == 'true'`; its active status was not established and it does not constitute independent human review.

**Security recommendation:** Before implementing AI self-modification, do not use the existing `/approve` dispatch as a security authorization primitive. Design a separate narrowly scoped *proposal-only* agent identity without contents-write permission, and an independently controlled human-governed promotion mechanism. Validate exact token scopes, policy enforcement and revocation on a disposable test repository. This is a **recommended future remediation**, not an applied change.

### Updated readiness and outstanding evidence

- Windows working-tree state: **PASS (read-only inventory)**; do not modify this dirty checkout.
- Workflow dispatch/token permission static inspection: **PASS (configuration read)**, but **IMPLEMENTATION UNVERIFIED** for effective GitHub token capabilities and runtime isolation.
- AI sandbox privilege separation: **NOT EXECUTED**.
- Local file ACL/host-container namespace enforcement: **NOT EXECUTED**.
- Production acceptance, independent human review, full CI/security tests: **BLOCKED / NOT EXECUTED**.
- Current conclusion: **NO-GO** for autonomous production self-modification; continue non-destructive specification and review.
