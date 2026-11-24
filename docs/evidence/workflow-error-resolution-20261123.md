# Verified workflow-error resolution

Recorded November 23, 2026 (America/Los_Angeles).
Base: `824d6bc4f1b931fae8023d032c09eaca23e26e8e` on
`fix/stabilization-readme-reconciliation`. Initial working tree was clean.

## Objective and scope

Assess the reported Python failure and verified current workflow failures,
implement only evidence-supported corrections, and verify the results. Preserve
human-authority architecture, owner changes, audit thresholds and repository
policy. No merge, deployment, remote workflow dispatch, live credential test,
credential rotation or change to repository settings is included.

## Python: reported historical import failure remains unverified

The earlier read-only investigation found no `acing_iu` package, packaging
manifest, matching import or pytest/Conda workflow across 873 reachable commits,
155 branches, two tags and 344 pull-request refs in the canonical mirror. The
attachment cannot be tied to an exact failing revision. No replacement package
or invented tests were added.

This runtime initially lacked pytest itself (`No module named pytest`). A
disposable Python environment outside the repository was created with pytest
8.4.2. The original candidate's actual tests then ran successfully: 22 passed,
three native-Windows-only skips. After the scanner regressions below were added,
the complete `tests/` collection passed 24 tests with the same three skips.
There was no `acing_iu` import failure. This verifies the current candidate,
not the unidentified historical six-file report.

## Gradle: network configuration corrected for this process

The verified remote failure was
[run 45313662923](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/45313662923),
commit `853505cf7c48445b297a5978e7ff996d8c584ffc`. Its `validate-project` step
could not resolve Foojay resolver 1.0.0. The version exists in the official
[Gradle plugin portal](https://plugins.gradle.org/plugin/org.gradle.toolchains.foojay-resolver-convention/1.0.0).
The wrapper was already executable, pinned to Gradle 9.3.1 with a distribution
checksum, and Java 21 was available here. No version downgrade was justified.

A fresh local invocation failed earlier with `Network is unreachable` while
downloading Gradle. The existing authorized HTTPS proxy was passed to Java as
process-local HTTP/HTTPS system properties. No proxy address or credential was
written into the repository or global configuration. The wrapper downloaded and
verified its distribution, resolved/loaded Foojay 1.0.0 and completed:

```text
> Task :help
BUILD SUCCESSFUL in 2m 3s
1 actionable task: 1 executed
```

The command used `help --no-daemon --console=plain --max-workers=2` with a 1 GiB
daemon heap. This proves project configuration under the corrected local network
environment. It does not prove Android compilation, APK output, a dependency
snapshot upload, or that the remote runner's network failure has been repaired.
Gradle source and global proxy settings were not changed.

## Secret scan: exact historical exceptions and retained detection

The current full-history security run on master,
[45238997606](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/45238997606),
reported 907 findings. The existing sanitized triage had already grouped those
into 46 records: 39 operation-idempotency identifiers, one mock token, two
signing-key examples and four documentation examples. Owner confirmation was
required for the six examples.

During this task the project owner confirmed those six values were used only as
examples or in disposable tests, never for real accounts, services or
non-disposable environments. That statement is recorded additively in the triage
JSON; the historical classifications and original limitations remain intact.
This is owner attestation, not external credential verification or proof that
every possible repository secret has been inventoried.

An actual baseline Gitleaks scan reproduced 907 findings. Every finding mapped
to the existing triage's commit/path/line/rule provenance and classification.
`.gitleaksignore` now records exactly those 907 historical fingerprints. It does
not globally exclude any path, commit, rule or secret value. A new occurrence at
another commit/location/rule is not exempted by these fingerprints.

The scanner regression was first run against the uncorrected policy and failed
with 907 findings. After the correction, history scanning passed. Separate
disposable Git and directory fixtures introduced newly generated credential-shaped
canaries in four previously flagged paths and one unrelated path. All five were
detected in both scan modes. No real credential was sent to an external service.

The official Gitleaks 8.30.1 Linux archive was checked against its published
SHA-256 checksum before execution. The security workflow pins that tested scanner
version and runs the regression checks after the action installs the scanner.
`command -v gitleaks` must succeed before tests start; CI cannot silently pass
this step by skipping an absent scanner. Full-history scanning and the full npm
high/critical rejection threshold are retained.

## Verification and remaining limits

| Check | Result |
|---|---|
| Scanner regression before exception correction | FAIL reproduced: 907 findings |
| Full pytest collection with actual Gitleaks 8.30.1 | PASS: 24 passed, three native Windows skips |
| Full fresh mirror scan: all 873 reachable commits/available refs, with reviewed fingerprints | PASS: zero unexcepted findings |
| New-secret canaries in Git and directory scan modes | PASS: detection retained in all five fixture paths |
| Gradle project configuration through process-local authorized proxy | PASS; Android assembly/submission not executed |
| Candidate lockfile audit at base `824d6bc` | PASS: zero reported vulnerabilities; master remains separate |
| Workflow YAML parsing, claim-surface guard and whitespace | PASS |
| Hosted CI on the new correction | NOT EXECUTED; nothing pushed or dispatched |

The Windows owner checkout was inspected read-only and had existing changes,
including its frontend lockfile. It was not reset, modified, built or used for
scanner policy changes. Free memory was about 1,607 MiB; no model/browser trial,
Docker interruption or additional heavy validation was started there.

The Gemini automation failure is a separate policy rejection of nested actions
and non-SHA refs. This patch does not widen the owner action policy or bypass it.
That optional workflow remains BLOCKED pending a compliant dependency graph and
review. Candidate dependency fixes and scanner exceptions are not deployed to
master. Independent human review and explicit merge approval remain required.

Self-review only; no separate reviewers or agents participated. No production
readiness, hardware attestation, universal secret clearance, or independently
certified security is asserted.
