# Windows credential ACL candidate — evidence and blocked native gate

Date: November 18, 2026, America/Los_Angeles.
**Verdict: Implemented with native Windows validation and CLI integration blocked.**
No push, PR change, merge, workflow dispatch, deployment or pilot approval.

## Baseline and access

New isolated branch `codex/windows-credential-acl`, worktree
`/workspace/scratch/793af41f1407/genesis-windows-acl`.
Base `8655a692b9f43d787f3dc3f82ddff2ab57b97407`, tree
`ab59d72d0370e45f9047ce37f92ef2e976cec170`, was verified clean and preserved.
The owner Windows worktree was not accessed or changed. Desktop Commander device
inventory reports the configured Windows machine **Offline**. Current execution
host is Linux; no native Windows runtime or PowerShell is available. No hosted
Windows runner was triggered because publication/dispatch is not authorized.

Candidate source/test commit `cb76412a820ae45e7abfef198a6968de27e92c81`, tree
`ad57de923e47d0016780d5010f27dcaf931becb2`, contains the tested implementation.
The following commit adds documentation and prepared CI/security wiring only.
The final manifest records exact final head/tree and ordered portable patches.

## Implementation and remaining integration

A separate .NET 10 helper implements protected file creation and handle-based
ownership/DACL validation. Existing CLI code is unchanged, including its explicit
Windows refusal. No feature flag, environment bypass, blanket ACL repair or new
execution authority was added. This is a security primitive candidate, not an
operational Windows credential workflow.

Core details and exact native test command are in
`backend/AuthorityCredentialFiles/README.md`. Candidate policy trusts current user
and SYSTEM only, requires protected explicit ACLs and private parent directory,
validates actual file handles, retains ancestor handles against replacement, and
rejects reparse points, hard links, alternate streams, repository paths and
unsupported volumes. Existing files/ACLs are never silently repaired. File size,
UTF-8 and JSON are bounded/validated; failure diagnostics do not expose values.

Prepared Windows CI runs all 12 native cases in each configuration and checks TRX
counts to reject skips. Prepared explicit NuGet audit includes this helper/test
graph. YAML parsing is not proof either hosted job ran.

The helper's `read` response contains credentials by design for future private
captured IPC. It must not be used interactively or logged. A bounded Python adapter,
exact artifact/runtime validation, protected directory setup and both-principal
integration tests are still required before removing the CLI refusal. No claim
that this milestone is complete or the product's Windows workflow restored.

## Observed checks

SDK 10.0.404, Microsoft.NETCore.App 10.0.15, Linux x64. The project has no direct
third-party dependencies. Test SDK/xUnit versions follow the existing authority
suite. The known nonfatal Test SDK artifacts-directory warning remains.

| Check | Exit | Observed outcome |
|---|---:|---|
| `dotnet build backend/AuthorityCredentialFiles/AuthorityCredentialFiles.csproj --configuration Release` | 0 | Compiles; zero warnings/errors |
| `dotnet test tests/AuthorityCredentialFiles.Tests/AuthorityCredentialFiles.Tests.csproj --configuration Debug --no-restore --logger trx --results-directory <external-results>` | 0 | **1 portable refusal pass, 12 native skips**, 0 failures |
| Same test command with Release | 0 | **1 portable refusal pass, 12 native skips**, 0 failures |
| `dotnet restore tests/AuthorityCredentialFiles.Tests/AuthorityCredentialFiles.Tests.csproj --force-evaluate -p:NuGetAudit=true -p:NuGetAuditMode=all -p:NuGetAuditLevel=low '-p:WarningsAsErrors=NU1900%3BNU1901%3BNU1902%3BNU1903%3BNU1904%3BNU1905'` | 0 | Strict direct/transitive audit, feed warnings included |
| `PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s tests -p test_authority_credentials.py` | 0 | Existing 3 cases pass; Windows CLI refusal preserved |
| Claim-surface / whitespace checks | 0 | Passed |
| CI/security YAML parse | 0 | Prepared jobs parse; not executed remotely |

Debug/Release builds include the candidate. A nullable-owner warning introduced
during review was corrected by explicitly rejecting absent owners; final builds
pass with warnings as errors. This is compilation evidence only. No existing
backend/database behavior was changed, so its broad PostgreSQL suites were not
rerun; prior 92/92 authority and 17/17 DeviceTrust results remain historical.
No real credentials or personal documents were used, and no raw credential files
or host traces are packaged. Diff secret scanning and final tree are recorded in
the delivery manifest.

Native cases prepared: protected creation/read/current ownership; exclusive
no-overwrite; Everyone and Administrators allow-ACE rejection; inherited ACL and
null DACL rejection; permissive parent; invalid path classes; hard links;
junction redirection; concurrent creation; bounded/valid JSON. Foreign-owner
rejection beyond current-owner success, unsupported-volume behavior and adversarial
race coverage still require additional native test/review work; do not infer them
proven from code inspection. No administrator/SYSTEM threat protection is promised.

## Official API sources inspected

- https://learn.microsoft.com/en-us/dotnet/api/system.io.filesystemaclextensions.create?view=net-10.0
- https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew
- https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getsecurityinfo
- https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getvolumeinformationbyhandlew
- https://learn.microsoft.com/en-us/windows/win32/secauthz/security-descriptor-string-format

The APIs support creating with a supplied descriptor and inspecting security via
an opened handle. The volume must enforce persistent ACLs. These sources inform
the design; they do not validate our implementation on an unavailable OS.

## Rollback and next action

The CLI remains disabled on Windows, so no credential migration or ACL rollback is
needed. To discard this candidate, revert its two local commits in an isolated
branch; do not delete existing evidence, change credential ACLs, or restore an
unsafe mode-bit-only Windows path. Keep prior Linux stabilization work intact.

**Next action:** bring the configured Desktop Commander Windows machine online.
Then use a new isolated checkout to run the native test gate, inspect failures and
complete the captured-IPC adapter before the connected Windows workflow. Native
execution remains blocked until that infrastructure is available.
