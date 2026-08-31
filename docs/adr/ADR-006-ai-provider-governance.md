# ADR-006: Governed AI and External API Integration

**Status:** Accepted
**Date:** 2026-08-16

## Context

External AI providers and APIs may process sensitive device, user, policy, or operational information. Unbounded prompts, direct client-side credentials, or autonomous execution would conflict with least privilege and auditability.

## Decision

AI and external APIs must be integrated behind server-side, least-privilege adapters with centrally managed secrets, explicit data classification, request allowlists, rate limits, redacted audit events, and human approval for consequential actions. No client application may embed provider credentials. Device data, credentials, tokens, recovery artifacts, and audit content are prohibited from external-provider prompts unless an approved data-processing decision explicitly permits a minimized form. Provider responses are advisory and may not bypass policy enforcement.

## Consequences

AI capability claims remain external-dependency or target labels until provider contracts, abuse controls, evaluation tests, and operational monitoring are implemented. Failures must default to non-action and must not block core security functions.
