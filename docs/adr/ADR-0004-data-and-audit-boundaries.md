# ADR-0004: Data Ownership, Migration Discipline, and Immutable Audit Logging

**Status:** Accepted
**Date:** 2026-08-16

## Context

Identity, policy, device-trust, MFA, and audit data have different sensitivity, retention, and access-control requirements. Ad hoc schema changes or application-only audit logging would compromise reproducibility and forensic value.

## Decision

All durable schema changes are version-controlled migrations executed through the approved migration workflow. Application services own their logical data but may not bypass database constraints or direct grants. MFA secret material must be encrypted at rest and access-controlled. Audit records must capture the actor, action, target, relevant policy decision, timestamp, and correlation identifier; updates or deletions of audit records are prohibited except through documented, reviewed retention workflows that preserve tamper evidence.

## Consequences

Database initialization, migration, and constraint tests become mandatory release evidence. Direct production schema edits and untracked data fixes are prohibited. Data recovery procedures must preserve audit integrity and be documented before production use.
