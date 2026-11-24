"""Run actual Gitleaks against history and disposable future-secret canaries."""
import json
import os
from pathlib import Path
import secrets
import shutil
import string
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
BINARY = os.environ.get("GENESIS_GITLEAKS_BINARY") or shutil.which("gitleaks")


@unittest.skipUnless(BINARY, "Set GENESIS_GITLEAKS_BINARY to run actual scanner regressions")
class SecretScanExceptionsTests(unittest.TestCase):
    def scan(self, repo, report, mode="git"):
        command = [BINARY, mode, str(repo), "--redact=100", "--no-banner",
                   "--report-format=json", "--report-path", str(report)]
        if mode == "git":
            command.append("--log-opts=--all")
        result = subprocess.run(command, cwd=repo, capture_output=True, text=True, timeout=60)
        self.assertIn(result.returncode, (0, 1), "Scanner execution failed")
        self.assertTrue(report.is_file(), "Scanner did not produce a report")
        findings = json.loads(report.read_text())
        self.assertEqual(result.returncode == 0, not findings, "Exit status/report disagreement")
        return findings

    def test_reviewed_history_passes_actual_scan(self):
        with tempfile.TemporaryDirectory(prefix="genesis-secret-history-") as directory:
            findings = self.scan(ROOT, Path(directory) / "redacted.json")
            self.assertEqual(len(findings), 0, "Unresolved scanner findings remain in repository history")

    def test_new_secrets_remain_detectable_in_previously_flagged_paths(self):
        paths = [".env.example", "acing-iu/docs/API.md",
                 "backend/Identity/Controllers/AuthController.cs",
                 ".refact/buddy/memory_ops.jsonl", "outside.txt"]
        with tempfile.TemporaryDirectory(prefix="genesis-secret-canary-") as directory:
            work = Path(directory)
            repo = work / "fixture"
            repo.mkdir()
            subprocess.run(["git", "init", "-q", str(repo)], check=True, capture_output=True)
            ignore = ROOT / ".gitleaksignore"
            if ignore.exists():
                shutil.copyfile(ignore, repo / ".gitleaksignore")
            for name in paths:
                target = repo / name
                target.parent.mkdir(parents=True, exist_ok=True)
                canary = "ghp_" + "".join(secrets.choice(string.ascii_letters + string.digits)
                                         for _ in range(36))
                target.write_text('token = "' + canary + '"\n', encoding="utf-8")
            subprocess.run(["git", "add", "-f", "."], cwd=repo, check=True, capture_output=True)
            subprocess.run(["git", "-c", "user.name=Synthetic scanner fixture",
                            "-c", "user.email=fixture@example.invalid", "commit", "-qm",
                            "Disposable synthetic scanner canaries"],
                           cwd=repo, check=True, capture_output=True)
            for mode in ("git", "dir"):
                with self.subTest(mode=mode):
                    findings = self.scan(repo, work / (mode + ".json"), mode)
                    detected = {f["File"].replace("\\", "/") for f in findings
                                if f["RuleID"] == "github-pat"}
                    for name in paths:
                        self.assertTrue(any(p == name or p.endswith("/" + name) for p in detected),
                                        "New canary was suppressed in " + name)


if __name__ == "__main__":
    unittest.main()
