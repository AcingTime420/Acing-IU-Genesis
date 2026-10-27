#!/usr/bin/env python3
"""Exercise real build/validator exit behavior in disposable repositories.

Fixture Makefiles inject build outcomes; real Kotlin compilation is validated
separately by CI. No boot or device scripts are executed by these tests.
"""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
OUTPUTS = ("guardian.jar", "guardian_init.sh", "iu_security_init", "iu_auth_service",
           "acing_vault_init", "acing_vault_check_tamper")


class BuildExitTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="genesis-build-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "repository with spaces"
        self.root.mkdir()
        shutil.copy2(ROOT / "build.sh", self.root / "build.sh")
        self.build = self.root / "system/security/guardian/build"
        self.build.mkdir(parents=True)
        self.environment = os.environ.copy()

    def makefile(self, content):
        (self.build / "Makefile").write_text(content, encoding="utf-8")

    def outputs(self, omitted=()):
        self.makefile(".PHONY: all\nall:\n\t@true\n")
        out = self.build / "out"
        out.mkdir()
        for name in OUTPUTS:
            if name not in omitted:
                (out / name).write_text("synthetic build output\n", encoding="utf-8")

    def run_build(self):
        # A different working directory verifies script-relative path handling.
        return subprocess.run(["bash", str(self.root / "build.sh")], cwd=self.temp.name,
                              env=self.environment, capture_output=True, text=True, timeout=15)

    def assert_failed(self, result):
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertNotIn("build completed successfully", result.stdout)

    def test_missing_makefile_fails_without_success(self):
        self.assert_failed(self.run_build())

    def test_make_failure_propagates(self):
        self.makefile(".PHONY: all\nall:\n\t@exit 23\n")
        self.assert_failed(self.run_build())

    def test_missing_jar_fails(self):
        self.outputs(omitted=("guardian.jar",))
        self.assert_failed(self.run_build())

    def test_missing_packaged_script_fails(self):
        self.outputs(omitted=("iu_auth_service",))
        self.assert_failed(self.run_build())

    def test_success_packages_every_expected_output(self):
        self.outputs()
        result = self.run_build()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        for name in OUTPUTS:
            self.assertTrue((self.root / "out/security/guardian" / name).is_file(), name)
            self.assertEqual((self.root / "out/security/guardian" / name).read_bytes(),
                             (self.build / "out" / name).read_bytes())
        self.assertIn("build completed successfully", result.stdout)

    def test_validator_reports_child_failure(self):
        scripts = self.root / "scripts"
        scripts.mkdir()
        shutil.copy2(ROOT / "scripts/validate-premerge.sh", scripts / "validate-premerge.sh")
        # Match the historical fallback path: no Makefile, existing build.sh.
        tools = self.root / "fixture-tools"
        tools.mkdir()
        compiler = tools / "kotlinc"
        compiler.write_text("#!/bin/sh\nexit 0\n", encoding="utf-8")
        compiler.chmod(0o755)
        self.environment["PATH"] = str(tools) + os.pathsep + self.environment["PATH"]
        subprocess.run(["git", "init", "--quiet", str(self.root)], check=True,
                       capture_output=True, timeout=10)
        result = subprocess.run(["bash", str(scripts / "validate-premerge.sh"), "--skip-compose"],
                                cwd=self.root, env=self.environment, text=True,
                                capture_output=True, timeout=15)
        self.assert_failed(result)
        self.assertNotIn("All enabled checks PASSED", result.stdout)


if __name__ == "__main__":
    unittest.main(verbosity=2)
