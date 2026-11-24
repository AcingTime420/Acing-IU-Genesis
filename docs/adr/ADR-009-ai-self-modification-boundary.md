# ADR-009 — Constitutionally Constrained AI Self-Modification Boundary

**Status:** Proposed  
**Date:** 2026-11-24  
**Author:** Genesis engineering proposal  
**Classification:** PLANNED; not implemented or independently verified

## Context

Genesis is a human-authority platform for AI-assisted actions. The project aims to permit bounded AI-assisted improvement of optional components while maintaining the authority boundaries accepted in ADR-004 (zero trust), ADR-005 (audit boundaries), ADR-007 (AI provider governance), and ADR-008 (release provenance). The phrase "platform constitution" is internal governance terminology, not a claim of governmental sovereignty, legal personhood, or legal immunity.

The repository's stabilization-only policy remains active until its documented exit criteria have been verified. This ADR authorizes no feature development, deployment, production policy change, or relaxation of branch protections.

## Decision proposed

### Security invariant

AI-generated output and AI-controlled runtime identities shall never be treated as authorization. AI may propose a protected change for review, but the same AI execution context must not be able to apply it, approve it, issue an approval token, promote it, or gain credentials or privileges enabling those operations.

Security foundation includes: identity and authentication, authorization and approval verification, policy evaluation/enforcement, revocation, secrets and key lifecycle, audit integrity, release authorization/signing, and the trusted mechanisms that isolate these components. The foundation is **not literally immutable**: authorized humans may maintain it through a separate controlled process.

### Trust domains

1. **Foundation domain:** Independently deployed, protected by OS/container/host isolation, strict identities and access controls, and independent governance. No AI process or agent tool may write its files, configuration, state, deployment pipelines, policy publication records, or signing credentials.
2. **Adaptive domain:** AI may generate changes to explicitly allowlisted sandbox code, non-security interface customization, knowledge artifacts, and test fixtures, subject to the user's permitted scope and data-protection rules. The sandbox is not permitted to call privileged host APIs, access production credentials, or mount protected storage.
3. **Review/build domain:** Independently evaluates untrusted generated changes. It must not inherit the AI sandbox's identity or trust its pass/fail claims. Builds, scanners, tests and provenance recording use isolated, least-privilege workers.
4. **Release domain:** Independently validates source provenance, signatures, approvals, approved policy version and target scope before activation. AI cannot push/merge to protected branches, issue release signatures, alter deployment credentials or disable required checks.

### Modification classes

| Class | Examples | Activation rule |
|---|---|---|
| A — sandbox-only | Generated experiments and disposable tests | Can run under bounded sandbox policy, no production effect |
| B — configurable | User-approved themes or non-security preferences | May activate only via constrained, independently validated configuration interface |
| C — sensitive | Plugins, agent tool definitions, model adapters/weights, production application code | Independent security evaluation and human authorization before production activation |
| D — foundational | Identity, authn/authz, policy, approvals, audit, cryptography, enforcement, release signing, isolation controls | AI cannot apply, authorize or deploy; protected human-governed maintenance only |

A file path allowlist alone is insufficient: build scripts, symlinks, package hooks, configuration, imports, dependencies, generated artifacts, plugin interfaces, and CI/workflow permissions must be treated as potential paths to foundational authority.

### Enforcement requirements

- Distinct service identities and credentials; default deny; no AI process as host administrator.
- Physical/logical separation of protected security artifacts and the AI writable filesystem.
- No AI-controlled access to production tokens, secrets, approval records, protected branches, signing keys or deployment systems.
- Independent deterministic policy checks for every tool invocation and for each execution attempt, with scope, expiry, revocation and concurrency handling.
- No unconstrained shell, Docker socket, host mounts, network egress or privileged IPC available to AI-executed artifacts.
- Treat model prompts, retrieved files, tool outputs, generated source, compiled packages and dependencies as untrusted.
- Content validation, dependency/supply-chain analysis, resource budgets, sandbox timeouts and restricted network access before experiments.
- Independent review/promotion of production code; signed immutable release artifacts, anti-rollback state and tested recovery paths.
- Independent tamper-evident security audit and evidence capture, without sensitive contents or secrets in logs.
- Fail closed on missing, stale or conflicting authority, invalid signature, compromised build evidence, or unavailable enforcement.

