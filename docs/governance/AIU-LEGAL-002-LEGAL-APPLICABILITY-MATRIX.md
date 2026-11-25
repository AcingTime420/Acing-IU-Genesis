# AIU-LEGAL-002 — Legal Applicability and Engineering Control Matrix

**Project:** Acing IU: Genesis  
**Date checked:** 2026-11-24  
**Status:** PROPOSED / IMPLEMENTATION NOT VERIFIED / COUNSEL REVIEW REQUIRED  
**Associated source register:** [AIU-LEGAL-001](AIU-LEGAL-001-US-LEGAL-TERMINOLOGY-REGISTER.md)

## Purpose

Connect legal terms to **specific Genesis features** so they inform architecture, tests, claims, documentation and release reviews as each feature is built. This is a triage matrix, not a conclusion that Genesis presently meets any legal requirement. The planned entity Acing Gen LLC is **not formed**.

**Classification rules**

- `REVIEW_NOW`: directly relevant to present proposed business or design; examine before a legally consequential commitment.
- `CONDITIONAL`: evaluate if the actual product scope, jurisdiction, covered relationship, data, age group, or conduct meets statutory conditions.
- `FUTURE`: no claim current functionality exists; examine before introducing the feature.
- `NOT_DETERMINED`: relevant facts are missing; no operational compliance claim.
- `BLOCKED`: do not ship a related regulated or protected workflow until requirements, tests and approvals are established.

## Actual/research scope

The canonical repository contains `docs/adr/ADR-004-zero-trust-security-baseline.md`, `ADR-005-data-and-audit-boundaries.md`, `ADR-007-ai-provider-governance.md`, `ADR-008-release-provenance-and-recovery.md`, and the active `docs/governance/STABILIZATION_POLICY.md`. Proposed AI boundary design is in draft PR #256. No legal source review overrides those engineering controls or authorizes implementation.

## Applicability matrix

