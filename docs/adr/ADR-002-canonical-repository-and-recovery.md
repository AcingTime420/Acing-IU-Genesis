# ADR-002: Canonical Repository and Recovery Sources

**Status:** Accepted
**Date:** 2026-08-16

## Context

Genesis has multiple local worktrees, a legacy local remote, release snapshots, and preserved local changes. Without a declared authority, unreviewed or stale history can enter delivery or release flows.

## Decision

`AcingTime420/Acing-IU-Genesis` is the canonical repository and `origin` is its authoritative remote. The owner-designated canonical worktree is the normal implementation location. The `legacy-local` remote is archive-only and may be fetched solely for recovery or comparison. Preserved local changes must be restored only on dedicated recovery branches after review and validation. Machine-specific paths and private recovery metadata remain outside the public repository.

## Consequences

All implementation and release evidence must reference the canonical repository and a reviewed branch. This limits supply-chain ambiguity, prevents accidental delivery from stale clones, preserves a recoverable audit trail, and avoids exposing private workstation recovery details. The detailed public controls are maintained in `docs/governance/REPOSITORY_GOVERNANCE.md` and `docs/governance/WORKTREE_INVENTORY.md`.
