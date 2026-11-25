# AIU-LEGAL-003 — Legal-to-Engineering Requirements Traceability

**Status:** PROPOSED — documentation integration only  
**Date:** 2026-11-24  
**Scope:** Mapping current [SRS](../SRS.md), [AIU-LEGAL-001](AIU-LEGAL-001-US-LEGAL-TERMINOLOGY-REGISTER.md), [AIU-LEGAL-002](AIU-LEGAL-002-LEGAL-APPLICABILITY-MATRIX.md), and [ADR-007](../adr/ADR-007-ai-provider-governance.md).  
**Authority boundary:** Legal analysis does not authenticate, authorize, grant privileges, sign an agreement, or determine statutory compliance.

## Purpose and rules

This crosswalk maps actual SRS requirement IDs to the **legal research items to consider** during requirements review, threat modeling, and verification.

- A mapping is **not** a determination that a statute applies to the feature.
- The SRS is a requirements document, not proof of current implementation or testing.
- A `LEG-xx` item is sourced from AIU-LEGAL-002; a `FR-x.y` identifier is from the existing SRS.
- `RESEARCH`, `DESIGN`, `TEST`, `LEGAL_REVIEW`, and `OWNER_APPROVAL` are distinct gates; automated checks may never substitute for a lawyer's legal opinion.
- No user prompt, model output, AI agent or other generated text may grant foundational authority.

## Requirement crosswalk

| SRS ID | Existing requirement | Legal research IDs | Proposed engineering acceptance criterion | Evidence / state |
|---|---|---|---|---|
| FR-1.1 | User enrollment | LEG-07, LEG-15, LEG-17 | Determine actual collected fields and applicable privacy duties; document age-related scope before release | DESIGN; legal applicability NOT DETERMINED |
| FR-1.2 | Token authentication | LEG-03, LEG-04, LEG-07 | Token proves authentication/session state only; no acceptance of contract or authorization for unspecified protected action | DESIGN; targeted negative tests NOT EXECUTED |
| FR-1.3 | MFA | LEG-07, LEG-09 | Protect MFA secrets and recovery paths; never represent MFA as legally effective transaction consent without separate proof | DESIGN; coverage unverified |
| FR-1.4 | SSO/OIDC | LEG-07, LEG-15 | Validate identity-provider claims; privacy review for data transferred to third parties | PLANNED; provider review outstanding |
| FR-2.1 | RBAC | LEG-03, LEG-05, LEG-20 | Deny resource/action outside independently verified role and scoped grant; audit with principal, resource and decision | DESIGN; enforcement must be tested |
| FR-2.2 | Context policy | LEG-03, LEG-18, LEG-20 | Never infer legal authority from a device score or AI-generated rationale; policy version and decision auditable | DESIGN; test evidence pending |
| FR-2.3 | Quarantine | LEG-07, LEG-09, LEG-20 | Explain material quarantine consequences, preserve review/correction option where appropriate; fail closed on revoked grants | DESIGN; NOT EXECUTED |
| FR-3.1 | Device registration | LEG-05, LEG-07 | Collect only needed device signals; verify lawful user authorization and defined retention | DESIGN; data inventory pending |
| FR-3.2 | Trust scoring | LEG-05, LEG-09, LEG-18 | Demonstrate score computation without claiming vendor attestation or authorization based solely on posture | TEST PLAN; claims currently restricted |
| FR-3.3 | Hardware signal evaluation (target) | LEG-05, LEG-06, LEG-09 | Explicit authorization and vendor/technical evidence required; no unverified Knox/certification claims | PLANNED; no live integration established |
| FR-3.4 | Firmware baseline (target) | LEG-05, LEG-06 | Do not perform invasive research/device changes without authorized, scoped and safety-reviewed flow | BLOCKED for unsanctioned operations |
| FR-3.5 | Device revocation | LEG-05, LEG-07, LEG-20 | Revocation prevents future action even if previous signed token or cached context remains | TEST PLAN; concurrency test needed |
| FR-4.1 | Audit interception | LEG-07, LEG-20 | Independent protected event capture; deny AI-induced deletion, mutation or omission | DESIGN; tamper-proof status unverified |
| FR-4.2 | Audit fields | LEG-07, LEG-20 | Record user, action, outcome, timestamp, correlation ID while minimizing sensitive event payloads | DESIGN; schema mapping and validation pending |
| FR-4.3 | Anomaly alerts | LEG-07, LEG-09, LEG-18 | Avoid unsupported safety claims; preserve distinction between warning, enforcement decision and verified incident | DESIGN; thresholds not legally mandated |

## Cross-cutting controls not represented as discrete SRS FRs

