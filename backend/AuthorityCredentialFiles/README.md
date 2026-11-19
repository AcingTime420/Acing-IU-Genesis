# Native Windows credential-file candidate

**Implemented for review; native Windows validation is blocked. Not connected to
the Genesis CLI.** The CLI's Windows fail-closed guard remains unchanged. There is
no flag or environment override to enable it. Do not use real credentials with
this candidate or treat successful Linux compilation as Windows ACL evidence.

The .NET 10 helper provides `create`, `read` and `inspect` operations. `create`
accepts bounded JSON on stdin; `read` returns credential JSON on stdout for a
future captured IPC adapter. Never run `read` interactively, pipe it into logs, or
send its output to browser code. Error diagnostics are generic and do not echo
input, paths, SIDs or native exception messages. This helper does not issue grants,
perform authorized business actions or confer execution authority.

The candidate is designed to:

- Use native Windows ACL APIs through .NET access-control classes and handle-based
  GetSecurityInfo, rather than Unix mode bits or parsed icacls output.
- Create with a protected descriptor supplied to the native create operation;
  refuse overwrite, rather than write publicly then repair permissions.
- Require current-user ownership, a protected nonempty DACL, and only explicit
  current-user/SYSTEM allow ACEs. Unknown, inherited, conditional, object, deny,
  or additional-trustee ACEs are rejected, not interpreted permissively.
- Require a private protected parent directory; hold all ancestor handles without
  share-delete and reject reparse points before creating/opening the final file.
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
12 cases. The offline owner workstation has not been touched.

On Linux, 12 native tests are explicitly skipped and one executable platform-
refusal case passes. This is not a passing native ACL gate. Existing Python
credential guards should continue to pass and continue to reject Windows use.

After native validation, a separate integration change must route the existing
Python save/read operations through this helper with captured IPC, explicit
supported Release artifact/runtime checks, OS-native credential-directory setup,
and bounded subprocess timeouts. Revalidate both human and agent flows, absence
of secret logging, and the full connected Windows browser/service/database path.
Do not enable the CLI from a test result alone without implementing and reviewing
that adapter. This candidate intentionally does not modify existing credential
files or their ACLs.
