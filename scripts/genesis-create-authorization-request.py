#!/usr/bin/env python3
"""
Create a pending Genesis Human Sovereignty authorization request.

This tool deliberately DOES NOT approve or verify anything. It freezes an action
description and computes a digest so a future trusted verifier can bind a human
approval to the exact action.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import pathlib
import secrets
import uuid

ROOT = pathlib.Path(__file__).resolve().parents[1]

def digest_bytes(data: bytes) -> str:
    return "sha256:" + hashlib.sha256(data).hexdigest()

def file_digest(path: pathlib.Path) -> str:
    return digest_bytes(path.read_bytes())

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--kind", required=True)
    parser.add_argument("--summary", required=True)
    parser.add_argument("--resource", action="append", required=True)
    parser.add_argument("--ttl-seconds", type=int, default=300)
    parser.add_argument("--output", type=pathlib.Path)
    args = parser.parse_args()

    if args.ttl_seconds < 60 or args.ttl_seconds > 900:
        raise SystemExit("--ttl-seconds must be between 60 and 900")

    owner_law = ROOT / "docs/governance/OWNER_LAW.md"
    constitution = ROOT / "docs/governance/GENESIS_CONSTITUTION.md"
    policy = json.loads((ROOT / "config/genesis/owner-law.json").read_text(encoding="utf-8"))

    if args.kind not in set(policy["protectedActions"]):
        raise SystemExit(
            f"Action kind {args.kind!r} is not registered as an L5 protected action."
        )

    now = dt.datetime.now(dt.timezone.utc)
    expires = now + dt.timedelta(seconds=args.ttl_seconds)
    action_id = str(uuid.uuid4())
    nonce = secrets.token_urlsafe(32)

    canonical_action = {
        "actionId": action_id,
        "kind": args.kind,
        "resources": sorted(args.resource),
        "summary": args.summary.strip(),
        "reversible": False,
    }
    action_digest = digest_bytes(
        json.dumps(canonical_action, sort_keys=True, separators=(",", ":")).encode("utf-8")
    )
    canonical_action["digest"] = action_digest

    request = {
        "schemaVersion": "1.0.0",
        "status": "pending-human-sovereignty-verification",
        "action": canonical_action,
        "governance": {
            "ownerLawVersion": policy["ownerLawVersion"],
            "ownerLawDigest": file_digest(owner_law),
            "constitutionVersion": policy["constitutionVersion"],
            "constitutionDigest": file_digest(constitution),
        },
        "challenge": {
            "nonce": nonce,
            "issuedAt": now.isoformat().replace("+00:00", "Z"),
            "expiresAt": expires.isoformat().replace("+00:00", "Z"),
        },
        "requiredProofs": policy["humanSovereignty"]["proofRequirements"],
        "executionAllowed": False,
        "notice": (
            "This is only an authorization request. It is not approval. "
            "Execution remains blocked until a trusted Human Sovereignty verifier "
            "validates both required cryptographic proofs."
        ),
    }

    output = args.output or (
        ROOT / "out" / "genesis-authorization" / f"{action_id}.request.json"
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(request, indent=2) + "\n", encoding="utf-8")
    print(output)
    print(action_digest)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
