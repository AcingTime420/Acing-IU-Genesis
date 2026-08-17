# ADR-0007: Reproducible Releases, Provenance, and Recovery

**Status:** Accepted
**Date:** 2026-08-16

## Context

A release cannot be trusted if it cannot be reproduced from a clean checkout, traced to validated source, attributed to a reviewed change, or safely rolled back. Historical worktrees and local changes further increase recovery risk.

## Decision

Releases must originate from a reviewed canonical commit that has passed the authoritative validation manifest in a clean environment. Release artifacts must identify their source commit, dependency locks, build environment, and integrity hashes. Verified baselines and releases require signed tags where the hosting platform permits. Rollback uses a prior verified tag or a dedicated recovery branch; it must never rely on an undocumented local worktree.

## Consequences

Green local builds, UI demonstrations, and manually assembled artifacts are insufficient release evidence. CI/CD, deployment, migration, smoke, and rollback evidence must be attached to the release record. Current release snapshots remain preservation artifacts until they are independently validated.
