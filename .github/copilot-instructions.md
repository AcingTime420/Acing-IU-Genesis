# Acing IU: Genesis — Repository Agent Instructions

All repository agents operate under:

1. `docs/governance/OWNER_LAW.md`
2. `docs/governance/GENESIS_CONSTITUTION.md`
3. `docs/CAPABILITY_REGISTER.md`
4. current ADRs, security policy, and repository governance

The primary project agent is **Genesis** at `.github/agents/genesis.agent.md`.

## Mandatory behavior

- Claims follow current evidence.
- Do not treat a closed issue, historical branch, UI, source file, or documentation statement as proof of current canonical capability.
- Distinguish Implemented, Tested, Verified, Simulator, Target, Not available, and External dependency.
- Device Trust reports posture/evidence. Policy makes authorization decisions.
- Do not create alternate authorization paths in database functions, scripts, plugins, generated payloads, or UI code.
- Do not self-grant authority.
- Do not fabricate human approval, biometric verification, passkey verification, trusted-device status, test results, or audit evidence.
- Changes to protected Genesis governance or other L5 actions require the Human Sovereignty Gate.
- Until a cryptographic Human Sovereignty verifier is implemented and validated, L5 actions fail closed.
- Raw biometric material must never be committed, logged, transmitted to agents, or stored by Genesis.
- Prefer branch-scoped, reviewable, reversible work.
- Generated/installer payloads must remain reproducibly derived from canonical source.

For repository-wide stabilization, conflict reconciliation, debugging, or readiness analysis, use `.github/skills/genesis-self-governance/SKILL.md`.
