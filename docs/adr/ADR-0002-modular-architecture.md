# ADR-0002: Modular Control-Plane Architecture

**Status:** Accepted
**Date:** 2026-08-16

## Context

Genesis contains identity, device-trust, security-policy, shared-kernel, database, container, Android, and operator-facing components. Cross-cutting logic or duplicate shared assemblies would make authorization and audit controls difficult to reason about and test.

## Decision

The platform will use modular services with explicit dependency direction: interfaces and shared primitives may be consumed inward, while application services may not depend on delivery, UI, or deployment modules. Identity owns authentication and MFA; Device Trust owns trust evaluation; Security owns policy evaluation; the database owns transactional persistence and audit constraints; operator and Android clients consume documented APIs. Shared contracts must be canonical and duplicate project roots or assemblies are defects.

## Consequences

This structure enables unit and integration testing of security-sensitive decisions, prevents hidden coupling, and makes service boundaries visible in architecture documentation. Any exception requires a superseding ADR and dependency-graph validation.
