# Stabilization-Only Policy

**Status:** Active as project policy; remote enforcement `POLICY_UNVERIFIED` and pending repository-administrator action
**Effective date:** 2026-08-16
**Tracking issue:** [#54](https://github.com/AcingTime420/Acing-IU-Genesis/issues/54)

## Policy

Until the repository baseline is verified, new feature work is frozen. Permitted work is limited to build and dependency repairs, tests, validation scripts, security remediation, documentation correction, preservation, and release-baseline evidence. Any proposed feature, UI expansion, Android workflow, AI integration, or deployment enhancement must be recorded as deferred work rather than merged into the stabilization branch.

## Required Remote Controls

The canonical integration branch must require pull requests, successful authoritative validation, and review before merge. The Phase 0 tracking issue must remain open until all required Phase 0 evidence is reviewed.

Remote enforcement is classified `POLICY_UNVERIFIED`. On 2026-08-16, an integration request to the `master` branch-protection endpoint returned `403 Resource not accessible by integration`. On 2026-08-30, a later unauthenticated read-only request returned `401 Requires authentication`. These are authentication/authorization failures, not evidence of the configured policy. An owner-supplied GitHub repository screenshot on 2026-08-30 displayed the “Protect this branch” prompt, which indicates that protection still requires administrator attention, but the complete effective rules and ruleset context remain unverified. A repository administrator must inspect the authenticated settings, apply the controls below, and attach confirmation to issue #54.

| Control | Required setting | Current evidence |
|---|---|---|
| Pull request review | Required before merge; dismiss stale approvals on new commits. | Not verified as enforced |
| Status checks | Require the authoritative validation workflow after it is established in Phase 2. | Candidate checks exist; exact required set not yet approved |
| Direct push | Restrict direct pushes to the canonical integration branch. | Not verified as enforced |
| Force pushes and deletion | Prohibit both. | Not verified as enforced |
| Release tags | Restrict tag creation to approved release automation or designated maintainers. | Maintainer/automation rule not yet verified |
| Project tracking | Keep issue #54 open and label all non-stabilization work as deferred until the baseline gate is green. | Issue #54 was reported open in the 2026-08-30 evidence snapshot |

## Exit Criteria

The freeze may be lifted only when the required Phase 0 controls are evidenced, Phase 1 repository-integrity repairs are complete, and a reproducible clean-clone validation has passed or an approved risk exception identifies the owner, scope, and expiration date.
