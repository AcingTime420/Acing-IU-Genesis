# Stabilization verification — 2026-10-20 (Pacific)

Status: partial verification; owner confirmation and independent review pending.
This report does not lift the feature freeze or authorize a merge or release.

## Scope and sources

Inspected `master` at `4cf3181951ddc3366a193d49cb8ca32dce346bf7` and
PR #166 at `278b2a0b4ea62f2ac2477b667b3e048a2177231e`.
The authenticated GitHub ruleset GET endpoints returned the settings preserved
in [rulesets-2026-10-20.json](rulesets-2026-10-20.json).

- [Master ruleset](https://github.com/AcingTime420/Acing-IU-Genesis/rules/23200339)
- [Release-tag ruleset](https://github.com/AcingTime420/Acing-IU-Genesis/rules/24706855)
- [PR #166 CI baseline run](https://github.com/AcingTime420/Acing-IU-Genesis/actions/runs/39541676006)
- [Phase 0 tracking issue](https://github.com/AcingTime420/Acing-IU-Genesis/issues/54)

Classic branch-protection GET returned HTTP 403. That retrieval limit is not
evidence that protection is absent: the separate ruleset endpoints were readable.
This is a settings snapshot, not a destructive enforcement probe or a complete
audit of every repository permission and organization policy.

## Observed controls

| Control | Observed value |
|---|---|
| Master ruleset | Active; matches `refs/heads/master` |
| Pull requests | Required; one approving review; dismiss stale reviews |
| Latest push | Approval required; review threads must be resolved |
| Required checks | `Repository Integrity (no tracked artifacts)`, `Backend Build & Test (.NET)`, `Frontend Build & Test (Node.js)` |
| Check identity | All three bound to integration ID 15368 (GitHub Actions) |
| Up-to-date branch | Strict required-check policy enabled |
| Master deletion / force push | Deletion and non-fast-forward rules present |
| Master bypass | Administrator repository role ID 5 may bypass through pull requests |
| Version tags | Active ruleset matches `refs/tags/v*`; creation, update, deletion and non-fast-forward restricted |
| Tag bypass | Administrator repository role ID 5 has an always bypass |

Administrator bypasses mean the settings must not be described as protections
that nobody can override. No settings were modified during this verification.

## Validation evidence and discovered blocker

All six PR #166 workflow runs reported success: CI baseline, Repository Integrity,
Security and Dependency Review, Generate SBOM, Gemini Dispatch, and the local
delegated-action reference. The reference is a simulator, not application
authorization evidence. No review submissions or inline review threads were
present when inspected; an empty thread list is not approval.

The backend CI log records 15 Identity tests and 6 DeviceTrust tests passing.
These are unit tests, not delegated-action or ownership API integration tests.

The successful baseline job contains a false success: `build.sh` reported a missing
`system/security/guardian/build` directory and failed artifact copies, then exited
zero. The validator accepted that exit code. The Guardian Makefile was removed
in historical commit `0674d32d228aac265379a016ddca77d9eb508cd3`, while build/release
entry points continued to reference it. Therefore that run is not evidence of a
successful Guardian build. Compose was explicitly skipped and health probes were
not run. Other successful jobs do not remove this limitation.

The accompanying repair restores the desktop Make target, makes `build.sh` check
the build and all expected nonempty outputs, and adds six subprocess regression
tests to the baseline workflow. It compiles existing research components and
packages existing scripts; no boot/device scripts are executed or enabled.
Its fresh CI results must be reviewed before the build blocker is considered
resolved on `master`.

Local repair validation used Kotlin 2.0.0 and OpenJDK 17. The actual compilation
completed, `bash build.sh` packaged all six expected nonempty outputs, and ZIP
inspection verified Guardian, Identity, DeviceTrust and Kotlin runtime classes
inside the JAR. All six build subprocess regression tests passed after failing
against the original script. Claim-surface lint and `git diff --check` passed.
`validate-premerge.sh --skip-compose` passed with real Kotlin compilation;
Compose and health checks remain outside that result. Local .NET tests were not
run; the 21-test count above comes from the inspected remote CI job.

`git ls-files '.idea/*' '*.iml'` returned no tracked entries at the inspected base.
The historical IDE-artifact residual in the September checklist is stale. This
observation does not close every other historical finding in the July report.

## Remaining owner and review actions

1. The owner reviews the two ruleset pages and this settings export, confirms that
   the listed checks and administrator bypasses match the intended policy, and
   records that confirmation with an evidence link on issue #54. No setting needs
   to be recreated merely because an older document called it unverified.
2. An independent eligible collaborator reviews the final changes. PR #166 was
   authored by `AcingTime420`; the same account cannot supply its own independent
   approval. Approvals must apply after the final push under the current ruleset.
3. Review successful fresh baseline validation for the repair and dispose of any
   remaining integrity findings before deciding whether to close #54.
4. Update the gate status through reviewed changes only after its exit criteria
   are met. Do not infer owner acceptance or lift the freeze from an API read.

No risk exception, repository-setting change, merge, deployment, or device
execution is part of this work.
