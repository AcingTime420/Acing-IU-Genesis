"""Credential guards: synthetic files only; no Windows ACL validation is claimed."""
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("authority_cli", Path(__file__).resolve().parents[1] / "scripts/genesis-authority.py")
cli = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cli)

class CredentialGuards(unittest.TestCase):
    @unittest.skipUnless(os.name == "posix", "POSIX file mode checks require POSIX")
    def test_save_is_private_and_existing_file_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "fixture.json"
            cli.save(path, {"human": {"credential": "synthetic-only"}})
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            self.assertEqual(cli.token(path, "human"), "synthetic-only")
            with self.assertRaises(ValueError):
                cli.save(path, {})
            self.assertEqual(cli.token(path, "human"), "synthetic-only")

    @unittest.skipUnless(os.name == "posix", "POSIX file mode checks require POSIX")
    def test_public_mode_and_symlink_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "fixture.json"
            path.write_text(json.dumps({"human": {"credential": "synthetic-only"}}))
            path.chmod(0o644)
            with self.assertRaises(ValueError): cli.token(path, "human")
            path.chmod(0o600)
            link = Path(directory) / "link.json"
            link.symlink_to(path)
            with self.assertRaises(ValueError): cli.token(link, "human")

    def test_unsupported_windows_guard_fails_before_file_access(self):
        with patch.object(cli.os, "name", "nt"):
            with self.assertRaisesRegex(ValueError, "Windows ACL validation is not implemented"):
                cli.token("not-accessed.json", "human")
            with self.assertRaisesRegex(ValueError, "Windows ACL validation is not implemented"):
                cli.save("not-created.json", {})

if __name__ == "__main__": unittest.main()