| ID | Research issue | Engineering action | Pre-release gate |
|---|---|---|---|
| X-01 | LEG-01, LEG-02 — formation/management | Never describe proposed Acing Gen LLC as formed; maintain accurate founder/company IP ownership records | LEGAL_REVIEW + OWNER_APPROVAL |
| X-02 | LEG-11, LEG-12, LEG-13, LEG-14 — IP | Inventory source provenance, licenses, marks, contributors and written assignments; AI is not the inventor | LEGAL_REVIEW |
| X-03 | LEG-03, LEG-04 — electronic agents and electronic signatures | Keep separate `authentication`, `authorization`, `consent`, `e_signature` contracts and proof | DESIGN + LEGAL_REVIEW |
| X-04 | LEG-09 — consumer claims | Every displayed capability label must tie to documented evidence; distinguish VERIFIED IMPLEMENTED, EXPERIMENTAL, SIMULATED and PLANNED | TEST + OWNER_APPROVAL |
| X-05 | LEG-10 — subscriptions | No recurring billing until disclosures/cancellation/privacy/tax analysis are reviewed | LEGAL_REVIEW + OWNER_APPROVAL |
| X-06 | LEG-15, LEG-16, LEG-17 — privacy and automated decisions | Determine actual jurisdiction, consumer and product scope before claiming a right or obligation | LEGAL_REVIEW |
| X-07 | LEG-18 — NIST AI RMF | Treat NIST as a voluntary governance reference, not certification or legally compulsory text | DESIGN + TEST |
| X-08 | LEG-19 — accessibility | Review applicable obligations and create accessible acceptance tests | DESIGN + LEGAL_REVIEW |
| X-09 | LEG-20 — evidence | Record immutable-protection expectations separately from actual audit verification | TEST + OWNER_APPROVAL |
| X-10 | PR #256 — constitutional security boundary | AI can propose but cannot approve, sign, or deploy foundational policy changes; independent enforcement | SECURITY TEST + OWNER_APPROVAL |

## Proposed interface contracts (not implemented)

Use distinct types to avoid conflating legal consent and software authorization:

- `AuthenticationContext`: `subject_id`, `session_id`, `assurance`, `expires_at`; does **not** imply approval.
- `AuthorizationDecision`: `principal_id`, `resource_id`, `action`, `policy_version`, `grant_id`, `result`, `reason_code`, `evaluated_at`; enforcement-only.
- `ActionApproval`: `approver_id`, `proposal_hash`, `scope`, `expires_at`, `revocation_epoch`, `approval_method`; verified independently and not self-created by AI.
- `TransactionConsentEvidence`: `consenting_party`, `specific_terms_version`, `purpose`, `captured_at`, `method`, `jurisdiction_review_id`; only if applicable legal requirements have been separately assessed.
- `ElectronicSignatureEvidence`: `signer_attribution`, `signed_record_digest`, `intent_evidence`, `capture_method`; technical attributes alone do not establish enforceability.
- `LegalApplicabilityDecision`: `legal_id`, `jurisdiction`, `coverage_facts`, `statute_section`, `as_of_date`, `determination`, `reviewer`, `approval_reference`; informational for legal review, not a runtime permission token.

These fields are suggested design contracts. The actual codebase may use different names, storage, schemas and cryptography after architecture and security review.

## Required negative cases for future tests

1. Valid login + missing action approval => deny and audit.
2. Device posture marked trusted + no permission => deny.
3. AI-generated consent or signature without attribution and intent => cannot satisfy transaction approval.
4. Revoked or expired approval => deny even if earlier request succeeded.
5. Changed action scope or mismatched proposal hash => deny.
6. AI-proposed policy update => no production write or promotion using agent identity.
7. Claim of implementation without recorded evidence => render `PLANNED` or `SIMULATED`, not verified.
8. Missing legal applicability determination for covered launch scenario => block that launch gate, not all unrelated internal research.
9. Third-party code with missing license provenance => withhold release artifact pending review.
10. Incomplete breach/data inventory => no assertion of privacy compliance.

**Test status:** NOT EXECUTED. The cases above are acceptance criteria, not passing test results.

## Transition plan and governance

1. Keep this as a documentation-only change during the stabilization freeze.
2. Resolve accuracy and coverage of source legal registers under PR #257.
3. Review PR #256 separately for the security architecture; do not silently merge its proposed policy with legal obligations.
4. Inventory actual implementations and tests for mapped SRS IDs. Confirm what is a target, simulator, or real enforcement.
5. Propose focused follow-up contracts/tests through separate PRs after the owner approves scope and stabilization exit.
6. Apply a legal reviewer sign-off before any registration, contract template used with customers, material legal commitment or regulated launch.
7. Preserve human authority for any protected merge, deployment, contract execution or legal filing.

**Current conclusion:** crosswalk PROPOSED; runtime legal enforcement UNSUPPORTED by this documentation alone; independent legal review BLOCKED; existing security posture unchanged.
