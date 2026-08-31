# ADR-006: Android and Firmware Operation Safety

**Status:** Accepted
**Date:** 2026-08-16

## Context

Android diagnostics, provisioning, recovery, and firmware operations can cause privacy exposure, service interruption, or irreversible device loss when applied to an unauthorized, unsupported, or incorrectly identified device.

## Decision

Android and firmware functions are restricted to explicit, authorized workflows with model-specific compatibility checks, device identification, operator authorization, policy evaluation, audit events, and recoverability requirements. Hardware-backed or platform attestation is treated as an external integration until implementation and device-specific verification exist. The application must present unsupported or unverified operations as unavailable rather than simulated enforcement.

## Consequences

No destructive, flashing, unlocking, wiping, or recovery function may be enabled based on UI availability alone. Every supported operation requires test evidence for authorization, failure handling, rollback or recovery where feasible, and audit production. Unsupported devices must fail closed.
