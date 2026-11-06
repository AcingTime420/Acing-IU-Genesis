# Stabilization-Only Policy

**Status:** Active; ruleset settings verified; owner confirmation and baseline repair pending
**Effective date:** 2026-08-16
**Last reviewed:** 2026-10-20 (Pacific)
**Tracking issue:** [#54](https://github.com/AcingTime420/Acing-IU-Genesis/issues/54)
**Evidence checklist:** [docs/evidence/phase0-completion-checklist.md](../evidence/phase0-completion-checklist.md)

## Policy

Until the repository baseline is verified, new feature work is frozen. Permitted work is limited to:

- Build and dependency repairs
- Tests and validation scripts
- Security remediation
- Documentation correction
- Preservation and release-baseline evidence

Any proposed feature, UI expansion, Android workflow, AI integration, or deployment enhancement must be recorded as deferred work rather than merged as product expansion while this policy is active.

Security remediation that *reduces* claim surface or closes high-severity defects (e.g. issue #63 operator-surface cleanup) is **in scope** for the freeze.

## Required Remote Controls

The canonical integration branch, `master`, must require pull requests, successful authoritative validation, and review before merge. The Phase 0 tracking issue must remain open until all required Phase 0 evidence is reviewed **and** branch protection is confirmed by a repository administrator.

Remote settings are classified **`RULESET_SETTINGS_VERIFIED_OWNER_CONFIRMATION_PENDING`**.
The 2026-10-20 authenticated ruleset reads confirm active master and version-tag
rulesets. Classic branch-protection reads still return HTTP 403; this does not
negate the readable rulesets. See the [verification report and settings export](../evidence/stabilization-verification-2026-10-20.md).
The owner must confirm the settings and administrator bypasses on issue #54;
automation has not declared the stabilization gate complete.

| Control | Required setting | Current evidence |
|---|---|---|
| Pull request review | Required before merge; dismiss stale approvals on new commits | Active: one approval, stale-review dismissal, latest-push approval and resolved threads required; admin PR bypass exists |
| Status checks | Require authoritative validation | Active: repository integrity, backend build/test, frontend build/test; strict up-to-date checks, GitHub Actions integration ID 15368 |
| Direct push | Restrict direct pushes to the canonical integration branch | Active PR requirement; listed administrator bypass is PR-only |
| Force pushes and deletion | Prohibit both | Active deletion and non-fast-forward rules on `master`, subject to documented bypass scope |
| Release tags | Restrict tag creation to approved release automation or designated maintainers | Active rules for `v*` creation/update/deletion/non-fast-forward; administrator always-bypass requires owner confirmation |
| Project tracking | Keep issue #54 open until owner confirms protection; label non-stabilization work as deferred | Issue remains open; confirmation and repaired-baseline evidence pending |

## Exit Criteria

The freeze may be lifted only when:

1. Required Phase 0 documentary controls are evidenced (see phase0-completion-checklist.md),
2. Phase 1 repository-integrity repairs are complete or accepted with residual notes,
3. A reproducible clean-clone validation path exists and has been run (scripts + CI),
4. Branch protection on `master` is confirmed by the repository administrator (screenshot or settings export on #54), **or** an approved risk exception identifies the owner, scope, and expiration date.

## 2026-09-13 progress note

Historical snapshot; superseded where noted by the 2026-10-20 assessment below.

- Issue #63 (unsupported Knox/certification/firmware claims) closed; operator UI gated; claim-surface lint in CI.
- Capability register updated with claim-to-evidence mapping.
- Phase 0 checklist committed under `docs/evidence/phase0-completion-checklist.md`.
- **Still blocking formal close of #54:** owner verification of `master` branch protection.

## 2026-10-20 assessment

- Remote ruleset settings can now be read and are preserved in the linked report.
- Owner confirmation and independent review remain outstanding.
- PR #166 workflows report success, but its Guardian baseline log contains failed
  artifact copies masked by a zero-exit `build.sh`; that job is not Guardian build
  evidence. Review the accompanying build repair and fresh validation before close.
- The freeze remains active. No exception or product-expansion authorization is
  created by this settings verification.
