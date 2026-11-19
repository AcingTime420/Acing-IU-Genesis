# Native Windows credential and authority validation

Research/session date: November 18, 2026 (America/Los_Angeles).
Status: implemented; native enforcement and authority regression checks validated.
Full Windows connected browser validation remains a separate gate. No publication,
workflow dispatch, merge, deployment, pilot approval or independent human review.

## Source and isolation

Stabilization base: `8655a692b9f43d787f3dc3f82ddff2ab57b97407`.
Initial native candidate: `bf73c386766de2a578cb4197856e58ee5f300e12`.
Native/IPC tested implementation: `dd8ab4922fc88c2b6f557d3707db0c0f5a3f9434`.
Controlled startup exit and authority regression implementation:
`5d5c67edd87ed2f7973580d99394770527aeaf1d`.
Connected harness implementation: `5121308ba077b4d69b5b3eece76bd17441393ebe`,
tree `1825d6eaeed8c80813dcab7deab41cd4b351261a`.
Later documentation/CI-only revisions are listed in the delivery manifest.

The isolated Windows checkout is under
`D:\Acing-IU\Genesis-ACL-Validation-20261118\checkout`.
The owner's dirty main worktree was inspected, preserved and not edited.
An existing owner service on port 5088 was left untouched. New harness Windows
ports default to 55889/55890, with preflight occupancy rejection. Disposable
PostgreSQL 17.11 used literal loopback port 55445 and synthetic fixtures only.
The existing PostgreSQL service was not used. Credentials and raw traces remain
outside Git; no credential values appear in this report or review package.

## What changed

- Native protected file creation/read now backs the Windows Python CLI through
  captured bounded UTF-8 IPC. Exact Release/net10.0 artifacts are required.
  Missing or failing helpers fail closed, without another build/runtime fallback.
- Parent ACL preflight precedes fixture principal inserts. Files are created with
  their private descriptor, never written publicly and repaired afterward.
- Native policy remains current-owner plus SYSTEM only, protected explicit DACL,
  private parent, checked open handles, fixed ACL-capable volumes, no hard links,
  junction/reparse traversal, UNC/device/ADS/repository paths, or overwrite.
- Safe Windows short-name aliases from TEMP expand before the same handle checks.
- Rejected authority listener/Production configuration exits 78 cleanly before
  listening instead of throwing an unhandled exception. The 10-second process
  rejection test timeout was retained. No authorization/schema changes.
- Connected harness uses explicit isolated ports, rejects invalid/equal/occupied
  ports before launching, and checks child liveness during readiness.

The JSON exception assertion was corrected to accept the derived parser exception
while preserving rejection/no-file assertions. Synthetic Windows temporary folder
setup was corrected to create strict native ACLs: Python 3.13+ mode 0700 includes
Administrators, which this deliberately stricter policy rejects. No policy was
weakened and no existing owner ACL was rewritten.

## Observed validation

Isolated SDK 10.0.404; selected Microsoft.NETCore.App/ASP.NET Core 10.0.15.
Windows PowerShell 5.1, Node 26.13.0, npm 11.20.0, Python 3.15.1,
PostgreSQL 17.11. SDK archive SHA-512 was checked before extraction.
Host traces were collected for actual test processes; SDK installation alone is
not runtime evidence. Linux used SDK 10.0.404/runtime 10.0.15 and disposable
PostgreSQL 16.15. Exact commands below omit only external private output paths.

| Executed check | Exit | Result |
|---|---:|---|
| Windows `dotnet test tests/AuthorityCredentialFiles.Tests/AuthorityCredentialFiles.Tests.csproj --configuration Debug --filter FullyQualifiedName~NativeWindowsTests --logger trx` | 0 | 12 executed, 12 passed, zero skipped/failed |
| Same native test command, Release | 0 | 12 executed, 12 passed, zero skipped/failed |
| Windows `python -B -m unittest discover -s tests -p test_authority_credentials.py -v` | 0 | 8 total; 6 pass, 2 POSIX skips; includes real helper IPC |
| Linux same Python suite | 0 | 8 total; 5 pass, 3 Windows skips |
| Windows `dotnet test tests/HumanAuthority.IntegrationTests/HumanAuthority.IntegrationTests.csproj --configuration Debug --logger trx -m:1 -p:UseSharedCompilation=false` | 0 | 92/92, zero skips/failures; real disposable PostgreSQL |
| Same authority command, Release | 0 | 92/92, zero skips/failures |
| Linux authority Debug and Release | 0 each | 92/92 each against real disposable PostgreSQL |
| Windows CLI reset (explicit disposable database confirmation), migrate and fixtures | 0 each | Synthetic fixtures created using native helper |
| Actual connected harness negative port probes on Linux | 0 | Invalid/occupied ports rejected; zero connections to owned dummy listener |
| Windows clean frontend `npm ci --no-audit --no-fund` | nonzero | Registry EIDLETIMEOUT; partial install is not build evidence |

Native TRX counter checks reject skipped native tests. The initial Windows
unfiltered authority attempt passed 91/92 with one process-exit timeout; the
controlled startup fix was then followed by full 92/92 Debug and Release reruns
on both platforms. Historical 81-case counts belong to an earlier source revision;
current 92 include subsequent listener/security cases. No test was removed to
restore the count.

## Limitations and remaining gates

A bounded npm retry uses cached packages, maxsockets=2, no fetch retries, a
30-second fetch timeout and a five-minute process bound. Its disposition is in
the final review manifest. Without successful clean install, no Windows production
frontend build, browser/service/database run or fresh npm audit is claimed.
Historical Linux connected results are not substituted for this Windows gate.
Hosted CI/dependency submission has not run on these local commits.

The native 12-case suite does not establish every foreign-owner, unsupported
filesystem, supported-Windows-version or adversarial race scenario. No Windows
browser run, hardware attestation, device executor, production identity, or
repository-wide runtime migration is implied. Current-user/SYSTEM compromise and
privileged ownership takeover are outside ACL isolation. ACLs are not encryption.

Before external testing: exact-candidate independent human review, successful
platform connected run, current dependency findings disposition, contributor/IP
and privacy/retention decisions, and operational recovery review remain required.

## Disable and rollback

Stop only this candidate's frontend/authority processes and unset
GENESIS_LOCAL_LIVE. Preserve database directory, private credentials, logs and
recorded evidence; never reset/delete the database as rollback. Revert the native
CLI integration only together with its explicit Windows refusal, not to a Windows
Unix-mode guard. Preserve the supported runtime. The disposable database was
stopped after the failed frontend install. Existing owner services remain intact.

Native API references:
- https://learn.microsoft.com/en-us/dotnet/api/system.io.path.getfullpath?view=net-10.0
- https://docs.python.org/3/library/os.html#os.mkdir
