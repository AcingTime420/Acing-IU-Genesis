# ADR-003: Modular Control-Plane Architecture

**Status:** Accepted
**Date:** 2026-08-16

## Context

Genesis contains identity, device-trust, security-policy, shared-kernel, database, container, Android, and operator-facing components. Cross-cutting logic or duplicate shared assemblies would make authorization and audit controls difficult to reason about and test.

## Decision

The platform will use modular services with explicit dependency direction: interfaces and shared primitives may be consumed inward, while application services may not depend on delivery, UI, or deployment modules. Identity owns authentication and MFA; Device Trust owns trust evaluation; Security owns policy evaluation; the database owns transactional persistence and audit constraints; operator and Android clients consume documented APIs.

`backend/` is the canonical backend implementation root. This path decision does not classify every project currently contained under `backend/` as active, supported, or verified; project membership remains governed by the canonical solution, build, test, container, and release evidence. `acing-iu/backend/` is a legacy duplicate: it is frozen against new development and may be removed only through a dedicated reviewed change after Git-history and downstream-consumer verification. `installer/payload/platform/backend/` is generated installer content derived from the canonical backend; it is not an independent source tree and must not be hand-edited. Shared contracts must be canonical, and any additional competing project root or assembly is a defect unless a superseding ADR documents a distinct ownership boundary.

## Consequences

This structure enables unit and integration testing of security-sensitive decisions, prevents hidden coupling, and makes service boundaries visible in architecture documentation. Installer releases must prove that generated payload content corresponds to the reviewed canonical source. The evidence supporting the current path classification is recorded in `docs/evidence/backend-root-reconciliation.md`. Any exception requires a superseding ADR and dependency-graph validation.
