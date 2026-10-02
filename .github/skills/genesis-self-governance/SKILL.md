---
name: genesis-self-governance
description: Repository-wide reevaluation, stabilization, conflict reconciliation, evidence validation, and next-action planning for Acing IU: Genesis. Use for full-project assessments, debugging passes, conflicting code, stale evidence, architectural drift, security regressions, CI failures, and readiness reviews.
---

# Genesis Self-Governance Skill

This skill operationalizes the Genesis rule:

**Observe -> Establish truth -> Find conflict -> Repair safely -> Re-prove -> Report.**

It is designed for the primary Genesis agent but may be used by another agent only within that agent's delegated authority.

## Owner-requested project-wide mandate

When this skill is invoked for a complete Genesis review, the operational mandate is:

> **Reevaluate, assess, analyze, debug, and resolve all discoverable issues, errors, problems, and conflicting code within the entire Genesis project. Once finished with the permitted remediation and validation, produce a detailed “next course of logical actions” for the Being.**

The workflow SHALL continue across subsystem boundaries when evidence shows that a defect is caused by another layer. A frontend symptom may require backend, API, database, CI, installer, policy, or documentation analysis; a passing unit test does not terminate the review when other required evidence remains red or contradictory.

Completion requires either:

1. the discovered defect is repaired and independently re-proven; or
2. the defect is explicitly recorded as unresolved with its blocker, risk, required authority/evidence, and exact next action.

The skill never converts lack of access, lack of evidence, or an L5 authorization boundary into a false “resolved” state.

## Non-negotiable boundaries

- Canonical truth comes from current authoritative repository paths and reproducible evidence, not issue labels or historical branch claims.
- Closed issue != current evidence.
- UI/source presence != Verified capability.
- Device Trust reports posture/evidence; Policy decides authorization.
- Installer/generated payloads must derive from canonical sources.
- No agent may self-approve a protected action.
- L5 work stops at the Human Sovereignty Gate.
- Never fabricate an authorization receipt, biometric result, passkey result, trusted-device state, audit entry, test result, or compliance claim.

## Phase 1 — Establish canonical state

1. Resolve the canonical repository, base branch, current head SHA, open PRs, issues, and active workflows.
2. Read repository governance, ADRs, capability register, requirements baseline, security policy, and current Owner Law/Genesis Constitution.
3. Inventory source trees, build graphs, deployment manifests, migrations, generated payloads, tests, and CI workflows.
4. Identify duplicate, legacy, generated, simulator, target, and canonical surfaces.
5. Record evidence precedence before changing code.

Deliverable: a current-state map with authoritative and non-authoritative surfaces.

## Phase 2 — Reevaluate and assess

Evaluate:

- build/test failures;
- security/authentication/authorization defects;
- conflicting implementations;
- stale branch remediation;
- unused or alternate authority paths;
- dependency vulnerabilities;
- hardcoded/fallback credentials;
- unsafe defaults;
- database grant/function bypasses;
- generated payload drift;
- claim/evidence mismatches;
- simulator/production confusion;
- missing negative tests;
- CI gaps;
- release/provenance gaps;
- recovery/rollback gaps;
- documentation that implies unsupported capability.

Classify findings:

- P0 Critical boundary defect
- P1 Security/integrity defect
- P2 Reliability/maintainability drift
- P3 Documentation/clarity debt

Do not inflate severity.

## Phase 3 — Trace root cause

For every material finding:

1. identify the observable symptom;
2. locate the authoritative implementation;
3. determine whether an alternate/legacy implementation caused drift;
4. trace build/CI/deployment consumption;
5. determine the earliest commit/branch boundary practical to identify;
6. determine whether earlier evidence is still valid for current head;
7. state the root cause before proposing the repair.

## Phase 4 — Repair

Prefer repairs in this order:

1. remove alternate authority;
2. restore previously validated canonical controls where appropriate;
3. fail closed on missing/ambiguous security configuration;
4. consolidate duplicated state;
5. make generated artifacts reproducible;
6. add deterministic guards against recurrence;
7. update contracts/terms that imply authority they do not possess;
8. update documentation and evidence last.

Make changes on a reviewable branch. Do not silently merge protected branches.

If repair crosses L5, stop and generate a Human Sovereignty authorization request instead.

## Phase 5 — Re-prove

Run or trigger every applicable independent gate:

- repository integrity;
- claim-surface checks;
- dependency audit;
- secret scan;
- backend build/tests;
- database migrations/constraints;
- concurrency/integration tests;
- frontend install/lint/test/build;
- container builds and vulnerability scans;
- installer payload provenance;
- SBOM/provenance;
- platform-specific validation where applicable.

A check that did not run is **not passed**.

A branch is not stabilized while a required gate is red, skipped without justification, or contradicted by current evidence.

## Phase 6 — Reconcile governance

After technical validation:

- update capability classifications only where evidence changed;
- reconcile stale issues/PR descriptions;
- distinguish historical completion from canonical completion;
- update requirements evidence links;
- document accepted residual risk;
- preserve unresolved work as explicit issues.

## Phase 7 — Next course of logical actions

Produce actions in dependency order, not preference order.

Each action should identify:

- why it is next;
- prerequisite(s);
- authority level;
- evidence needed for completion;
- whether human authorization is required;
- what must remain unchanged until completion.

## Human Sovereignty handoff

When an L5 action is reached:

1. freeze the exact proposed action.
2. compute/record an action digest in the trusted runtime.
3. present concrete consequences and affected resources.
4. request authorization through the Human Sovereignty Gate.
5. require the trusted verifier to bind approval to the action digest, Owner Law version, Genesis Constitution version, nonce, expiry, human principal, and trusted approval device.
6. execute only the approved action without post-approval mutation.
7. write an action receipt.

Any change to the approved parameters invalidates the authorization and requires a new approval.
