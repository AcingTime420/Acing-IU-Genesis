# Stabilization, README and Python import reconciliation

Prepared November 23, 2026 (America/Los_Angeles).

## Objective and inspected state

Complete one bounded stabilization cycle, reconcile the public README against
actual source/evidence, and investigate the supplied `acing_iu` import diagnosis.
Repository: `AcingTime420/Acing-IU-Genesis`.

- Inspected base: `4596238f6b72b63289a609c28ca082dfc0f8fff6`, branch
  `fix/trial-log-cleanup-evidence`; working tree was clean before this task.
- New review branch: `fix/stabilization-readme-reconciliation`.
- Remote `git ls-remote --symref origin HEAD` confirmed `master` at
  `4cf3181951ddc3366a193d49cb8ca32dce346bf7`.
- Execution environment: Linux, Python 3.12.14, Node v24.22.3, Bash and GNU Make.
  Native Windows, .NET SDK, Docker and Kotlin compiler were unavailable.

Scope: README and inference documentation, build-entrypoint failure handling,
regression coverage and CI invocation. Preserve authority policy, user changes,
existing history and private data. No merge, push, deployment, migration, purchase,
model download, Docker interruption or external communication is included.

Acceptance: build failures must return nonzero; success must require all expected
artifacts; invoking the script outside the checkout must resolve its source root;
documentation must distinguish candidate evidence from master and simulation;
Python repairs must be grounded in an identified failing source/workflow.

## Implemented changes

`build.sh` previously continued after a missing build directory, failing Make,
and failing copies, then printed success and exited 0. Its unquoted ANSI color
assignment also executed `34m` as a shell command. The failure was reproduced in
the real checkout and in four isolated regression cases before the correction.

The script now resolves its own directory, fails on missing prerequisites and
Make errors, verifies the complete expected artifact set before staging, and
propagates copy failures. It reports Guardian artifact staging only. No system
image or restored Guardian build implementation is claimed. The missing Makefile
remains a blocker, and the actual checkout now correctly returns exit 1.

`tests/test_build_entrypoint.py` runs real Bash and Make in disposable directories.
It covers absent build source, Make failure, missing generated artifacts and
successful synthetic staging from a different working directory with spaces in
the checkout path. Synthetic files are not evidence of Guardian compilation.

The Linux authority CI matrix now discovers all `test_*.py` files, adding the
coordinator and build regressions to its existing credential guard coverage.
Windows-specific jobs remain unchanged. CI configuration was edited locally;
remote CI has not executed this new revision.

`README.md` now centers human authority, uses the current classification terms,
links bounded evidence, identifies canonical source and toolchains, documents
available test commands, and explains the different legacy validators' behavior.
`backend/LocalInference/README.md` now points to later installed-model evidence
without presenting historical runs as fresh validation of the current branch.

## PR reconciliation from direct access