| ID | Domain | Source | Genesis trigger | Current applicability | Required control or evidence | Ownership / gate |
|---|---|---|---|---|---|---|
| LEG-01 | Entity formation | [NRS Chapter 86](https://www.leg.state.nv.us/NRS/NRS-086.html) | Form Acing Gen LLC | REVIEW_NOW; not registered | Name clearance, formation filing, registered agent, operating agreement and filing receipts | Owner/counsel; governance |
| LEG-02 | Ownership | [NRS § 86.286](https://www.leg.state.nv.us/NRS/NRS-086.html) | Define member, manager and reserved powers | REVIEW_NOW | Signed company documents, management authority and actual member records | Owner/counsel |
| LEG-03 | AI/electronic agents | [NRS § 719.080](https://www.leg.state.nv.us/NRS/NRS-719.html) | AI operates in electronic transactions | CONDITIONAL | Define transaction roles, attribution, permitted acts, intervention and error correction | Architecture/counsel |
| LEG-04 | E-signatures | [15 USC § 7001](https://uscode.house.gov/us/usc/119-124/t15/s7001/) | Digital acceptance, electronic signatures | CONDITIONAL | Signature intent, association, required consumer consent/disclosures and retention where applicable | Interfaces/legal |
| LEG-05 | Cybersecurity research | [18 USC § 1030](https://uscode.house.gov/us/usc/119-134/t18/s1030/) | Device/host/security testing | REVIEW_NOW | Explicit authorization, scope, owner consent, non-invasive lab constraints and revocation | Device/Security |
| LEG-06 | Anti-circumvention | [17 USC Chapter 12](https://www.copyright.gov/title17/92chap12.html) | DRM/device firmware/reverse engineering experiments | CONDITIONAL / BLOCKED for non-authorized target work | Counsel assessment of applicable exceptions, ownership and licenses; avoid operational bypass claims | Device/counsel |
| LEG-07 | Security & personal information | [NRS Chapter 603A](https://www.leg.state.nv.us/NRS/NRS-603A.html) | Collect user accounts/device telemetry or regulated data | CONDITIONAL | Data inventory, role mapping, technical safeguards, retention and incident plan | Foundation/privacy |
| LEG-08 | Nevada consumer health data | [NRS §§ 603A.400–.550](https://www.leg.state.nv.us/NRS/NRS-603A.html) | Collect qualifying consumer health data | FUTURE / BLOCKED until evaluated | Data-category screening; privacy notice, consent and processor obligations if covered | Privacy/counsel |
| LEG-09 | Federal consumer protection | [FTC data security guidance](https://www.ftc.gov/business-guidance/resources/start-security-guide-business) | Sell or advertise Genesis capabilities | REVIEW_NOW | Claim-to-evidence gate; never present SIMULATED as VERIFIED; security and privacy claims substantiated | Product/QA/legal |
| LEG-10 | Subscription billing | [FTC Feb. 12, 2026 rule](https://www.govinfo.gov/content/pkg/FR-2026-02-12/html/2026-02866.htm) | Offer recurring charges | FUTURE | Validate current FTC text plus applicable state automatic renewal, disclosures, cancellation and refunds | Commerce/counsel |
| LEG-11 | Copyright ownership | [Copyright Office AI study](https://www.copyright.gov/ai/) | Generated code, documentation, UI | REVIEW_NOW | Track human authorship, generated assets, dependency licensing and third-party code origin | IP/legal |
| LEG-12 | Patents/inventorship | [USPTO revised AI inventorship guidance](https://www.uspto.gov/subscription-center/2025/revised-inventorship-guidance-ai-assisted-inventions) | Invention or patent application | FUTURE | Human inventor analysis, dated disclosure/invention records, prior-art assessment | IP/counsel |
| LEG-13 | Branding/trademarks | [USPTO trademark process](https://www.uspto.gov/trademarks/basics/trademark-process) | Use Genesis/Acing Gen publicly | REVIEW_NOW | Search similar marks, maintain use evidence, do not claim registered trademark until proven | IP/counsel |
| LEG-14 | Trade secrets | [18 USC § 1836](https://uscode.house.gov/us/usc/t18/s1836/) | Private source, keys, confidential research | REVIEW_NOW | Secrecy classification, access control, contributor agreements; public repository content not automatically secret | IP/Security |
| LEG-15 | California privacy | [CPPA FAQ](https://www.cppa.ca.gov/faq.html) | Covered California residents and statutory business thresholds | CONDITIONAL | Coverage assessment, privacy rights, retention, contract and vendor obligations | Privacy/counsel |
| LEG-16 | California automated decisions | [CPPA ADMT FAQ](https://www.cppa.ca.gov/faq.html) | Covered significant decisions using ADMT | FUTURE | Determine coverage; specified requirements start Jan. 1, 2027 for covered businesses | Intelligence/legal |
| LEG-17 | Children's privacy | [FTC COPPA amendments](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data) | Child-directed service or actual knowledge of covered under-13 information | CONDITIONAL | Age/use-case review; apply notice, consent, deletion and security duties if covered | Product/privacy |
| LEG-18 | AI risk management | [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) | Build AI agents or model adapters | REVIEW_NOW (voluntary framework) | Govern/Map/Measure/Manage risks, prompt-injection tests and independent approval; **not** a certification | AI/Security |
| LEG-19 | Service accessibility | [ADA.gov](https://www.ada.gov/) | Public interface/service meets legal coverage | CONDITIONAL | Evaluate applicable accessibility requirements, test usability and accommodations | Interfaces/legal |
| LEG-20 | Audit/evidence | [ADR-005](../adr/ADR-005-data-and-audit-boundaries.md) | Record sensitive authorization/actions | REVIEW_NOW (project policy) | Provenance, append-only or tamper-evident logs, custody/retention procedures; no claim evidence is automatically admissible | Foundation/QA |

## Apply to current Genesis modules

| Module | Terms to use | Boundary and action | State |
|---|---|---|---|
| HumanAuthority | principal, scoped grant, approval, revocation, evidence | Approval must be externally validated and never generated solely by AI | Design principle; runtime evidence requires fresh tests |
| Identity | authentication, capacity, consent, electronic signature | Login does not by itself mean contractual acceptance or authority for actions | Contract/legal integration PLANNED |
| Policy/Guardian | independent enforcement, reserved authority, good faith | Technical default-deny policy; statutory analogy must not be advertised as legal immunity | Design / enforcement unverified |
| DeviceTrust | unauthorized access, permitted scope, disclosure | Device posture must never be equated with legal permission to act | Safety constraint |
| AI/Agents | electronic agent, delegation, actual authority, accountability | Proposal identity cannot sign, approve, self-promote or alter security foundation | PLANNED |
| Frontend | material claim, consumer notice, consent, accessibility | Render clear SIMULATED/PLANNED versus operational features | Needs audited claim-to-evidence tests |
| Database | personal information, data collector, retention, breach | Inventory data and validate actual jurisdictional definitions | NOT DETERMINED |
| CI/Release | provenance, separation of duties, authorization | Independent human-governed build/release and signed checks; audit bypass roles | Under review in draft PR #256 |
| SDK/Plugins | license, copyright, IP assignment, contribution terms | Validate dependency rights, contributor agreements and third-party tool scopes | FUTURE |
| Payments | recurring subscriptions, negative option, refunds | **Do not enable commerce** before billing disclosures, cancellation rules, taxation and processor contracts reviewed | FUTURE |
| Authorized Device Lab | CFAA, DMCA, user authorization, chain of custody | No nonconsensual device access or unsafe firmware experiments | PLANNED |

## Release legality and claim gate

A feature may only advance from experimental/proposed states when its release record answers:

1. **Jurisdiction:** Which US states, customer groups, and federal statutes might apply?
2. **Role:** Is the system acting as vendor, service provider, processor, electronic agent, licensee, or independent product?
3. **Authority:** Who approved the operation, and which independently enforced grant was used?
4. **Data:** What personal, protected or confidential information is handled, and under which documented retention/consent rules?
5. **IP:** Who contributed code and assets, under what licenses and valid transfers, and where is evidence?
6. **Claim:** Which public marketing statements are substantiated by actual tests? Are simulations labeled?
7. **Adversarial verification:** Are privilege escalation, authorization bypass, and revoked-grant negative tests recorded?
8. **Legal review:** Was counsel consulted where the feature creates binding legal commitments, regulated activity or ambiguous obligations?
9. **Owner approval:** Has an authorized human approved the exact release and scope?
10. **Evidence:** Does the release link its specific commit, tests, SBOM/licensing, compliance notes, reviewer and approval?

**Fail closed:** If a required legal determination or independent authorization is missing, classify as `BLOCKED` rather than infer permission or compliance.

## Immediate practical legal checklist

- **Entity:** confirm name availability and obtain professional advice on LLC management/ownership, operating agreement, taxation and registration. No filing has occurred through this workflow.
- **IP:** inventory who authored and contributed source and docs, license obligations, and actual assignment instruments; do not assume an unformed LLC automatically owns founder assets.
- **Brand:** research federal/state marks before assuming `Genesis` or `Acing Gen` is cleared.
- **Privacy:** inventory data before making privacy rights promises or choosing a processor.
- **AI:** preserve independent human authority and no self-modifying protected foundation; coordinate with draft PR #256.
- **Repository:** maintain stabilization policy. No direct master push or policy bypass is authorized.
- **Counsel:** review business formation, contracts, privacy notices, copyright assignments, security research and commercial launch conditions.

## Traceability and maintenance

Each future applicability decision must include: `legal_id`, `feature_id`, `jurisdiction`, `source_url`, `section`, `as_of_date`, `effective_date_if_known`, `coverage_facts`, `determination`, `assignee`, `lawyer_review`, `technical_tests`, `approval_reference`, `next_review_date`.

Do not silently promote `CONDITIONAL`, `FUTURE`, or `NOT_DETERMINED` to `COMPLIANT`. Current status reflects research only.
