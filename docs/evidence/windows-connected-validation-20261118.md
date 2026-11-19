# Windows connected authority validation

Date: November 18, 2026 (America/Los_Angeles).
Status: local connected validation passed; independent review and release gates remain.

## Exact source and isolation

Official remote HEAD was verified as `master`, SHA
`4cf3181951ddc3366a193d49cb8ca32dce346bf7`.
The isolated Windows checkout was at
`5121308ba077b4d69b5b3eece76bd17441393ebe`, with only the connected harness
modified for the successful run. Its tested Git blob is
`34ae285132a6b07a266f733fd240d7e223542c1d`.
The corresponding local branch already includes documentation/CI commit
`460adec2ee449d6d03c0458535dd6cf8727e5b63`; that commit changes no application code.

Windows checkout: `D:\Acing-IU\Genesis-ACL-Validation-20261118\checkout`.
Logs: sibling `logs` directory, filenames prefixed `continued-`.
Private synthetic fixtures and the existing disposable PostgreSQL 17 cluster
remain outside Git. No owner database was reset or reused. Preflight required
zero grants in the disposable database; no reset was performed in this run.
Application ports were 55889/55890; PostgreSQL used loopback port 55445.
The existing owner listener on 5088, PID 24284, remained running throughout.

## Focused repairs

The connected harness previously exhausted 100 quick connection-refused retries
in approximately ten seconds during a cold Windows service start. It now uses a
monotonic 60-second readiness deadline and retains child-liveness checks, finite
per-fetch timeouts and isolated-port checks. A subsequent cold first API request
exceeded its ten-second client bound; the harness request bound is now 30 seconds.
No authorization rules, assertions, grant lifetime, application timeout or schema
were changed. These bounds accommodate local initialization; they establish no
production latency target.

Direct PowerShell invocation of `pg_ctl start` waited on inherited server handles
after the disposable server reported ready. The external launcher was corrected
to use `Start-Process` with redirected output and bounded control-process waits.
The reproduction recipe records the same approach. The first launcher was stopped
and only its known disposable cluster was shut down before retrying. Earlier
readiness/request failure logs were preserved separately, not overwritten as passes.

## Observed validation

| Check on Windows | Result |
|---|---|
| Next lint regression cases | 10/10 passed |
| Genesis adapter cases | 9/9 passed |
| Genesis session cases | 3/3 passed |
| ESLint | Exit 0; zero errors, 19 existing warnings |
| Next.js 16.4.6 production build | Exit 0 |
| TypeScript, no emit and no incremental cache | Exit 0 |
| Live HTTP boundary with synthetic upstream | 3/3 passed; exit 0 |
| npm audit, full installed project | Exit 0; zero reported vulnerabilities across all severities |
| Playwright 1.65.0 and Chromium headless shell install | Exit 0 after bounded registry retry |
| Chromium + real authority service + real PostgreSQL | Exit 0; all existing assertions passed |
| Disposable PostgreSQL shutdown | Exit 0; isolated application/database listeners absent afterward |

The earlier npm retry log reported 448 packages installed. This run reused that
completed installation; it did not repeat `npm ci`. Registry ping succeeded;
Playwright's first install hit EIDLETIMEOUT, and a single-connection retry succeeded.
The full audit is a point-in-time dependency finding, not a security certification.

The connected scenario verified an exact human-approved append, identical result
on idempotent retry, stale approval rejection with refresh and disabled approval,
explicit rejection, grant revocation followed by denied execution, unchanged
post-denial content/version, and evidence/SQL assertions for one consumed grant
and two total grants. The frontend HTTP cases additionally covered CSRF rejection,
agent-session denial, canonical UUID binding, logout and stale shared-cookie tabs.

The actual connected service host trace selected Microsoft.NETCore.App 10.0.15 and
Microsoft.AspNetCore.App 10.0.15. Node was 26.13.0. Earlier native ACL and 92-case
Debug/Release authority runs are described in
[the native evidence](windows-credential-native-validation-20261118.md); those suites
were not rerun because this continuation changed the harness and recipe only.

## Remaining limits and next gate

This closes the previously blocked local Windows connected-browser gate for the
identified prototype source. It does not establish production readiness, device
execution, hardware attestation, Windows fleet coverage or hosted CI success.
No push, merge, deployment, workflow dispatch or external message was performed.
The next engineering gate is independent review of the exact integrated candidate,
with hosted CI on that candidate and disposition of the remaining operational,
identity recovery, privacy and ownership prerequisites before an external pilot.

Raw host traces, credentials and full local logs remain private. The disposable
cluster and synthetic evidence were preserved after shutdown.