| Candidate | Inspected remote head | Disposition |
|---|---|---|
| [#180](https://github.com/AcingTime420/Acing-IU-Genesis/pull/180) | `f27b6fde0f47a680231a2d97165c2cb9b63f1800` | Use its human-authority framing as the editorial base; update obsolete prototype/runtime/test claims for this newer candidate. Do not merge the whole PR automatically. |
| [#105](https://github.com/AcingTime420/Acing-IU-Genesis/pull/105) | `2a8823729d80f5b840a24f691a8826219e4711f6` | Retain useful source-layout and validator-scope explanations. Its foundation-platform framing does not define the product purpose. Do not merge as-is. |

Direct PR file lists corrected an earlier report: #105 currently changes
`security.yml`, `ARCHITECTURE.md`, `README.md`, notification documentation and the
frontend lockfile; it does **not** currently list a Dockerfile. Its security diff
adds `--omit=dev` to the audit, narrowing coverage despite its documentation-only
scope statement. That security change was not adopted. #180 also contains a
lockfile change and a `gradlew` file-mode change in addition to documentation/UI
copy. This task adopted neither candidate's lockfile, workflow-audit nor Gradle
changes. The two premerge scripts were read directly; their differences are now
documented, not silently treated as equivalent validation.

## Python import investigation — BLOCKED

The supplied attachment states that six pytest files fail to import `acing_iu`,
but provides no run URL, traceback, failing filenames, repository ref or workflow
path. The inspected candidate has no `acing_iu` package, no six matching Python
test files, no Python packaging manifest and no Conda/pytest workflow. Existing
Python tests load specific CLI/coordinator files with `importlib` and run under
standard-library `unittest`. Occurrences of `acing_iu` in current workflow files
are PostgreSQL database names, not Python imports.

Consequently `pip install -e .` is not a supported fix here. Creating an empty
package would hide the missing source rather than restore functionality. No fake
package, import-path override, dependency installation or test suppression was
introduced. Current Python tests import and run successfully using the documented
command. The historical six-file failure remains BLOCKED pending the actual
failing run/source; a request for that identifier was sent during this task.

## Verification actually executed

| Command/check | Result |
|---|---|
| New four build regressions before repair | FAIL: all four reproduced false success or wrong-root staging |
| `python3 -B -m unittest discover -s tests -p 'test_*.py' -v` after repair | PASS: 22 passed, 3 native-Windows IPC skips, 25 discovered |
| `node --test backend/LocalInference/tests/*.test.mjs frontend/tests/genesis-real-inference-cleanup.test.mjs` | PASS: 121, zero skips |
| `node --experimental-strip-types --test frontend/tests/genesis-adapter.test.mjs frontend/tests/genesis-session.test.mjs frontend/tests/genesis-reimbursement-session.test.mjs` | PASS: 14, zero skips |
| `bash -n build.sh scripts/validate-premerge.sh` | PASS |
| `bash scripts/check-claim-surface.sh` | PASS; static surface check only |
| `git diff --check` | PASS |
| Actual `bash build.sh` after repair | BLOCKED: missing Guardian Makefile, correctly exits 1 |
| `npm ci --no-audit --no-fund --fetch-retries=0 --fetch-timeout=15000` in `frontend/` | PASS: lockfile-backed installation; vulnerability audit was not run |
| `npm run lint` in `frontend/` | PASS: exit 0, zero errors, 19 existing unused-variable warnings |
| `npm run build` in `frontend/` | PASS: Next.js 16.4.6 production build |
| `npx --no-install tsc --noEmit` in `frontend/` | PASS |
| `node --experimental-strip-types --test tests/*.test.mjs` in `frontend/` | PASS: 44, zero skips; includes synthetic-upstream HTTP tests |
| .NET builds, PostgreSQL integration, native Windows ACL/launcher and installed-model trials | BLOCKED: required SDK/services/platform absent; not executed |

README and updated inference-guide relative links were checked against this
checkout, with no missing targets. The test groups overlap (cleanup and session
tests appear in multiple invocations); do not add their counts as unique coverage.
The frontend HTTP tests start real local Next servers against synthetic upstreams;
they do not validate database enforcement. No skipped or unavailable check closes
a required gate. npm emitted an inherited `http-proxy` configuration deprecation
warning; it did not fail installation, build or type checking.

## Review and next actions

Self-review only; no separate reviewers or agents participated. Existing review
packets and Windows records were read as historical evidence, not independently
reproduced. Production and independent-human-review gates remain BLOCKED.

1. Supply the failing Python Actions run/source to resolve the six-file import error.
2. Execute backend builds and native Windows validation on the
   exact reviewed candidate; reconcile newer owner-only lifecycle work before
   claiming an integrated native trial.
3. Independently review this focused change and the stacked application boundary.
4. Restore Guardian build sources only as a separate evidenced task; never replace
   them with successful placeholders. Owner approval remains required for merging
   or deployment.
