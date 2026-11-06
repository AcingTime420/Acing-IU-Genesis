# Phase 0 Completion Checklist — Issue #54

**Recorded:** 2026-09-13
**Updated:** 2026-10-20 (Pacific); gate remains open
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
| **0.6** Feature freeze until baseline validated | Stabilization-only policy | `docs/governance/STABILIZATION_POLICY.md` | **Active**; ruleset settings verified; owner confirmation and repaired-baseline evidence pending |

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
| Phase 1 repository-integrity repairs complete | IDE residual no longer observed: no tracked `.idea/*` or `*.iml` at inspected base; full gate disposition remains pending |
| Reproducible clean-clone validation | PR #166 backend tests passed (15 Identity + 6 DeviceTrust); Guardian false-success defect requires reviewed repair and fresh CI |
| Branch protection on `master` (PR required, no force-push, required checks) | **Ruleset settings verified**; administrator bypasses documented; owner confirmation pending |

## Owner action required (cannot be completed by automation alone)

1. Review the [master ruleset](https://github.com/AcingTime420/Acing-IU-Genesis/rules/23200339)
   and [version-tag ruleset](https://github.com/AcingTime420/Acing-IU-Genesis/rules/24706855).
   The controls already exist; do not recreate or weaken them.
2. Read the [verification report](stabilization-verification-2026-10-20.md) and
   its settings export, including administrator bypasses and validation limits.
3. Record owner confirmation with the evidence link on issue #54, or identify
   the specific setting that needs correction. No automatic confirmation is inferred.
4. Obtain independent review and fresh successful validation of the Guardian build
   repair. Only after all exit criteria are met should a reviewed change record
   the final gate disposition and close #54.

Until steps 3–4 are complete, issue #54 remains **open**. Settings verification
does not itself lift the freeze or certify application authorization capabilities.

## Branch hygiene note

As of 2026-09-13 the remote still lists many historical `copilot/*`, `backup/*`, and `dependabot/*` branches. They are not release authority. Cleanup is optional Phase 0 hygiene and must not delete recovery-labeled branches without owner confirmation against the private preservation map.
