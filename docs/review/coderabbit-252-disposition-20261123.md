# CodeRabbit review disposition: PR #252

Recorded November 23, 2026. This is an AI review and engineering disposition,
not independent human review, certification, merge approval or production approval.

## Reviewed scope and delivery

CodeRabbit reviewed PR #252 from application base
`5821dabd4164040a50c2b9cd0a814a6421bf3da6` through evidence head
`b65e595d72860291c10d2270067a3e629f05229b`. Its published review reported nine
actionable findings: three Major and six Minor. The review concerns opt-in trial
launchers, cleanup and evidence assertions; it does not establish a new application
authorization defect or invalidate every previously recorded experiment.

The attempted local CLI installation was rejected by automatic approval review
because PostHog telemetry behavior had not been verified. Installation/verification did not complete; no CLI review was run or retried
after the rejection. Existing GitHub bot review and manual review controls
were used instead. Requests on #250 and #251 encountered the included-review limit;
the bot reported one included review per hour. Those requests are not completed
reviews. The actual nine-finding review is on #252; its status is COMMENTED, not a
human approval.

## Finding ledger

Each finding was accepted as valid against the reviewed source. Corrections are implemented and covered by the regression checks below.
This is an engineering verification, not a new CodeRabbit or human approval.
Review-thread resolution on GitHub is a separate action and is not implied.

