# Stabilization-Only Policy

**Status:** Active locally; remote enforcement pending repository-administrator action
**Effective date:** 2026-08-16
**Tracking issue:** [#54](https://github.com/AcingTime420/Acing-IU-Genesis/issues/54)

## Policy

Until the repository baseline is verified, new feature work is frozen. Permitted work is limited to build and dependency repairs, tests, validation scripts, security remediation, documentation correction, preservation, and release-baseline evidence. Any proposed feature, UI expansion, Android workflow, AI integration, or deployment enhancement must be recorded as deferred work rather than merged into the stabilization branch.

## Required Remote Controls

The canonical integration branch must require pull requests, successful authoritative validation, and review before merge. The Phase 0 tracking issue must remain open until all required Phase 0 evidence is reviewed. Current GitHub credentials were not authorized to read or modify branch-protection settings; the GitHub REST API returned `403 Resource not accessible by integration` for the `master` branch-protection endpoint. A repository administrator must apply the controls below and attach confirmation to issue #54.

| Control | Required setting |
|---|---|
| Pull request review | Required before merge; dismiss stale approvals on new commits. |
| Status checks | Require the authoritative validation workflow after it is established in Phase 2. |
| Direct push | Restrict direct pushes to the canonical integration branch. |
| Force pushes and deletion | Prohibit both. |
| Release tags | Restrict tag creation to approved release automation or designated maintainers. |
| Project tracking | Keep issue #54 open and label all non-stabilization work as deferred until the baseline gate is green. |

## Exit Criteria

The freeze may be lifted only when the required Phase 0 controls are evidenced, Phase 1 repository-integrity repairs are complete, and a reproducible clean-clone validation has passed or an approved risk exception identifies the owner, scope, and expiration date.
