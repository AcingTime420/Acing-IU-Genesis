"""Offline unit tests for the Genesis read-only firmware inspector."""
import contextlib
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "firmware_inspect.py"
spec = importlib.util.spec_from_file_location("firmware_inspect", SCRIPT)
assert spec is not None and spec.loader is not None
inspector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inspector)


class FirmwareInspectorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)

    def test_real_bytes_are_hashed(self):
        payload = b"synthetic-test-data\x00\x01"
        file = self.directory / "example.bin"
        file.write_bytes(payload)
        result = inspector.inspect_file(str(file))
        self.assertEqual(result["sha256"], hashlib.sha256(payload).hexdigest())
        self.assertEqual(result["size_bytes"], len(payload))
        self.assertEqual(result["authenticity"], "NOT_VERIFIED")
        self.assertEqual(result["device_compatibility"], "NOT_ASSESSED")

    def test_empty_file(self):
        file = self.directory / "empty.bin"
        file.touch()
        self.assertEqual(
            inspector.inspect_file(str(file))["sha256"],
            hashlib.sha256(b"").hexdigest(),
        )

    def test_directory_rejected(self):
        with self.assertRaises(inspector.InspectionError):
            inspector.inspect_file(str(self.directory))

    def test_missing_file_rejected(self):
        with self.assertRaises(inspector.InspectionError):
            inspector.inspect_file(str(self.directory / "absent.bin"))

    def test_symlink_rejected(self):
        original = self.directory / "original.bin"
        original.write_bytes(b"data")
        link = self.directory / "link.bin"
        try:
            link.symlink_to(original)
        except (OSError, NotImplementedError):
            self.skipTest("Symbolic links are unavailable in this environment")
        with self.assertRaises(inspector.InspectionError):
            inspector.inspect_file(str(link))

    def test_mixed_result_returns_failure_and_no_false_verification(self):
        file = self.directory / "valid.bin"
        file.write_bytes(b"payload")
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            status = inspector.run([str(file), str(self.directory / "missing")])
        report = json.loads(output.getvalue())
        self.assertEqual(status, 1)
        self.assertEqual(report["scope"], "READ_ONLY_FILE_METADATA")
        self.assertEqual(report["results"][0]["status"], "OBSERVED_ONLY")
        self.assertEqual(report["results"][1]["status"], "ERROR")


if __name__ == "__main__":
    unittest.main()
