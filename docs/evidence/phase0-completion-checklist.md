# Phase 0 Completion Checklist — Issue #54

**Recorded:** 2026-09-13  
**Tracking:** [#54](https://github.com/AcingTime420/Acing-IU-Genesis/issues/54)  
**Canonical repository:** `AcingTime420/Acing-IU-Genesis`  
**Canonical branch:** `master`

## Task map (Master To-Do 0.1–0.6)

| Task | Intent | Evidence in tree | Status |
|---|---|---|---|
| **0.1** Declare canonical repository | Single authoritative origin | `docs/adr/ADR-002-canonical-repository-and-recovery.md`; `docs/governance/REPOSITORY_GOVERNANCE.md` | **Done** |
| **0.2** Inventory and preserve worktrees | Public classification without leaking private paths | `docs/governance/WORKTREE_INVENTORY.md` | **Done** (private recovery map remains owner-local by design) |
| **0.3** Capability register | Maturity labels for every claimed capability | `docs/CAPABILITY_REGISTER.md` (updated 2026-09-13 for claim-surface) | **Done** |
| **0.4** ADR set | Architecture decisions for structure, recovery, security | `docs/adr/ADR-001` … `ADR-008`; `docs/adr/README.md` | **Done** |
| **0.5** Repository integrity baseline | Hygiene, clean-clone scripts, CI | `docs/evidence/repository-integrity-baseline.md`; `.gitignore`; `scripts/validate-premerge.sh`; `.github/workflows/ci.yml`; `repo-integrity.yml` | **Done** |
| **0.6** Feature freeze until baseline validated | Stabilization-only policy | `docs/governance/STABILIZATION_POLICY.md` | **Policy written**; remote enforcement still **POLICY_UNVERIFIED** |

## Related completed security surface (not Phase 0 scope, but unblocks gates)

| Item | Issue | Status |
|---|---|---|
| Unsupported Knox/certification claims removed from operator UI | #63 | Closed 2026-09-13 |
| Claim-surface CI lint | #63 | `scripts/check-claim-surface.sh` in `ci.yml` |
| Audit API durability | #60 | Closed |
| DeviceTrust object-level auth | #61 | Closed |
| Container base digest pinning | #62 | Closed |

## Exit criteria (from STABILIZATION_POLICY)

| Criterion | Status |
|---|---|
| Phase 0 controls documented and reviewed in-repo | Met (this file + governance set) |
| Phase 1 repository-integrity repairs complete | Largely met; known residual: tracked `.idea/` / `*.iml` noted in baseline evidence |
| Reproducible clean-clone validation | Scripts present; CI runs `validate-premerge.sh --skip-compose` |
| Branch protection on `master` (PR required, no force-push, required checks) | **Not verified** — requires repository administrator action |

## Owner action required (cannot be completed by automation alone)

1. Open **Settings → Branches → Branch protection rules** (or Rulesets) for `master`.
2. Enable at minimum:
   - Require a pull request before merging
   - Require approvals (dismiss stale reviews)
   - Require status checks to pass (include the CI / repo-integrity jobs once stable)
   - Restrict force pushes and branch deletion
3. Attach a screenshot or settings export to issue #54 confirming the effective rules.
4. After confirmation, update `docs/governance/STABILIZATION_POLICY.md` remote-enforcement row from `POLICY_UNVERIFIED` to `ENFORCED` with the date.

Until step 3–4 are done, issue #54 should remain **open** even though documentary tasks 0.1–0.5 are complete.

## Branch hygiene note

As of 2026-09-13 the remote still lists many historical `copilot/*`, `backup/*`, and `dependabot/*` branches. They are not release authority. Cleanup is optional Phase 0 hygiene and must not delete recovery-labeled branches without owner confirmation against the private preservation map.
