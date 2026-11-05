"""Exercise the actual sync gate against disposable source-tree fixtures."""
import pathlib
import shutil
import subprocess
import tempfile
import unittest

SCRIPT = pathlib.Path(__file__).resolve().parents[2] / "scripts/check-devicetrust-payload-sync.sh"

class PayloadSyncTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = pathlib.Path(self.temp.name)
        script = self.root / "scripts/check-devicetrust-payload-sync.sh"
        script.parent.mkdir()
        shutil.copyfile(SCRIPT, script)
        self.script = script
        self.canonical = self.root / "backend/DeviceTrust/src/AcingIU.DeviceTrust.Api"
        self.payload = self.root / "installer/payload/platform/backend/DeviceTrust/src/AcingIU.DeviceTrust.Api"
        for tree in (self.canonical, self.payload):
            tree.mkdir(parents=True)
            (tree / "Controller.cs").write_text("owner check")
            (tree / "Api.csproj").write_text("project")

    def run_gate(self):
        return subprocess.run(["bash", str(self.script)], capture_output=True, text=True).returncode

    def test_matching_sources_pass(self):
        self.assertEqual(0, self.run_gate())

    def test_changed_authorization_source_fails(self):
        (self.payload / "Controller.cs").write_text("no owner check")
        self.assertEqual(1, self.run_gate())

    def test_missing_source_fails(self):
        (self.payload / "Controller.cs").unlink()
        self.assertEqual(1, self.run_gate())

    def test_extra_source_fails(self):
        (self.payload / "Extra.cs").write_text("extra endpoint")
        self.assertEqual(1, self.run_gate())

    def test_project_dependency_drift_fails(self):
        (self.payload / "Api.csproj").write_text("different dependency")
        self.assertEqual(1, self.run_gate())

    def test_symlink_source_cannot_evade_inventory(self):
        external = self.root / "External.cs"
        external.write_text("extra compiled source")
        (self.payload / "Extra.cs").symlink_to(external)
        self.assertEqual(1, self.run_gate())

    def test_generated_output_and_packaging_do_not_mask_source_drift(self):
        for relative in ("bin/Release/generated.dll", "obj/build.cs", "Dockerfile", ".dockerignore"):
            target = self.canonical / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text("generated or packaging")
        self.assertEqual(0, self.run_gate())
        (self.payload / "Controller.cs").write_text("bypass")
        self.assertEqual(1, self.run_gate())

    def test_missing_tree_fails(self):
        shutil.rmtree(self.payload)
        self.assertEqual(1, self.run_gate())

if __name__ == "__main__":
    unittest.main()