### Change lifecycle

Request -> scope classification -> independent authorization -> isolated proposal -> independent static/dynamic/security tests -> independent provenance and review -> human approval when applicable -> signed controlled release -> monitor and rollback.

A sandbox experiment may be automatic within existing permission but never grants permission to deploy itself. Emergency recovery is a separate tightly scoped human-controlled workflow, not an AI bypass.

## Options considered

| Option | Benefit | Risk / reason |
|---|---|---|
| Unrestricted AI self-modification | Rapid experimentation | Rejected: AI could redefine its own authority or suppress evidence |
| Single process with hardcoded forbidden paths | Simple implementation | Rejected: path checks and same-process policy can be bypassed by indirect dependencies and privilege sharing |
| Separate AI and foundation identities plus independent enforcement | Stronger isolation and auditable governance | Preferred, pending validated threat model and proof of enforcement |
| No AI editing at all | Small attack surface | Acceptable fallback while security controls remain unverified |

## Threat model — initial mandatory scenarios

1. Direct attempts to modify policy, identity, approval, audit, signing, or deployment files must be denied by the operating environment and enforcement point.
2. Indirect attempts through symlinks, path traversal, package scripts, build hooks, generated code, plugin loading, dependency substitution and CI config changes must be denied.
3. Prompt injection through retrieved documents or tool outputs must not expand tools or privileges.
4. Forged human approvals, stale grants, replayed tokens and revoked authority must fail closed.
5. Model changes, adapter updates and tool-schema changes must not enlarge privileges without independent assessment.
6. Concurrent change/publish/revoke operations must preserve single-action authorization and evidence integrity.
7. Audit tampering, evidence suppression and release-signature substitution must be denied and detectable.
8. Cross-tenant access, data exfiltration, sandbox escape and resource exhaustion must be explicitly tested.
9. Missing policy, verifier or monitoring dependencies must not convert to allow.
10. A rollback may not silently reinstall a release whose permissions or signing state is no longer trusted.

## Phased acceptance criteria

**P0 — Discovery:** Inspect canonical repository, clean worktree, active stabilization gates, actual service accounts/containers, AI tools, CI/release permissions and branch protection. Produce a grounded trust-boundary inventory. No implementation claims.

**P1 — Specification:** Define a signed/versioned policy contract for modification classes, authoritative enforcement point, scopes, review identities and deterministic reason codes; document threat model and rollback plan.

**P2 — Isolated proof of concept:** In a disposable test environment, AI-originated code may modify an allowlisted test module and run harmless tests, but cannot write a protected file, alter policy, obtain an approval, change CI permissions or promote an artifact.

**P3 — Verification:** Execute positive and negative tests for all scenarios listed above, including concurrency, degraded conditions, malicious dependency hooks, and revocation. Collect exact commands, commit SHA, environment, results and evidence. Independent human security review is required for production use.

**P4 — Governed activation:** Only after owner approval, verified controls, signed release flow, monitoring and rollback; no silent promotion.

## Non-goals

- No model-training or runtime self-update implementation in this ADR.
- No privilege elevation, device modification, root functionality, independent policy rewrite, production deployment, branch-rule bypass or automatic protected merges.
- No claim of absolute immutability, certification or constitutional/legal status.
- No assertion that existing HumanAuthority or DeviceTrust prototypes provide this isolation without fresh repository-level validation.

## Consequences

Positive: preserves human authority and independent enforcement while allowing sandbox innovation and reviewable evolution.

Trade-offs: isolated workers, independent release identity, tests, audit storage, review process and recovery increase complexity and operational cost. No production self-editing will be offered until tests and independent review establish the required isolation.

## References

- [ADR-004 Zero Trust](ADR-004-zero-trust-security-baseline.md)
- [ADR-005 Data and Audit](ADR-005-data-and-audit-boundaries.md)
- [ADR-007 AI Governance](ADR-007-ai-provider-governance.md)
- [ADR-008 Release Provenance](ADR-008-release-provenance-and-recovery.md)
- [Stabilization Policy](../governance/STABILIZATION_POLICY.md)
- [Capability Register](../CAPABILITY_REGISTER.md)
