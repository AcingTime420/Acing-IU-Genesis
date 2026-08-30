# Phase 0 Worktree and Preservation Inventory

**Recorded:** 2026-08-16
**Scope:** Acing IU: Genesis stabilization baseline
**Canonical repository:** `AcingTime420/Acing-IU-Genesis`
**Canonical working path:** `D:\Acing-IU\Genesis`

## Inventory Method

This record was created before cleanup or repair work. It lists all Genesis-related directories discovered under `D:\Acing-IU`, the worktrees registered by Git, their recorded branch and commit where available, and the preservation status of known tracked changes. The `F:` drive was unavailable during this inventory. No discovered worktree or directory was deleted.

This inventory is owner-supplied Windows-local evidence. The GitHub repository tree does not independently verify that the listed paths, stashes, patches, hashes, or worktree states remain current. Re-run the inventory commands on the owning Windows system before relying on this record for recovery, deletion, or cleanup.

| Location | Git classification | Branch / state | Commit | Recorded purpose | Preservation status |
|---|---|---|---|---|---|
| `D:\Acing-IU\Genesis` | Canonical registered worktree | `fix/repository-integrity-baseline` | `f8445161de3794e6261486af7bcb6488d6f14fd4` | Authorized stabilization worktree | Clean after governance commit; earlier local changes exported and stashed. |
| `D:\Acing-IU\Genesis-deployment-integration` | Registered worktree | `feature/validated-deployment-integration` | `e7ff7ff396e30e4a28435429a7e0221b0f6c0e5d` | Deployment-integration work | Local changes exported and stashed; tracked state clean. |
| `D:\Acing-IU\Genesis-reconcile` | Registered worktree | `feature/genesis-irp-v1.3.1-import-clean` | `06dfbec6e06ecc40bb838678d805adff4ebb9e99` | Reconciliation/import cleanup work | No tracked modifications observed. |
| `D:\Acing-IU\Genesis-v1.4.0-rc.1-release` | Registered worktree | Detached `HEAD` | `30b07782aac8aded710063f127d532972497e518` | Historical release-candidate snapshot | No tracked modifications observed; preserve as release evidence. |
| `D:\Acing-IU\Genesis.worktrees\improving-acing-iu-genesis` | Registered worktree | `agents/improving-acing-iu-genesis` | `55f6140019f40576ec96d5eee322ace71d2471c5` | Guardian-service improvement work | Local changes exported and stashed; tracked state clean. |
| `D:\Acing-IU\Genesis-IRP-v1.3.1-Temporary` | Directory discovered; not a Git worktree at inspection | Not applicable | Not applicable | Temporary IRP material | Preserve in place; classify contents before any later action. |
| `D:\Acing-IU\Acing IU Genesis Cookbook Series - Grok_files` | Directory discovered; not a Git worktree | Not applicable | Not applicable | Downloaded/reference content | Archive-only; out of scope for implementation. |

## Preservation Register

The following recoverable artifacts are stored outside the canonical worktree at `D:\Acing-IU\Preservation\2026-08-16-phase0-baseline`. The preservation folder must be retained until the related changes have either been reviewed and delivered through dedicated branches or formally discarded by an approved decision record.

| Artifact | Source | Method | Verification |
|---|---|---|---|
| `canonical-tracked-changes.patch` | Canonical worktree Refact runtime metadata and `START_HERE.md` | Binary Git patch and named stash | SHA-256 `33CBF7DC5C0B9DBC654D24B74E2B9794CE293BE8C19BC7AD5593BF8A3DFBBB33` |
| `agent-worktree-tracked-changes.patch` | Guardian service changes in agent worktree | Binary Git patch and named stash | SHA-256 captured at export; named Phase 0 stash created. |
| `deployment-integration-tracked-changes.patch` | Deployment worktree editor/runtime changes | Binary Git patch and named stash | SHA-256 `AB04A2219BC34E6A879ECF7FAD34E59357D23BDCDE16436B7BEEB7827E8E` (full value recorded by command output at export). |
| `canonical-stash-register.txt` | Canonical repository | Stash metadata snapshot | Preserves pre-existing and Phase 0 named stash references. |
| `github-mcp-server-untracked-copy` and `github-mcp-server-untracked-original` | Untracked nested Git metadata under canonical worktree | Copied, file-count verified, then moved out of canonical worktree | Source and backup each contained 465 entries; original source path no longer exists in canonical worktree. |

## Worktree Controls

No inventory item may be force-reset, deleted, repointed, or merged solely because it is older than the canonical worktree. Applying a preserved patch requires a dedicated recovery branch, human review of the diff, and the validation gates applicable to the affected subsystem. The detached release worktree is evidence, not a release authority.

## Security Implications

The inventory prevents accidental loss of unreviewed work and limits the chance that an orphaned clone, temporary directory, or stale release snapshot becomes an undocumented supply-chain input. Preserved patches remain outside the production source tree, and the canonical worktree has no unexplained tracked or untracked changes after the Phase 0 preservation procedure.
