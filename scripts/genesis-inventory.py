#!/usr/bin/env python3
"""Read-only, offline Git inventory. Source presence is never validation evidence.

Run with Python 3.10+ from any directory. No packages, service startup, network,
environment-file reads, checkout changes, or credential collection are required.
JSON is written to stdout; redirect it to a private evidence location if needed.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path


class InventoryError(Exception):
    """An incomplete inventory must not be reported as a successful baseline."""


def git(repo: Path, *args: str) -> str:
    try:
        result = subprocess.run(
            ["git", "-C", str(repo), *args], check=False, capture_output=True,
            encoding="utf-8", errors="strict", timeout=30,
        )
    except (OSError, subprocess.TimeoutExpired, UnicodeError) as exc:
        raise InventoryError("Git could not complete the inventory command.") from exc
    if result.returncode:
        # Do not echo subprocess diagnostics: remote URLs may embed credentials.
        raise InventoryError("Git rejected an inventory command; check repository and ref.")
    return result.stdout


def collect(repo: Path, ref: str) -> dict:
    # Resolve user input with option termination; subsequent reads use only this SHA.
    sha = git(repo, "rev-parse", "--verify", "--end-of-options", ref + "^{commit}").strip()
    files = sorted(filter(None, git(repo, "ls-tree", "-r", "--name-only", "-z", sha).split("\0")))
    manifests = []
    for path in files:
        # Parse only declared build manifests from Git, never working .env or settings.
        if not (path.endswith(".csproj") or Path(path).name == "package.json"):
            continue
        content = git(repo, "show", f"{sha}:{path}")
        try:
            if path.endswith(".csproj"):
                root = ET.fromstring(content)
                frameworks = [node.text for node in root.iter()
                              if node.tag.rsplit("}", 1)[-1] in ("TargetFramework", "TargetFrameworks")]
                manifests.append({"path": path, "type": "dotnet", "target_frameworks": frameworks})
            else:
                data = json.loads(content)
                if not isinstance(data, dict):
                    raise ValueError("Package manifest must be an object")
                scripts = data.get("scripts", {})
                dependencies = data.get("dependencies", {})
                if not isinstance(scripts, dict) or not isinstance(dependencies, dict):
                    raise ValueError("Manifest scripts/dependencies must be objects")
                manifests.append({"path": path, "type": "node", "script_names": sorted(scripts),
                                  "next_version": dependencies.get("next")})
        except (ValueError, ET.ParseError) as exc:
            raise InventoryError(f"Invalid build manifest: {path}") from exc
    status = git(repo, "status", "--porcelain=v1", "-z", "--untracked-files=normal")
    branches = git(repo, "for-each-ref", "--format=%(refname)", "refs/heads", "refs/remotes").splitlines()
    return {
        "schema_version": 1,
        "recorded_at_utc": datetime.now(timezone.utc).isoformat(),
        "inspected_commit": sha,
        "working_head": git(repo, "rev-parse", "HEAD").strip(),
        "working_tree_dirty": bool(status),
        "working_tree_contents_inspected": False,
        "branches": branches,
        "tracked_file_count": len(files),
        "build_manifests": manifests,
        "gradle_entrypoints": [p for p in files if Path(p).name in
                               ("gradlew", "gradlew.bat", "build.gradle.kts", "settings.gradle.kts",
                                "build.gradle", "settings.gradle")],
        "workflow_paths": [p for p in files if p.startswith(".github/workflows/")],
        "test_paths": [p for p in files if p.startswith(("tests/", "frontend/tests/"))],
        "migration_paths": [p for p in files if p.startswith("database/migrations/")],
        "capability_register_present": "docs/CAPABILITY_REGISTER.md" in files,
        "tests_executed": False,
        "production_readiness": "unverified",
        "limits": ["Offline source inventory only; no GitHub PR, Actions, or alert refresh.",
                   "Remote refs may be stale. No fetch was performed.",
                   "No service, database, local model, device, or Windows validation performed.",
                   "Manifest versions are declarations, not installed-runtime measurements.",
                   "Source presence does not establish working or secure capabilities."],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--ref", default="HEAD", help="Commit or known ref to inspect; defaults to HEAD")
    args = parser.parse_args()
    try:
        report = collect(args.repo.resolve(), args.ref)
        print(json.dumps(report, indent=2, ensure_ascii=True))
        return 0
    except (InventoryError, OSError) as exc:
        print(f"Inventory failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
