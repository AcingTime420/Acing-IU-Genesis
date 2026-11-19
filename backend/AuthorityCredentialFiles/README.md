# Native Windows credential-file candidate

**Implemented for review; native Windows and CLI IPC checks have executed.**
The CLI now routes Windows credential operations through this helper with exact
Release/net10.0 artifact checks and captured, bounded subprocess I/O. Missing,
stale or failing helpers do not fall back to mode bits or another build. See
`../../docs/evidence/windows-credential-native-validation-20261118.md` for current
results and remaining gates. Prototype validation is not pilot/release approval.

The .NET 10 helper provides `create`, `read`, `inspect` and `inspect-parent` operations. `create`
accepts bounded JSON on stdin; `read` returns credential JSON on stdout over
the captured CLI IPC adapter. Never run `read` interactively, pipe it into logs, or
send its output to browser code. Error diagnostics are generic and do not echo
input, paths, SIDs or native exception messages. This helper does not issue grants,
perform authorized business actions or confer execution authority.

The implementation:

- Use native Windows ACL APIs through .NET access-control classes and handle-based
  GetSecurityInfo, rather than Unix mode bits or parsed icacls output.
- Create with a protected descriptor supplied to the native create operation;
  refuse overwrite, rather than write publicly then repair permissions.
- Require current-user ownership, a protected nonempty DACL, and only explicit
  current-user/SYSTEM allow ACEs. Unknown, inherited, conditional, object, deny,
  or additional-trustee ACEs are rejected, not interpreted permissively.
- Require a private protected parent directory; hold all ancestor handles without
  share-delete and rejects reparse points before creating/opening the final file.
- Validate file shape and ACL using the same opened file handle used for reading;
  reject hard links, directories, UNC/device/ADS/relative paths, repository paths
  with `.git` ancestry, and non-fixed/non-ACL-persistent volumes.
- Bound file size to 1 MiB, decode strict UTF-8 and validate JSON. File I/O failures
  leave a private partial file; a subsequent create must use a new path.

This intentionally excludes default inherited Windows file ACLs, shared folders,
administrator trustee entries, redirected profiles containing reparse points and
network filesystems. It is not protection from a compromised current user,
SYSTEM, a privileged administrator taking ownership, memory inspection, backup
operators, or operating-system compromise. ACLs are not encryption or recovery.

## Native validation gate

On a real Windows machine, in a new isolated checkout containing these commits:

```powershell
foreach ($configuration in @('Debug','Release')) {
    dotnet test tests/AuthorityCredentialFiles.Tests/AuthorityCredentialFiles.Tests.csproj --configuration $configuration --filter 'FullyQualifiedName~NativeWindowsTests' --logger trx
    if ($LASTEXITCODE -ne 0) { throw 'Native credential validation failed.' }
}
```

All **12 native cases** must execute and pass in each configuration. Validate TRX
counters: total 12, passed 12, failed 0, notExecuted 0. The prepared CI step enforces
these counts. No workflow was dispatched or pushed. The tests use their own private
synthetic temporary directories; junction/hard-link fixture failures are failures,
not silently skipped checks. Review the native API contracts and test adequacy,
including foreign-owner/unsupported-filesystem/race scenarios on the supported
Windows versions. Those additional scenarios are not claimed covered by these
12 cases. Native runs use synthetic temporary directories and an isolated worktree; the
owner's existing worktree files remain preserved.

On Linux, 12 native tests are explicitly skipped and one executable platform-
refusal case passes. This is not a passing native ACL gate. Python guards also exercise native-helper IPC on Windows and POSIX controls on
Unix; platform-specific skips must be identified rather than claimed as coverage.

The CLI adapter sends JSON only over captured stdin/stdout, uses UTF-8, bounds
payload/output to 1 MiB and subprocess time to 20 seconds, and sets LatestPatch
roll-forward. It performs native parent preflight before fixture principals are
inserted. Human/agent values remain distinct. Child diagnostics are never echoed
on failure. Explicit file creation still refuses overwrite.

Windows short-name aliases (including Python TEMP paths) are expanded to the same
absolute drive path, then subjected to the same handle, ACL and reparse checks.
Relative paths, slash variants, UNC/device paths, ADS, dot segments and unsafe
normalization remain rejected. Existing files/ACLs are never silently repaired.

For a NEW private directory, use native descriptor-at-creation rather than trying
to rewrite inherited/default ACLs after creation. PowerShell 5.1 example, with
`$newDirectory` set to a new path outside all repositories:

```powershell
if (Test-Path -LiteralPath $newDirectory) { throw 'Choose a new directory; preserve existing data.' }
$owner = [Security.Principal.WindowsIdentity]::GetCurrent().User
$security = [Security.AccessControl.DirectorySecurity]::new()
$security.SetOwner($owner)
$security.SetAccessRuleProtection($true, $false)
foreach ($identity in @($owner, [Security.Principal.SecurityIdentifier]::new('S-1-5-18'))) {
    $security.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new(
        $identity, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow'))
}
[IO.DirectoryInfo]::new($newDirectory).Create($security)
```

Build the exact Release helper before CLI use:

```powershell
dotnet build backend/AuthorityCredentialFiles/AuthorityCredentialFiles.csproj --configuration Release
python -B -m unittest discover -s tests -p test_authority_credentials.py -v
```

Use a supported .NET 10 patch. An isolated SDK does not update the machine-wide
installation; repeat validation with the intended deployment runtime. Do not run
credential `read` on an interactive console. Never remove policy checks to make a
shared, inherited or redirected directory pass. Full workflow evidence and
limitations are recorded in the linked current report.
