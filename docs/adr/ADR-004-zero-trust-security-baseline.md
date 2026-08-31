# ADR-004: Zero-Trust Security Baseline

**Status:** Accepted
**Date:** 2026-08-16

## Context

Acing IU is a security-first platform handling identities, device signals, policies, and potentially sensitive operational data. Trust cannot be inferred from network position, user-interface state, or a previously issued token alone.

## Decision

Every protected request must be authenticated, authorized through least-privilege RBAC and policy evaluation, and attributable to an audit event. MFA is required where configured by policy. Device trust is an explicit input to access decisions rather than an assumed property. Tokens, service credentials, and encryption keys must be stored through secret-management mechanisms and must never be committed. Audit records must be append-only or otherwise tamper-evident with controlled read access.

## Consequences

Convenience shortcuts that bypass identity, policy, device-trust, or audit controls are prohibited. Security claims require evidence at the enforcement point. The baseline must be tested across API, database, container, and operator paths before being labeled verified.
