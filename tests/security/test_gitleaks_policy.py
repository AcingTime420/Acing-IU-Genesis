#!/usr/bin/env python3
"""Exercise actual secret detection and allowlist conjunctions in disposable Git.

Only synthetic canaries are generated. No external token verification occurs,
and neither canaries nor unredacted scanner output are printed or retained.
"""
import argparse
import base64
import json
from pathlib import Path
import secrets
import string
import subprocess
import tempfile
import tomllib
import uuid


ROOT = Path(__file__).resolve().parents[2]
PATHS = ["acing-iu/docs/API.md", "backend/Identity/Controllers/AuthController.cs",
         "acing-iu/backend/Identity/Controllers/AuthController.cs",
         ".refact/buddy/memory_ops.jsonl", "outside.txt",
         "installer/payload/platform/backend/Identity/Controllers/AuthController.cs",
         ".env.example", "infrastructure/.env.example",
         "installer/payload/platform/.env.example"]


def git(repo, *args):
    return subprocess.check_output(["git", "-C", str(repo), *args], text=True).strip()


def commit(repo):
    git(repo, "add", ".")
    git(repo, "-c", "user.name=Policy fixture", "-c", "user.email=fixture@example.invalid",
        "commit", "-qm", "Disposable synthetic scanner fixture")
    return git(repo, "rev-parse", "HEAD")


def scan(binary, repo, config, report, mode="git", log="--all"):
    command = [binary, mode, str(repo), "--config", str(config), "--redact=100",
               "--no-banner", "--report-format=json", "--report-path", str(report)]
    if mode == "git":
        command.append("--log-opts=" + log)
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode not in (0, 1) or not report.is_file():
        raise RuntimeError("Scanner failed to produce current fixture results")
    findings = json.loads(report.read_text())
    if (result.returncode == 0) != (not findings):
        raise RuntimeError("Scanner status and finding report disagree")
    return findings


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--gitleaks", default="gitleaks")
    binary = parser.parse_args().gitleaks
    version = subprocess.check_output([binary, "version"], text=True).strip()
    if version != "8.30.1":
        raise RuntimeError("Policy regressions require the verified CI pin Gitleaks 8.30.1")
    policy = (ROOT / ".gitleaks.toml").read_text()
    with tempfile.TemporaryDirectory(prefix="genesis-secret-policy-") as directory:
        work = Path(directory)
        config = work / "policy.toml"
        config.write_text(policy)
        repo = work / "future"
        repo.mkdir()
        git(repo, "init", "-q")
        for name in PATHS:
            target = repo / name
            target.parent.mkdir(parents=True, exist_ok=True)
            canary = "ghp_" + "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(36))
            target.write_text('token = "' + canary + '"\n')
        commit(repo)
        for mode in ["git", "dir"]:
            findings = scan(binary, repo, config, work / (mode + ".json"), mode)
            detected = {f["File"] for f in findings if f["RuleID"] == "github-pat"}
            # Directory mode may return absolute paths; compare normalized suffixes.
            if not all(any(path == name or path.endswith("/" + name) for path in detected) for name in PATHS):
                raise AssertionError("Policy suppressed a future canary in " + mode + " mode")
        print("PASS: future credential-shaped canaries detected in all exempted paths and outside, in Git and directory scans")

        # Each path/value-shape exception and each configured historical commit
        # receives an independent fixture. No historical secret is copied here.
        allowlists = tomllib.loads(policy)["allowlists"]
        token_value = "TEST_FIXTURE_" + secrets.token_hex(12)
        uuid_value = str(uuid.uuid4())
        base32_value = base64.b32encode(b"non-secret fixture").decode().rstrip("=")
        cases = [
            (PATHS[1], 'AccessToken = "{}"', 'OtherToken = "{}"', token_value, "assignment"),
            (PATHS[2], 'AccessToken = "{}"', 'OtherToken = "{}"', token_value, "assignment"),
            (PATHS[0], '"accessToken": "{}"', '"otherToken": "{}"', token_value, "json"),
            (PATHS[0], '"refreshToken": "{}"', '"otherToken": "{}"', uuid_value, "json"),
            (PATHS[0], '"secretKey": "{}"', '"otherToken": "{}"', base32_value, "json"),
            (PATHS[3], 'idempotency_key":"{}"', 'other_key":"{}"', token_value, "memory"),
            (PATHS[5], 'AccessToken = "{}"', 'OtherToken = "{}"',
             "SYNTHETIC_HEADER.SYNTHETIC_PAYLOAD...", "installer"),
        ]
        for path in PATHS[6:]:
            cases.extend([
                (path, 'JWT_SIGNING_KEY={}', 'OTHER_SIGNING_KEY={}',
                 "placeholder_signing_key_32_chars", "environment"),
                (path, 'MFA_SECRET_PROTECTION_KEY_MFA_V1={}', 'OTHER_SIGNING_KEY={}',
                 "placeholder_key_32_bytes", "environment"),
            ])
        patterns = {
            "assignment": r'(?m)^(?:AccessToken|OtherToken)\s*=\s*"([^"\r\n]+)"',
            # The default generic-api-key match omits the JSON key's opening quote.
            "json": r'(?m)(?:accessToken|refreshToken|secretKey|otherToken)"\s*:\s*"([^"\r\n]+)"',
            "memory": r'(?m)^(?:idempotency_key|other_key)":"([^"\r\n]+)"',
            "installer": r'(?m)^(?:AccessToken|OtherToken)\s*=\s*"([^"\r\n]+)"',
            "environment": r'(?m)^(?:JWT_SIGNING_KEY|MFA_SECRET_PROTECTION_KEY_MFA_V1|OTHER_SIGNING_KEY)=([^\r\n]+)',
        }
        count = 0
        for path, matching, unrelated, value, kind in cases:
            index = {"memory": 1, "installer": 2, "environment": 3}.get(kind, 0)
            ids = allowlists[index]["commits"]
            for original_commit in ids:
                count += 1
                repo = work / ("criteria-" + str(count))
                repo.mkdir()
                git(repo, "init", "-q")
                target = repo / path
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(matching.format(value) + "\n" + unrelated.format(value) + "\n")
                (repo / "outside.txt").write_text(matching.format(value) + "\n")
                historical = commit(repo)
                fixture_policy = policy.replace(original_commit, historical)
                fixture_policy += "\n[[rules]]\nid = \"criteria-fixture\"\ndescription = \"Synthetic conjunction probe only\"\nregex = "+"'"*3+patterns[kind]+"'"*3+"\nsecretGroup = 1\n"
                config.write_text(fixture_policy)
                findings = scan(binary, repo, config, work / ("historical-" + str(count) + ".json"))
                positions = {(f["File"], f["StartLine"]) for f in findings if f["RuleID"] == "criteria-fixture"}
                if positions != {(path, 2), ("outside.txt", 1)}:
                    raise AssertionError("Historical exception must require commit AND path AND matching value shape")
                with target.open("a") as output:
                    output.write(matching.format(value) + "\n")
                commit(repo)
                findings = scan(binary, repo, config, work / ("new-commit-" + str(count) + ".json"), log=historical + "..HEAD")
                if not any(f["RuleID"] == "criteria-fixture" and f["StartLine"] == 3 for f in findings):
                    raise AssertionError("Matching value in a later commit must remain detectable")
        print(f"PASS: {count} historical path/value/commit conjunction fixtures retain unrelated findings and later-commit detection")


if __name__ == "__main__":
    main()