| Finding | Severity | Affected file | Accepted correction | Disposition |
| --- | --- | --- | --- | --- |
| [Browser harness path](https://github.com/AcingTime420/Acing-IU-Genesis/pull/252#discussion_r4672596464) | Major | `scripts/Invoke-GenesisRealModelTrial.ps1` | Resolve browser harness from the evidence checkout's `frontend/tests`; retain pinned application repository and adjacent adversarial harness. | Implemented; focused regressions passed |
| [PostgreSQL cleanup ownership](https://github.com/AcingTime420/Acing-IU-Genesis/pull/252#discussion_r4672596472) | Major | `scripts/Invoke-GenesisRealModelTrial.ps1` | Exclusively claim a per-invocation cluster path; restrict fallback stop to that invocation's started cluster, including timeout cleanup. | Implemented; focused regressions passed |
| [Inherited PostgreSQL settings](https://github.com/AcingTime420/Acing-IU-Genesis/pull/252#discussion_r4672596493) | Major | `scripts/validate-real-local-inference-windows.py` | Remove inherited PostgreSQL connection settings before explicit loopback trial settings; share the sanitized environment with database creation and SQL checks. | Implemented; focused regressions passed |
| [Browser/frontend cleanup verdict](https://github.com/AcingTime420/Acing-IU-Genesis/pull/252#discussion_r4672596424) | Minor | `frontend/tests/genesis-real-inference-connected.mjs` | Attempt both cleanup operations independently; fail if closure is unconfirmed, and publish completion/pass only after successful cleanup. | Implemented; focused regressions passed |
| [Denial receipt case binding](https://github.com/AcingTime420/Acing-IU-Genesis/pull/252#discussion_r4672596433) | Minor | `scripts/genesis-real-adversarial.mjs` | Bind returned denial attempt to the current reimbursement and bind the current idempotency request key to that attempt, retaining HTTP status checks. | Implemented; focused regressions passed |
| [Exact Docker restoration set](https://github.com/AcingTime420/Acing-IU-Genesis/pull/252#discussion_r4672596482) | Minor | `scripts/Invoke-GenesisRealModelTrial.ps1` | Require full IDs and compare complete running sets plus existing saved-state checks; report unexpected IDs without stopping them. | Implemented; focused regressions passed |
| [Watchdog verdict race](https://github.com/AcingTime420/Acing-IU-Genesis/pull/252#discussion_r4672596504) | Minor | `scripts/validate-real-local-inference-windows.py` | Signal completion and join the watchdog before the final guard verdict so an in-progress trip cannot be missed. | Implemented; focused regressions passed |
| [Final memory sample/report preservation](https://github.com/AcingTime420/Acing-IU-Genesis/pull/252#discussion_r4672596520) | Minor | `scripts/validate-real-local-inference-windows.py` | Preserve collected stage/cleanup results and write the report even if the final memory measurement is unavailable. | Implemented; focused regressions passed |
| [Both memory gate dimensions](https://github.com/AcingTime420/Acing-IU-Genesis/pull/252#discussion_r4672596414) | Minor | `docs/validation/real-model-adversarial-20261123.md` | Document physical RAM and available page-file/commit gates while preserving historical measurements and model outcomes. | Corrected; thresholds checked against source |

## Evidence boundaries and remaining validation

The documentation now states the coordinator's existing model-start thresholds:
2,048 MiB free physical RAM and 4,096 MiB available page-file memory. Running
thresholds remain 768 MiB physical and 2,048 MiB available page-file memory.
This clarification does not add unrecorded commit-headroom measurements to earlier
trials or imply those trials were repeated.

The historical four-case actual-model trial, its initial memory-blocked attempt,
and Docker restoration caveats remain in the original validation report. In
particular, a replaced watcher container did not satisfy strict original-ID
restoration. Do not relabel that historical result as exact restoration because
the launcher is subsequently repaired.

The coordinating result must identify executed regression checks, failures/skips,
and whether native Windows, PostgreSQL, Docker and actual-model behavior were
rerun. Syntax checks or synthetic tests alone do not establish a repeated native
trial. Any later CodeRabbit review must name its own reviewed head; this review
does not automatically cover subsequent repairs. Independent human review remains
outstanding.

## Executed repair validation

- Linux Node v24.22.3: 121/121 tests passed across the full inference/transport
  suite (107, including 13 new denial-binding cases) and 14 browser cleanup cases.
- Linux Python: 10/10 coordinator guard tests passed, covering inherited libpq
  overrides, exclusive cluster/marker ownership, in-flight watchdog races,
  unsettled threads, and final diagnostic/report preservation.
- Owner Windows workstation: native PowerShell AST parsing and pure launcher
  fixture tests passed. Those fixtures cover evidence-checkout harness resolution,
  full-ID inventories, exact missing/unexpected sets, and refusal to adopt an old
  cluster or mismatched marker/PID/path. They never execute the launcher body.
- The same Windows run passed 10/10 Python guard tests and 27/27 focused Node tests
  (14 cleanup, 13 denial binding). No real browser, database, model, Docker restart,
  or unrelated process termination was invoked by these fixture regressions.
- Syntax/whitespace checks and CI YAML parsing passed. CI now runs the new cleanup,
  Python and native PowerShell checks; hosted results for the repair head are a
  separate gate and must be observed after publication.

The launcher generates a fresh 32-hex invocation token. The coordinator exclusively
creates that token's cluster directory and writes a start-request marker before
pg_ctl can start a server. Fallback cleanup requires the exact marker token,
cluster path and coordinator PID. A missing marker or failed preflight cannot
select a prior run's cluster. Unexpected Docker containers are reported without
being stopped.

The new adversarial harness depends on sibling `scripts/adversarial-denial.mjs`;
run it from the evidence checkout or include that sibling when deploying a copy.
Historical single-file copied harnesses are not silently upgraded. The browser
harness keeps its cleanup helper in the same import-safe module.

No full actual-model or connected-browser experiment was repeated for these
repairs. Earlier experiments remain tied to their recorded harness revisions;
the stricter denial-key and cleanup assertions are verified by the new regressions,
not retrospectively claimed as executed in the old experiments. PostgreSQL/Docker
service lifecycle behavior of the repaired launcher still needs a controlled
native integration rerun. CodeRabbit follow-up review and independent human review
remain outstanding; the original nine review threads are not automatically closed.
