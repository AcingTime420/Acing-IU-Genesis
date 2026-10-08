# Stabilization-Only Policy

**Status:** Active as project policy; remote enforcement `POLICY_UNVERIFIED` and pending repository-administrator action  
**Effective date:** 2026-08-16  
**Last reviewed:** 2026-09-13  
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

Remote enforcement is classified **`POLICY_UNVERIFIED`**. Historical probes (2026-08-16, 2026-08-30) could not read protection settings via integration credentials. An owner-supplied GitHub screenshot on 2026-08-30 still showed the “Protect this branch” prompt. A repository administrator must inspect authenticated settings, apply the controls below, and attach confirmation to issue #54.

| Control | Required setting | Current evidence |
|---|---|---|
| Pull request review | Required before merge; dismiss stale approvals on new commits | Not verified as enforced |
| Status checks | Require CI / repo-integrity (and claim-surface) after Phase 2 formalizes the required set | Candidate checks exist in `.github/workflows/ci.yml`; exact required set not yet approved on the branch rule |
| Direct push | Restrict direct pushes to the canonical integration branch | Not verified as enforced |
| Force pushes and deletion | Prohibit both | Not verified as enforced |
| Release tags | Restrict tag creation to approved release automation or designated maintainers | Maintainer/automation rule not yet verified |
| Project tracking | Keep issue #54 open until owner confirms protection; label non-stabilization work as deferred | Documentary tasks 0.1–0.5 recorded in phase0-completion-checklist.md |

## Exit Criteria

The freeze may be lifted only when:

1. Required Phase 0 documentary controls are evidenced (see phase0-completion-checklist.md),
2. Phase 1 repository-integrity repairs are complete or accepted with residual notes,
3. A reproducible clean-clone validation path exists and has been run (scripts + CI),
4. Branch protection on `master` is confirmed by the repository administrator (screenshot or settings export on #54), **or** an approved risk exception identifies the owner, scope, and expiration date.

## 2026-09-13 progress note

- Issue #63 (unsupported Knox/certification/firmware claims) closed; operator UI gated; claim-surface lint in CI.
- Capability register updated with claim-to-evidence mapping.
- Phase 0 checklist committed under `docs/evidence/phase0-completion-checklist.md`.
- **Still blocking formal close of #54:** owner verification of `master` branch protection.
