# Repository Governance Record

**Status:** Approved baseline control
**Effective date:** 2026-08-16
**Scope:** Acing IU: Genesis

## Canonical Repository

| Control | Authoritative value |
|---|---|
| Canonical GitHub repository | `AcingTime420/Acing-IU-Genesis` |
| Canonical remote | `origin` — `https://github.com/AcingTime420/Acing-IU-Genesis.git` |
| Canonical integration and default branch | `master` |
| Normal worktree identifier | `canonical-windows-worktree` |
| Local evidence at record creation | Initial and post-governance snapshots are retained in private recovery evidence; neither is canonical Git history |

All engineering changes, validation evidence, release tags, and security decisions for Genesis must be traceable to the canonical repository and a reviewed branch. The logical worktree identified above is the only owner-designated location authorized for routine implementation during the stabilization gate; its machine-specific path remains private.

The Windows worktree and preservation details in this record are owner-supplied local evidence. They cannot be independently established from the GitHub repository tree and must be revalidated by the operator before recovery or cleanup work relies on them.

## Backend Path Authority

| Path | Classification | Control |
|---|---|---|
| `backend/` | Canonical backend implementation root | Backend source development, builds, tests, dependency monitoring, containers, and release publication must use this path. |
| `acing-iu/backend/` | Legacy duplicate | Frozen against new development. Preserve until Git history and downstream consumers are verified; remove only through a dedicated reviewed pull request. |
| `installer/payload/platform/backend/` | Generated installer payload | Derived from `backend/`; must not be independently edited or treated as authoritative. Release validation must prove correspondence to reviewed source. |

The current classification is supported by `docs/evidence/backend-root-reconciliation.md`. Historical explanation belongs under `docs/`; compilable duplicate source must not be retained as documentation.

Canonical-root status does not by itself certify every project below `backend/` as active or release-ready. The canonical solution and the applicable build, test, container, and release evidence determine active project ownership.

## Accountability

| Responsibility | Current accountable owner | Status |
|---|---|---|
| Repository administration and architecture decisions | `@AcingTime420` | Active project owner |
| Risk-exception approval | `@AcingTime420` | Must record scope, rationale, and expiration |
| Release authorization | `@AcingTime420` | Independent release verification and approved automation remain pending |
| AI and data governance | `@AcingTime420` | External-provider processing remains unapproved unless separately recorded |
| Authorized Device Lab governance | `@AcingTime420` | Planned/non-operational; device-changing controls remain disabled pending verified execution and safety evidence |
| Independent human review | Unassigned | Required before this baseline is treated as independently reviewed |

## Worktree and Remote Controls

Additional worktrees are inventory subjects, not implicit deployment or release sources. They may be used only for their recorded branches and purposes. No worktree may be deleted, force-reset, or repointed until its preservation status is recorded in the Phase 0 inventory.

The `legacy-local` remote points to an owner-controlled local archive whose machine-specific path is retained only in private recovery evidence. It is **archive-only**. Fetching from it is permitted solely for comparison or recovery evidence. Pushing to it, merging from it, or treating it as a release source is prohibited unless a later Architecture Decision Record explicitly supersedes this control.

## Authorized Synchronization Paths

| Source | Allowed destination | Purpose | Restrictions |
|---|---|---|---|
| Reviewed task branch in canonical repository | Protected `master` branch | Normal delivery | Requires validation evidence and review. |
| Canonical signed tag | Release pipeline | Reproducible release | Tag must identify an evidence-backed commit. |
| `legacy-local` archive | Recovery branch in canonical repository | Forensic comparison or recovery | Read-only source; create a dedicated branch and preserve evidence. |
| Preserved local patches | Dedicated recovery branch | Restore reviewed work | Apply only after diff review and automated validation. |

## Security Rationale

A single authoritative origin limits the risk that unreviewed local history, stale clones, or an unintended remote becomes a supply-chain path. Separating recovery sources from normal delivery supports least privilege and preserves forensic traceability. Credentials, private keys, tokens, local environment files, generated output, and runtime state remain outside source control.

## Change Control

Any change to the canonical repository, backend path authority, working path, remote policy, or synchronization paths requires a superseding ADR in `docs/adr/` and an accompanying update to this governance record.
