#!/usr/bin/env python3
"""
Genesis governance integrity check.

This script does not verify WebAuthn or biometric proof. It verifies that the
repository contains the constitutional artifacts and that the machine-readable
Owner Law remains internally consistent with the fail-closed bootstrap state.
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

REQUIRED = [
    ROOT / ".github/agents/genesis.agent.md",
    ROOT / ".github/skills/genesis-self-governance/SKILL.md",
    ROOT / ".github/copilot-instructions.md",
    ROOT / "docs/governance/GENESIS_CONSTITUTION.md",
    ROOT / "docs/governance/OWNER_LAW.md",
    ROOT / "config/genesis/owner-law.json",
    ROOT / "schemas/genesis-human-authorization-request.schema.json",
    ROOT / "schemas/genesis-human-authorization-receipt.schema.json",
]

PROTECTED_ACTIONS = {
    "owner-law-change",
    "genesis-constitution-change",
    "human-sovereignty-verifier-change",
    "approval-device-enroll",
    "approval-device-revoke",
    "agent-standing-authority-grant",
    "root-trust-anchor-change",
    "production-release",
    "production-deployment",
    "irreversible-data-destruction",
    "security-denial-override",
    "audit-disable",
    "provenance-disable",
    "privileged-device-executor-enable",
    "protected-capability-graduation",
}

def fail(message: str) -> None:
    print(f"::error::{message}")

def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main() -> int:
    errors = 0

    for path in REQUIRED:
        if not path.is_file():
            fail(f"Missing Genesis governance artifact: {path.relative_to(ROOT)}")
            errors += 1

    if errors:
        return 1

    policy_path = ROOT / "config/genesis/owner-law.json"
    schema_path = ROOT / "schemas/genesis-human-authorization-receipt.schema.json"

    try:
        policy = json.loads(policy_path.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"Owner Law JSON is invalid: {exc}")
        return 1

    try:
        json.loads(schema_path.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"Human authorization receipt schema is invalid JSON: {exc}")
        errors += 1

    if policy.get("defaultDecision") != "deny":
        fail("Owner Law defaultDecision must remain 'deny'.")
        errors += 1

    auth = policy.get("humanSovereignty", {})
    if auth.get("failClosed") is not True:
        fail("Human Sovereignty Gate must fail closed.")
        errors += 1
    if auth.get("requireUserVerification") is not True:
        fail("Human Sovereignty Gate must require user verification.")
        errors += 1
    if auth.get("acceptRawBiometrics") is not False:
        fail("Raw biometric material must not be accepted by Genesis.")
        errors += 1

    proofs = set(auth.get("proofRequirements", []))
    required_proofs = {
        "webauthn-user-verification",
        "device-bound-genesis-approval-key",
    }
    missing = required_proofs - proofs
    if missing:
        fail(f"Missing required Human Sovereignty proofs: {sorted(missing)}")
        errors += 1

    configured_actions = set(policy.get("protectedActions", []))
    missing_actions = PROTECTED_ACTIONS - configured_actions
    if missing_actions:
        fail(f"Protected L5 actions were removed: {sorted(missing_actions)}")
        errors += 1

    verifier_dir = ROOT / "backend/Identity/src/AcingIU.Identity.Api/HumanAuthorization"
    enforcement_state = auth.get("enforcementState")

    if verifier_dir.exists():
        print("HumanAuthorization implementation directory detected.")
        if enforcement_state == "blocked-until-verified-runtime":
            print("Verifier implementation exists but policy still correctly remains blocked pending validation.")
    else:
        if enforcement_state != "blocked-until-verified-runtime":
            fail(
                "Human Sovereignty enforcement cannot be declared active while "
                "no canonical HumanAuthorization verifier implementation exists."
            )
            errors += 1

    agent_text = (ROOT / ".github/agents/genesis.agent.md").read_text(encoding="utf-8")
    for required_phrase in (
        "Never grant itself",
        "Human Sovereignty Gate",
        "genesis-self-governance",
    ):
        if required_phrase not in agent_text:
            fail(f"Genesis agent profile lost required boundary: {required_phrase}")
            errors += 1

    print("Genesis governance digests:")
    for path in (
        ROOT / "docs/governance/GENESIS_CONSTITUTION.md",
        ROOT / "docs/governance/OWNER_LAW.md",
        policy_path,
    ):
        print(f"  {path.relative_to(ROOT)} sha256:{sha256(path)}")

    if errors:
        print(f"Genesis governance integrity FAILED with {errors} error(s).")
        return 1

    print("Genesis governance integrity PASSED.")
    print("Note: this check does not constitute WebAuthn/Human Sovereignty verification.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
