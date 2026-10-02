# ADR-009: Genesis Sovereign Agent and Human Sovereignty Gate

- **Status:** Accepted architecture; verifier implementation pending
- **Date:** 2026-10-01
- **Decision owners:** Physical Being (Human) / Acing IU: Genesis governance
- **Related:** ADR-004, ADR-005, ADR-007, ADR-008

## Context

Genesis requires one accountable primary agent capable of coordinating specialized agents, reconciling repository truth, stopping contradictory work, and applying governance consistently.

Giving a model broad orchestration authority without a stronger human boundary would create unacceptable self-escalation and confused-deputy risk.

## Decision

The primary non-human agent is named **Genesis**.

Genesis receives the broadest non-human orchestration role and the strongest non-human responsibility.

Genesis authority is subordinate to:

1. applicable external legal/platform/safety boundaries;
2. the authenticated physical Being (Human);
3. Owner Law;
4. Genesis Constitution;
5. scoped runtime/tool permissions.

Genesis cannot self-authorize an L5 action.

## Human Sovereignty Gate

Protected L5 actions require an external trusted verifier.

The target gate uses:

- WebAuthn/passkey user verification; and
- a device-bound Genesis Approval Key registered to a separate trusted companion device.

A synced passkey may participate in user verification but is insufficient by itself to prove which physical device approved a strict separate-device action.

Raw biometric material never leaves the authenticator/device.

## Fail-closed bootstrap

No weaker fallback is allowed while the verifier is absent.

Until implemented and validated, an L5 request can be analyzed and prepared but not executed.

## Consequences

### Positive

- human authority remains explicit;
- agent delegation cannot amplify authority;
- approvals bind to exact actions;
- biometric privacy is preserved;
- high-risk actions become auditable and replay-resistant by design;
- Genesis can automate low-risk stabilization without pretending it has owner sovereignty.

### Costs

- L5 work remains blocked until Identity/trusted-device/WebAuthn support exists;
- recovery and approval-device lifecycle require careful engineering;
- synced credentials alone cannot meet the strictest device-recognition requirement;
- verifier availability becomes a critical security dependency.

## Implementation stages

1. Repository constitution, Owner Law, agent profile, skill, schemas, and deterministic governance lint.
2. Identity passkey/WebAuthn enrollment and assertion verification.
3. Trusted companion-device enrollment with device-bound approval key.
4. Human Authorization service binding both proofs to the action digest.
5. Policy integration and audit receipts.
6. recovery, revocation, concurrency, replay, expiry, and compromised-device testing.
7. capability reclassification only after reproducible evidence.
