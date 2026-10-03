# Genesis Human Trust Charter

**Status:** Proposed binding governance for the people-first trust layer  
**Date:** 2026-10-02  
**Project:** Acing IU: Genesis

## Purpose

Acing IU: Genesis is intended to make increasingly capable software and AI useful without making human authority, safety, privacy, accountability, or understanding optional.

This charter turns public questions about AI into engineering obligations.

Genesis SHALL NOT answer a trust question with marketing language alone. Every operational answer must follow this chain:

```text
human concern
→ requirement
→ threat / risk
→ architecture control
→ implementation
→ automated test or evaluation
→ recorded evidence
→ maturity classification
→ plain-language public answer
```

A broken link prevents the claim from being promoted to **Verified**.

## Foundational rule

> **People are the principal, not the product.**

For Genesis, that means:

- capability does not create authority;
- AI output is not evidence merely because it is fluent;
- consequential authority must be attributable;
- protected authority must be revocable;
- simulation must look like simulation;
- uncertainty and unfinished work must remain visible;
- safety and trust disclosures must be understandable without technical expertise;
- money, sponsorship, popularity, or model confidence do not override evidence or Owner Law.

## Human authority and current project principal

Within the current repository and Genesis governance model, **AcingTime420** is the recorded human project principal.

That statement has a deliberately narrow scope. Repository control and internal governance records do **not**, by themselves, adjudicate copyright assignments, trademarks, corporate title, contractual ownership, or other legal intellectual-property questions.

Genesis and delegated agents are non-human actors. They do not own themselves, promote themselves to principal, or gain project authority merely by being technically capable.

## Trust questions

The machine-readable source of truth is:

`config/genesis/human-trust-requirements.json`

It currently defines sixteen questions:

1. Who is ultimately in control: the human or Genesis?
2. Can Genesis give itself more power?
3. Can Genesis perform a high-risk action without the person knowing or approving it?
4. Can the person stop Genesis or revoke its authority?
5. How can a person know Genesis is not exaggerating what it can do?
6. How can a person know what Genesis actually did?
7. How does Genesis know who a person, device, or agent really is?
8. What personal information does Genesis use, where does it go, and can the person control it?
9. What happens if malicious instructions try to manipulate Genesis?
10. How can Genesis help establish authentic digital-content provenance?
11. What happens when an AI is wrong or confidently invents an answer?
12. Who is accountable when Genesis carries out a consequential decision?
13. How will Genesis detect and reduce harmful bias or unfair treatment?
14. Can a non-technical person understand what Genesis is doing and why?
15. Will Genesis be transparent about the resources AI consumes?
16. Who controls Genesis today?

These are not rhetorical questions. Each has a maturity state, current truth, risk, people impact, evidence, validation path, non-claims, and completion condition.

## Maturity and public claims

Genesis uses the following trust maturity labels:

| Label | Meaning |
|---|---|
| **Verified** | Current implementation plus reproducible evidence demonstrates the complete claim within its stated scope. |
| **Tested** | Relevant implementation and automated validation exist, but the broader end-to-end claim is not fully verified. |
| **Implemented** | The control or governance rule exists, but current automated evidence does not prove the complete public claim. |
| **Target** | Required architecture or behavior is defined but not sufficiently implemented and evidenced. |
| **Not available** | The capability is intentionally unavailable until its required safety and evidence gates pass. |

A future public Trust Center may simplify those labels visually, but it must not change their meaning.

## Public answer rule

Every public answer to a Genesis trust question SHALL contain, directly or through an expandable detail view:

1. **Plain-language answer** — what a non-technical person needs to know.
2. **Current truth** — what is actually implemented today.
3. **Maturity** — Verified, Tested, Implemented, Target, or Not available.
4. **Evidence** — what source, test, workflow, review, or external assessment supports the claim.
5. **Limit / non-claim** — what Genesis is explicitly not claiming.
6. **Completion condition** — what must become true for the next maturity promotion.

No public trust status may be silently upgraded because a feature exists in source code.

## Human Sovereignty

For protected L5 actions, the intended final model is:

```text
exact protected action
→ action digest
→ fresh challenge / nonce
→ strong human authentication
→ recognized approval device
→ policy and governance digest binding
→ trusted verification
→ execution authorization
→ attributable receipt
→ audit record
```

Until a trusted verifier and its negative tests exist, L5 Human Sovereignty remains **Target / blocked**, not simulated approval.

Raw biometric templates are not Genesis credentials. Biometrics, where used by a WebAuthn authenticator, remain inside the authenticator's security boundary.

## Authority is separate from intelligence

Genesis SHALL maintain these distinctions:

```text
Can the system reason about the action?  ≠  Is it allowed to perform it?
Can it call the tool?                    ≠  Does it have authority to use it?
Did a model recommend it?                ≠  Did a human approve it?
Did a request parse successfully?        ≠  Was authorization verified?
Did the operation succeed?               ≠  Was the operation legitimate?
```

## Evidence and model reliability

Model output SHALL be treated as a claim or inference unless it is grounded in evidence appropriate to the use case.

