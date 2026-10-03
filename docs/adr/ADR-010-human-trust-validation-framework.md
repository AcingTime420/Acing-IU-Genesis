# ADR-010 — People-first human trust validation framework

**Status:** Proposed  
**Date:** 2026-10-02  
**Author(s):** @AcingTime420

## Context

Genesis now has a canonical stabilization layer and a constitutional agent-governance layer. Those controls answer important engineering questions, but public trust cannot depend on internal architecture terminology or marketing.

Common AI concerns include human control, excessive agency, self-escalation, identity, authorization, prompt injection, privacy, hallucination, provenance, accountability, fairness, usability, revocation, and resource consumption.

If Genesis claims to answer those questions, each answer needs a reproducible evidence model.

## Decision

Genesis will maintain a people-first trust validation framework with:

1. machine-readable public trust questions in `config/genesis/human-trust-requirements.json`;
2. explicit maturity labels;
3. repository evidence and validation references;
4. an exact completion condition for each trust question;
5. explicit non-claims;
6. external standards alignment that never implies certification;
7. a plain-language Trust Center;
8. automated repository validation through `scripts/check-genesis-human-trust.py`;
9. commercial constraints that prevent sponsorship or payment from purchasing security authority or unsupported claims.

The evidence rule is:

```text
concern
→ requirement
→ risk
→ control
→ implementation
→ test/evaluation
→ evidence
→ maturity
→ public answer
```

A missing link prevents promotion to Verified.

## Ownership and authority boundary

The repository records AcingTime420 as the current Genesis project governance principal.

This ADR deliberately does not treat a repository record as dispositive legal proof of intellectual-property title. Legal ownership, trademark rights, copyright assignments, company ownership, and contracts require their own evidence where applicable.

Genesis and delegated agents remain subordinate non-human actors.

## External references

The framework is informed by, but does not claim certification under:

- NIST AI Risk Management Framework;
- NIST AI 600-1 Generative AI Profile;
- NIST NCCoE Software and AI Agent Identity and Authorization work;
- NIST TEVV-Athlon;
- W3C WebAuthn Level 3;
- OWASP Top 10 for LLM and GenAI Applications;
- C2PA Content Credentials.

## Consequences

### Positive

- Public claims gain explicit evidence and completion criteria.
- People can see unfinished work without reading source code.
- The repository can fail closed on missing evidence references.
- Human authority, sponsor influence, and project control are distinguishable.
- Future security reviews have a stable list of trust questions to test.
- Monetization is constrained from overriding trust claims.

### Trade-offs

- Genesis must publicly expose limitations.
- More capabilities require more evaluation work before promotion.
- Some attractive marketing claims will remain unavailable until evidence exists.
- Standards alignment must be maintained as external specifications evolve.
- Usability and fairness require human studies, not code-only validation.

## Rejected alternatives

### Marketing-only trust page

Rejected because prose can drift without machine-readable evidence or CI.

### One numerical "trust score"

Rejected because a single number can hide different scopes, evidence quality, and unresolved risks.

### Claim standards compliance by reference

Rejected because referencing a standard is not evidence of conformance or certification.

### Let sponsors or customers define maturity

Rejected because payment cannot substitute for evidence.

## Completion

This ADR is implemented when the machine-readable framework, public Trust Center, validation script, and CI gate exist and pass on the full stacked Genesis branch.
