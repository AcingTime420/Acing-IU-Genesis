# ADR-0001: Canonical Repository and Recovery Sources

**Status:** Accepted
**Date:** 2026-08-16

## Context

Genesis has multiple local worktrees, a legacy local remote, release snapshots, and preserved local changes. Without a declared authority, unreviewed or stale history can enter delivery or release flows.

## Decision

`AcingTime420/Acing-IU-Genesis` is the canonical repository, `origin` is its authoritative remote, and `D:\Acing-IU\Genesis` is the normal Windows worktree. The `legacy-local` remote is archive-only and may be fetched solely for recovery or comparison. Preserved local changes must be restored only on dedicated recovery branches after review and validation.

## Consequences

All implementation and release evidence must reference the canonical repository and a reviewed branch. This limits supply-chain ambiguity, prevents accidental delivery from stale clones, and preserves a recoverable audit trail. The detailed controls are maintained in `docs/governance/REPOSITORY_GOVERNANCE.md`.
