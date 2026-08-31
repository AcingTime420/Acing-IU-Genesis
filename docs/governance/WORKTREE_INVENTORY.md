# Phase 0 Worktree and Preservation Inventory

**Recorded:** 2026-08-16

**Scope:** Acing IU: Genesis stabilization baseline

**Canonical repository:** `AcingTime420/Acing-IU-Genesis`

**Canonical worktree identifier:** `canonical-windows-worktree`

## Public Inventory Boundary

The owner reported multiple local worktrees, temporary directories, release snapshots, and preserved changes during the Phase 0 inspection. Those assets are recovery evidence, not canonical source, deployment inputs, or release authority.

Machine-specific paths, local-only commit identifiers, patch hashes, stash identifiers, and the private preservation map are intentionally excluded from this public repository. They remain in owner-controlled private recovery evidence and must be revalidated on the owning workstation before any recovery or cleanup operation.

## Public Classification

| Asset class | Public classification | Required control |
|---|---|---|
| Owner-designated canonical worktree | Routine implementation location | Changes must use reviewed branches of the canonical repository. |
| Additional registered worktrees | Preservation or task-specific evidence | Do not treat as implicit release sources; reconcile before reuse. |
| Detached release snapshots | Historical evidence | Preserve until release provenance is independently established. |
| Temporary project directories | Unclassified local material | Review contents before moving, importing, or deleting. |
| Downloaded reference material | Archive-only | Keep outside implementation and release inputs. |
| Exported patches and stashes | Private recovery evidence | Restore only on dedicated recovery branches after diff review. |

## Preservation Controls

- Do not force-reset, delete, repoint, merge, or clean a local worktree solely because it is old.
- Do not publish private recovery paths, hashes, stash identifiers, credentials, or unrelated personal files.
- Before recovery, re-run the local inventory and confirm the exact source, target, ownership, dirty state, and recoverability.
- Apply preserved changes only to a dedicated recovery branch in the canonical repository.
- Review the recovered diff and run the validation gates for every affected subsystem before delivery.
- Retain the private preservation archive until each item is reviewed and delivered or explicitly discarded through an approved decision record.

## Security Implications

Separating the public governance summary from the private recovery map prevents workstation details and recovery metadata from becoming public while preserving the controls needed to avoid accidental loss or an undocumented supply-chain input. Only reviewed canonical commits may become implementation, release, or deployment authority.
