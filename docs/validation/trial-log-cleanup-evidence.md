# Trial log cleanup and report preservation

## Scope

Focused follow-up to PR #252, based on
`7e7cfcf39f9f1d4ac8a123501d6a7970a806923e`.
The Windows trial coordinator previously closed process logs sequentially without
handling close errors. A buffered flush or close failure could skip remaining
handles and prevent `real-model-result.json` from being written after service
cleanup. The command would fail, but its collected evidence could be lost.

`finalize_report` now attempts every handle close independently, sets
`cleanupFailed` and `logCloseFailed` when needed, forces the overall verdict to
false, and writes the existing stage and observation evidence. Arbitrary exception
text is not copied into the public report. Existing successful and failed trial
verdicts remain unchanged when log cleanup succeeds.

## Verification actually executed

The unchanged finalization sequence was extracted before the correction. Two
fault-injection regressions then reproduced uncaught `OSError` failures, confirming
that close failures prevented report preservation. After the correction:

| Check | Linux | Owner Windows |
| --- | --- | --- |
| `python -B -m unittest discover -s tests -p test_real_model_trial_guards.py -v` | 13 passed | 13 passed |
| All four `backend/LocalInference/tests/*.test.mjs` files plus `frontend/tests/genesis-real-inference-cleanup.test.mjs` | 121 passed, no skips | 121 passed, no skips |
| `git diff --check` | Passed | Passed |
| `bash scripts/check-claim-surface.sh` | Passed | Not rerun |

New coverage verifies that multiple close failures do not skip later handles,
successful real file closure flushes its contents, successful and failed trial
verdicts remain unchanged, and simultaneous log/diagnostic failures retain an
existing failure stage. The observation-level success record is preserved while
the overall trial correctly fails on cleanup errors.

## Review and limitations

The implementation was inspected against the coordinator's `finally` block,
exit-code calculation, existing report writer and launcher exit-code consumer.
This was self-review, not independent review. No separate agents participated.
Independent review remains pending.

Windows checks used a separate detached checkout of the published base. Existing
owner checkouts and newer local lifecycle/snapshot work were left untouched. These
tests did not start a browser, model, PostgreSQL cluster or Docker lifecycle.
They do not establish a repeated full native trial or production readiness.

The report destination must still be writable; an actual report-write failure
continues to fail the command rather than claiming evidence was persisted. Process
termination behavior, authorization policy, model inference and Docker restoration
are unchanged by this patch.

Next: independently review the focused diff, reconcile it with the newer native
lifecycle/snapshot candidate, then validate that integrated revision. Do not merge
or infer production acceptance from these focused tests.
