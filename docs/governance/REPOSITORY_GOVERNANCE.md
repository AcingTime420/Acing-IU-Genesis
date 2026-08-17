# Repository Governance Record

**Status:** Approved baseline control
**Effective date:** 2026-08-16
**Scope:** Acing IU: Genesis

## Canonical Repository

| Control | Authoritative value |
|---|---|
| Canonical GitHub repository | `AcingTime420/Acing-IU-Genesis` |
| Canonical remote | `origin` — `https://github.com/AcingTime420/Acing-IU-Genesis.git` |
| Normal Windows worktree | `D:\Acing-IU\Genesis` |
| Baseline branch at record creation | `fix/repository-integrity-baseline` |
| Baseline commit at record creation | `3b0819e16520b9984c6613bab400d38250e28b19` |

All engineering changes, validation evidence, release tags, and security decisions for Genesis must be traceable to the canonical repository and a reviewed branch. The normal Windows worktree above is the only location authorized for routine implementation during the stabilization gate.

## Worktree and Remote Controls

Additional worktrees are inventory subjects, not implicit deployment or release sources. They may be used only for their recorded branches and purposes. No worktree may be deleted, force-reset, or repointed until its preservation status is recorded in the Phase 0 inventory.

The `legacy-local` remote points to `C:\Users\edandspring\Documents\GitHub\Acing-IU`. It is **archive-only**. Fetching from it is permitted solely for comparison or recovery evidence. Pushing to it, merging from it, or treating it as a release source is prohibited unless a later Architecture Decision Record explicitly supersedes this control.

## Authorized Synchronization Paths

| Source | Allowed destination | Purpose | Restrictions |
|---|---|---|---|
| Reviewed task branch in canonical repository | Canonical protected integration branch | Normal delivery | Requires validation evidence and review. |
| Canonical signed tag | Release pipeline | Reproducible release | Tag must identify an evidence-backed commit. |
| `legacy-local` archive | Recovery branch in canonical repository | Forensic comparison or recovery | Read-only source; create a dedicated branch and preserve evidence. |
| Preserved local patches | Dedicated recovery branch | Restore reviewed work | Apply only after diff review and automated validation. |

## Security Rationale

A single authoritative origin limits the risk that unreviewed local history, stale clones, or an unintended remote becomes a supply-chain path. Separating recovery sources from normal delivery supports least privilege and preserves forensic traceability. Credentials, private keys, tokens, local environment files, generated output, and runtime state remain outside source control.

## Change Control

Any change to the canonical repository, working path, remote policy, or synchronization paths requires a superseding ADR in `docs/adr/` and an accompanying update to this governance record.
