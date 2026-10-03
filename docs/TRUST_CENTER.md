# Acing IU: Genesis Trust Center

> **Security by Foundation. Personal by Choice. Engineered for Trust.**

This page is the plain-language entry point for understanding what Genesis can prove today, what is still being built, and what it refuses to pretend is finished.

## The short answer

Genesis is a security-first, human-sovereign platform being designed so increasingly capable AI and automation can help people **without automatically gaining authority over them**.

The rule is simple:

> **Capability is not authority. Intelligence is not permission. Trust is earned through evidence.**

## Current trust snapshot

The machine-readable source of truth is `config/genesis/human-trust-requirements.json`.

| Public question | Current maturity |
|---|---|
| Who is ultimately in control? | **Implemented** — human-sovereignty governance exists; cryptographic L5 enforcement is still a Target |
| Can Genesis give itself more power? | **Implemented** — no-self-escalation is binding governance; full runtime enforcement remains to be proven |
| Can a high-risk action happen without fresh human approval? | **Target** |
| Can authority be stopped or revoked? | **Target** |
| Does Genesis have to prove its capability claims? | **Tested** |
| Can actions be audited? | **Tested** within the current database/runtime-role scope |
| Are identity and device trust separated from authorization? | **Implemented** |
| Is personal-data use completely visible and enforceable? | **Target** |
| Is prompt-injection/tool-abuse resistance verified? | **Target** |
| Is digital-content provenance implemented? | **Target** |
| Does Genesis treat model output as evidence automatically? | **Implemented rule: no**; model-quality TEVV remains future work |
| Is consequential accountability designed into the system? | **Implemented architecture**; signed end-to-end receipts remain a Target |
| Is harmful-bias evaluation complete? | **Target** |
| Has non-technical usability been independently validated? | **Target** |
| Is AI resource use measured and bounded across the platform? | **Target** |
| Who controls the project today? | **AcingTime420 is the current repository/project governance principal**; that statement is not, by itself, a legal IP-title determination |

## What Genesis can currently point to

Current repository evidence includes:

- a Capability Register that separates Implemented, Tested, Verified, Simulator, Target, Not available, and External dependency;
- CI claim-surface checks intended to stop unsupported operational claims;
- canonical Identity and DeviceTrust services;
- DeviceTrust ownership authorization tests, including PostgreSQL integration/race coverage;
- a canonical database audit ledger with runtime-role privilege tests;
- Owner Law and the Genesis Constitution;
- a fail-closed L5 authorization design that does **not** treat chat text or JSON as valid human approval;
- machine-readable Human Trust Requirements and an automated evidence-reference gate.

Those items support specific scopes. They do not make the whole platform "certified," "production safe," or "fully verified."

## What Genesis still has to earn

Among the major trust capabilities still requiring implementation and evidence are:

- real WebAuthn-based Human Sovereignty verification;
- trusted approval-device enrollment and revocation;
- replay-resistant action authorization;
- signed authorization receipts;
- comprehensive agent identity;
- complete external AI-provider data-egress controls;
- adversarial prompt-injection and tool-abuse testing;
- C2PA or equivalent provenance implementation;
- systematic model factuality/grounding/abstention evaluations;
- fairness and harmful-bias evaluations for consequential use cases;
- non-technical usability/accessibility studies;
- bounded agent budgets and meaningful compute/resource reporting;
- independent security assessment appropriate to the release scope.

## How Genesis answers a trust question

Genesis does not treat a marketing sentence as proof.

```text
Question
  ↓
Risk
  ↓
Requirement
  ↓
Architecture control
  ↓
Implementation
  ↓
Test / evaluation
  ↓
Recorded evidence
  ↓
Maturity label
  ↓
Plain-language answer
```

If that chain breaks, the public claim must stay below Verified.

## About standards

Genesis uses established work from NIST, W3C, OWASP and C2PA as reference points for risk management, agent identity/authorization, strong human authentication, AI application security, evaluation and provenance.

That means **alignment and engineering input**.

It does **not** mean those organizations certify, endorse, or approve Genesis.

## For non-technical users

You should never need to understand cryptography or source code just to answer:

- What is Genesis trying to do?
- What is it allowed to do?
- What information will it use?
- Who authorized the action?
- Can I say no?
- Can I revoke permission?
- What happened afterward?
- What is proven versus still being built?

The technical evidence should be available for people who want to inspect it, while the important answer remains understandable without it.

## For sponsors and commercial partners

Money does not purchase trust.

Sponsors may support research, infrastructure, independent review, accessibility, hardware, education, or engineering.

Sponsors do not purchase:

- Human Sovereignty approval;
- private user data;
- security-policy exceptions;
- Owner Law changes;
- false maturity promotion;
- suppression of security findings.

Material sponsorship that affects Genesis research, testing, or product direction should be disclosed.

## People-first promise

The long-term goal is not to make people trust Genesis because Genesis tells them to.

The goal is to make the system provide enough evidence, limits, controls, and understandable explanations that a person can decide **for themselves** whether a specific Genesis capability has earned their trust.
