"""Synthetic credential guards; real native-helper IPC cases run only on Windows."""
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

    def test_mismatched_platform_guard_fails_before_file_access(self):
        with patch.object(cli.os, "name", "nt"), patch.object(cli.sys, "platform", "linux"):
            with self.assertRaisesRegex(ValueError, "Native Windows credential validation is unavailable"):
                cli.token("not-accessed.json", "human")
            with self.assertRaisesRegex(ValueError, "Native Windows credential validation is unavailable"):
                cli.save("not-created.json", {})

class ArtifactGuards(unittest.TestCase):
    def test_missing_release_cannot_fall_back_to_debug(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            debug = root / "backend/AuthorityCredentialFiles/bin/Debug/net10.0"
            debug.mkdir(parents=True)
            (debug / "AuthorityCredentialFiles.dll").write_text("synthetic-stale-artifact")
            with patch.object(cli, "ROOT", root):
                with self.assertRaisesRegex(ValueError, "Missing supported Release"):
                    cli.windows_helper_artifact()

    def test_old_runtime_metadata_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            release = root / "backend/AuthorityCredentialFiles/bin/Release/net10.0"
            release.mkdir(parents=True)
            (release / "AuthorityCredentialFiles.dll").write_text("synthetic-artifact")
            (release / "AuthorityCredentialFiles.deps.json").write_text("{}")
            (release / "AuthorityCredentialFiles.runtimeconfig.json").write_text(json.dumps({
                "runtimeOptions": {"tfm": "net8.0", "framework": {"name": "Microsoft.NETCore.App", "version": "8.0.0"}}}))
            with patch.object(cli, "ROOT", root):
                with self.assertRaisesRegex(ValueError, "no older-runtime fallback"):
                    cli.windows_helper_artifact()


@unittest.skipUnless(os.name == "nt" and cli.sys.platform == "win32", "Native Windows helper IPC requires Windows")
class WindowsCredentialIPC(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="genesis-credential-ipc-")
        self.directory = Path(self.temporary.name)
        self.file = self.directory / "synthetic.json"
        self.powershell(r'''$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User
$acl=[Security.AccessControl.DirectorySecurity]::new()
$acl.SetOwner($sid)
$acl.SetAccessRuleProtection($true,$false)
foreach($identity in @($sid,[Security.Principal.SecurityIdentifier]::new('S-1-5-18'))){
 $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($identity,'FullControl','ContainerInherit,ObjectInherit','None','Allow'))
}
Set-Acl -LiteralPath $env:GENESIS_ACL_TEST_DIRECTORY -AclObject $acl''')

    def tearDown(self): self.temporary.cleanup()

    def powershell(self, script):
        result = cli.subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command",
            "$ErrorActionPreference='Stop';" + script], capture_output=True, text=True, timeout=20,
            env={**os.environ, "GENESIS_ACL_TEST_DIRECTORY": str(self.directory), "GENESIS_ACL_TEST_FILE": str(self.file)})
        self.assertEqual(result.returncode, 0, "Native synthetic-fixture ACL setup failed; no fallback.")

    def test_round_trip_separate_principals_and_no_overwrite(self):
        data = {"human": {"credential": "synthetic-human", "displayName": "Synthetic \u0393"},
                "agent": {"credential": "synthetic-agent"}}
        self.assertEqual(cli.windows_credential_operation("inspect-parent", self.file), {"validated": True})
        cli.save(self.file, data)
        self.assertEqual(cli.token(self.file, "human"), "synthetic-human")
        self.assertEqual(cli.token(self.file, "agent"), "synthetic-agent")
        with self.assertRaises(ValueError): cli.save(self.file, {})
        self.assertEqual(cli.token(self.file, "human"), "synthetic-human")

    def test_extra_file_allow_is_rejected_without_silent_repair(self):
        cli.save(self.file, {"human": {"credential": "synthetic-only"}})
        self.powershell(r'''$acl=Get-Acl -LiteralPath $env:GENESIS_ACL_TEST_FILE
$acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new([Security.Principal.SecurityIdentifier]::new('S-1-1-0'),'ReadData','Allow'))
Set-Acl -LiteralPath $env:GENESIS_ACL_TEST_FILE -AclObject $acl''')
        with self.assertRaisesRegex(ValueError, "native controls could not be verified"):
            cli.token(self.file, "human")

    def test_permissive_directory_fails_preflight_before_creation(self):
        self.powershell(r'''$acl=Get-Acl -LiteralPath $env:GENESIS_ACL_TEST_DIRECTORY
$acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new([Security.Principal.SecurityIdentifier]::new('S-1-1-0'),'ReadData','Allow'))
Set-Acl -LiteralPath $env:GENESIS_ACL_TEST_DIRECTORY -AclObject $acl''')
        with self.assertRaisesRegex(ValueError, "native controls could not be verified"):
            cli.windows_credential_operation("inspect-parent", self.file)
        self.assertFalse(self.file.exists())


if __name__ == "__main__": unittest.main()

