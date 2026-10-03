#!/usr/bin/env python3
"""Fail-closed validation for Genesis people-first trust requirements.

This checker validates the repository evidence model. It does not certify
Genesis, verify external standards conformance, or prove runtime behavior that
is not represented by current tests/evidence.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config/genesis/human-trust-requirements.json"
ALLOWED = {"Verified", "Tested", "Implemented", "Target", "Not available"}
OVERCLAIM = ("fully verified", "certified", "guaranteed safe", "guarantees safety")


def fail(message: str) -> None:
    print(f"::error::{message}")
    raise SystemExit(1)


def require_path(path_text: str, context: str) -> None:
    if not path_text:
        return
    candidate = (ROOT / path_text).resolve()
    try:
        candidate.relative_to(ROOT.resolve())
    except ValueError:
        fail(f"{context}: path escapes repository: {path_text}")
    if not candidate.exists():
        fail(f"{context}: referenced repository evidence does not exist: {path_text}")


def main() -> int:
    if not CONFIG.is_file():
        fail(f"missing trust requirements: {CONFIG.relative_to(ROOT)}")

    data = json.loads(CONFIG.read_text(encoding="utf-8"))

    if data.get("schemaVersion") != "1.0.0":
        fail("schemaVersion must be 1.0.0")
    if data.get("framework") != "Genesis Human Trust Validation":
        fail("unexpected framework name")

    project = data.get("project", {})
    principal = project.get("governancePrincipal", {})
    if principal.get("github") != "AcingTime420":
        fail("current repository governance principal must remain explicit")
    if principal.get("legalOwnershipClaim") != "not-established-by-this-file":
        fail("repository governance must not be presented as self-proving legal ownership")

    disclaimer = data.get("alignmentDisclaimer", "").lower()
    for required_word in ("certification", "compliance", "endorsement"):
        if required_word not in disclaimer:
            fail(f"alignment disclaimer must explicitly reject {required_word} claims")

    alignments = data.get("externalAlignments", [])
    alignment_ids: set[str] = set()
    for item in alignments:
        aid = item.get("id", "")
        if not aid or aid in alignment_ids:
            fail(f"external alignment id is empty or duplicated: {aid!r}")
        alignment_ids.add(aid)
        parsed = urlparse(item.get("reference", ""))
        if parsed.scheme != "https" or not parsed.netloc:
            fail(f"{aid}: external reference must be an https URL")

    questions = data.get("questions", [])
    if len(questions) < 16:
        fail("trust framework must contain at least the 16 approved people-first questions")

    seen: set[str] = set()
    counts = {label: 0 for label in ALLOWED}

    for q in questions:
        qid = q.get("id", "")
        if qid in seen or not qid.startswith("HTQ-"):
            fail(f"invalid or duplicate question id: {qid!r}")
        seen.add(qid)

        status = q.get("status")
        if status not in ALLOWED:
            fail(f"{qid}: unsupported maturity status {status!r}")
        counts[status] += 1

        required_text = (
            "question",
            "plainLanguageAnswer",
            "currentTruth",
            "peopleImpact",
            "risk",
            "completionCondition",
        )
        for field in required_text:
            if not str(q.get(field, "")).strip():
                fail(f"{qid}: required field {field} is empty")

        non_claims = q.get("nonClaims", [])
        if not non_claims:
            fail(f"{qid}: at least one explicit non-claim is required")

        for aid in q.get("externalAlignmentIds", []):
            if aid not in alignment_ids:
                fail(f"{qid}: unknown external alignment id {aid}")

        for field in ("controls", "evidencePaths", "validationPaths"):
            values = q.get(field, [])
            if not isinstance(values, list):
                fail(f"{qid}: {field} must be a list")
            for value in values:
                require_path(value, f"{qid}.{field}")

        if status == "Verified":
            if not q.get("evidencePaths") or not q.get("validationPaths"):
                fail(f"{qid}: Verified requires both evidencePaths and validationPaths")

        if status == "Tested" and not q.get("validationPaths"):
            fail(f"{qid}: Tested requires at least one validation path")

        if status != "Verified":
            combined = " ".join(
                [
                    q.get("plainLanguageAnswer", ""),
                    q.get("currentTruth", ""),
                ]
            ).lower()
            for phrase in OVERCLAIM:
                if phrase in combined:
                    fail(f"{qid}: non-Verified answer contains overclaim phrase {phrase!r}")

    if counts["Target"] == 0:
        fail("framework must preserve explicit Target items rather than implying total completion")

    print("Genesis Human Trust Validation: PASS")
    print(f"Questions validated: {len(questions)}")
    print("Maturity counts:")
    for label in ("Verified", "Tested", "Implemented", "Target", "Not available"):
        print(f"  {label}: {counts[label]}")
    print("External alignment references are informational only; no certification is asserted.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