Genesis SHOULD expose distinctions such as:

- source-derived fact;
- validated system evidence;
- model inference;
- uncertainty;
- unsupported or unavailable information.

Genesis SHALL NOT advertise any model as incapable of hallucination.

Model-dependent capabilities require defined evaluation sets and measurable acceptance criteria before they can become Verified.

## Privacy and data dignity

Genesis SHOULD make the following understandable to the affected person:

- what data is collected;
- why it is collected;
- where it is stored;
- which service or model receives it;
- whether it leaves the local environment;
- retention duration;
- deletion behavior;
- who can access it;
- whether external providers may use it for training or service improvement, when that can be established;
- how consent or authorization can be revoked.

A privacy statement is not a substitute for technical enforcement.

## Prompt injection and untrusted information

Untrusted text, webpages, retrieved documents, messages, model output, and tool output are **information**, not authority.

They SHALL NOT be able to:

- create or widen credentials;
- change protected policy;
- satisfy a Human Sovereignty Gate;
- silently expand tool scope;
- convert a denial into authorization;
- disable required audit or provenance;
- change Owner Law.

Future agentic runtimes require adversarial tests covering these boundaries.

## Provenance

For digital media and generated content, Genesis SHOULD prefer verifiable provenance over unsupported detection claims.

Where supported, Genesis may align with standards such as C2PA Content Credentials.

Genesis SHALL distinguish:

- verified provenance;
- declared provenance;
- missing or unknown provenance;
- heuristic detection.

Unknown provenance does not prove that content is fake, and generated appearance does not prove origin.

## Fairness and affected people

A statement that an AI is simply "unbiased" is not acceptable evidence.

Consequential AI use cases should identify:

- affected populations;
- foreseeable harms;
- relevant fairness criteria;
- evaluation data and limitations;
- unacceptable disparity thresholds where appropriate;
- human review, correction, or appeal routes.

## Understandability and accessibility

A security control a person cannot understand may provide weak practical consent.

Before high-consequence consumer workflows are promoted to Verified, Genesis SHOULD conduct representative usability testing with non-technical participants.

The participant should be able to correctly answer:

- What is about to happen?
- What information will be used?
- Who or what requested the action?
- Why is it allowed or denied?
- Can I decline?
- Can I revoke it later?
- Where can I see what happened?

Accessibility is part of trustworthiness, not cosmetic polish.

## Resource responsibility

Agentic workflows SHOULD be bounded.

Where meaningful, Genesis should make visible:

- model/provider calls;
- loop limits;
- task budgets;
- cost or quota use;
- local versus remote execution;
- resource usage appropriate to the deployment.

Ordinary deterministic software should be preferred when it can safely and reliably solve the task without AI.

## People-first commercialization

Monetization must not invert the trust model.

Genesis SHOULD follow these commercial constraints:

1. **Trust status stays public.** Core capability maturity, major limitations, security advisories, and trust evidence must not require payment.
2. **Safety is not a premium feature.** A person should not have to pay to receive truthful security state or required safety warnings.
3. **Sponsors cannot buy authority.** Sponsorship cannot purchase Owner Law changes, L5 approval, security exceptions, false capability promotion, or access to private user data.
4. **Sponsor influence is disclosed.** Material sponsor involvement in testing, research, content, or product direction should be identified.
5. **No hidden sale of people.** Genesis should not make undisclosed sale of personal data the business model.
6. **Consumer affordability matters.** Future pricing should preserve an understandable, useful entry path for ordinary people while professional and enterprise offerings may fund higher-cost development.
7. **Plain-language understanding remains free.** People should be able to learn what Genesis is, what it can do, what it cannot do, and how it uses authority without buying a product.
8. **Evidence cannot be purchased.** A paid customer, investor, or sponsor does not change a maturity label without the same required proof.

## External alignment

Genesis currently uses the following as external reference points:

- NIST AI Risk Management Framework;
- NIST AI RMF Generative AI Profile (NIST AI 600-1);
- NIST NCCoE Software and AI Agent Identity and Authorization work;
- NIST TEVV-Athlon evaluation framework;
- W3C Web Authentication Level 3;
- OWASP Top 10 for LLM and Generative AI Applications;
- C2PA Content Credentials specifications.

These references inform requirements and testing. **Alignment is not certification, regulatory compliance, or third-party endorsement.**

## Change control

A trust question may be changed only through reviewable repository change.

A maturity promotion to Verified must include:

- implementation evidence;
- current automated validation;
- explicit scope;
- known limitations;
- no contradictory Capability Register entry;
- review of the public answer;
- any required independent assessment for the claim being made.

If later evidence contradicts a Verified claim, Genesis SHALL downgrade the claim rather than preserve the label for appearance.

## Enforcement

The repository gate is:

`scripts/check-genesis-human-trust.py`

and its GitHub Actions workflow is:

`.github/workflows/genesis-human-trust.yml`

The gate checks structural integrity and evidence references. It does **not** prove all runtime behavior by itself.

## Core statement

> **Genesis should earn trust in public, under rules that remain understandable to the people whose lives and technology it may affect.**
