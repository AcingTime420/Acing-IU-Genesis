"""Exercise the build exit contract with isolated, synthetic Make targets."""
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


@unittest.skipUnless(shutil.which("bash") and shutil.which("make"), "Bash and Make required")
class BuildEntrypointTests(unittest.TestCase):
    def run_build(self, recipe=None, outside=False):
        with tempfile.TemporaryDirectory(prefix="genesis-build-test-") as directory:
            root = Path(directory) / "checkout with spaces"
            root.mkdir()
            script = root / "build.sh"
            shutil.copyfile(Path(__file__).resolve().parents[1] / "build.sh", script)
            if recipe is not None:
                build = root / "system/security/guardian/build"
                build.mkdir(parents=True)
                (build / "Makefile").write_text("all:\n" + recipe, encoding="utf-8")
            result = subprocess.run(
                [shutil.which("bash"), str(script)],
                cwd=directory if outside else root,
                capture_output=True, text=True, timeout=15,
            )
            output = root / "out/security/guardian/guardian.jar"
            return result, output.read_text() if output.exists() else None

    def test_missing_build_directory_cannot_report_success(self):
        result, _ = self.run_build()
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertNotIn("build process completed", result.stdout)

    def test_make_failure_cannot_report_success(self):
        result, _ = self.run_build("\t@exit 23\n")
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertNotIn("build process completed", result.stdout)

    def test_missing_generated_files_cannot_report_success(self):
        result, _ = self.run_build("\t@mkdir -p out\n")
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertNotIn("build process completed", result.stdout)

    def test_success_resolves_checkout_from_script_location(self):
        # Real Make creates synthetic files; this is not Guardian compilation evidence.
        recipe = "\t@mkdir -p out\n\t@printf 'synthetic-jar' > out/guardian.jar\n"
        for name in ("guardian_init.sh", "iu_security_init", "iu_auth_service",
                     "acing_vault_init", "acing_vault_check_tamper"):
            recipe += "\t@touch out/" + name + "\n"
        result, content = self.run_build(recipe, outside=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(content, "synthetic-jar")


if __name__ == "__main__":
    unittest.main()
