# AIU-LEGAL-001 — U.S. Legal Terminology and Authority Register

**Project:** Acing IU: Genesis  
**Research date:** 2026-11-24  
**Status:** PROPOSED / LEGAL REVIEW REQUIRED  
**Scope:** US federal and Nevada sources; California as a conditional cross-state deployment example  
**Owner entity:** Acing Gen LLC is proposed and **not yet registered**. Do not describe it as an existing legal person.

## Rules for use

1. This register is engineering/legal research and **not a legal opinion, attorney review, legal filing, company operating agreement, or customer contract**.
2. Every term below is classified **STATUTE**, **LEGAL DOCTRINE**, **CONTRACT TERM**, **NONBINDING STANDARD**, or **GENESIS POLICY TERM**. An operational analogy is not equivalent to legal effect.
3. Legal applicability requires mapping the actual feature, persons, data types, jurisdiction, transactions, and statutory exemptions. `APPLICABILITY_REVIEW` is the default; no legal compliance claim may be inferred from documenting a term.
4. Cross-state residents, minors, regulated health/financial use cases, employment uses, security research, and commerce may trigger additional rules that must be researched before feature activation.
5. Legal sources change. Record exact statute section, effective date, reviewer, link, and product feature when promoting a proposal into a binding artifact.
6. No autonomous agent, prompt, documentation statement, or generated license can confer authority beyond independently enforced human approval and applicable law.
7. No Genesis internal `Constitution`, `Sovereignty`, `Covenant`, or `Jurisdiction` terminology claims governmental status, legal immunity, legal personhood for AI, or exemption from law.

## Source catalog (primary governmental sources)

| ID | Source | Relevance |
|---|---|---|
| NV86 | [Nevada Revised Statutes, Chapter 86](https://www.leg.state.nv.us/NRS/NRS-086.html) | LLC formation, management, members, operating agreements |
| NV719 | [Nevada Revised Statutes, Chapter 719](https://www.leg.state.nv.us/NRS/NRS-719.html) | Electronic records, automated transactions, electronic agents |
| NV603A | [Nevada Revised Statutes, Chapter 603A](https://www.leg.state.nv.us/NRS/NRS-603A.html) | Personal information, online privacy, consumer health data |
| ESIGN | [15 USC § 7001](https://uscode.house.gov/us/usc/119-124/t15/s7001/) | Electronic transactions and signatures |
| CFAA | [18 USC § 1030](https://uscode.house.gov/us/usc/119-134/t18/s1030/) | Computer access and authorization |
| DTSA | [18 USC § 1836](https://uscode.house.gov/us/usc/t18/s1836/) | Civil action for trade secret misappropriation |
| DMCA | [U.S. Copyright Office, 17 USC Chapter 12](https://www.copyright.gov/title17/92chap12.html) | Circumvention/security research; exemptions are limited |
| COPYRIGHTAI | [U.S. Copyright Office AI Report Part 2](https://www.copyright.gov/ai/) | Human authorship and AI outputs |
| INVENTOR | [USPTO revised AI-assisted inventorship guidance (2025)](https://www.uspto.gov/subscription-center/2025/revised-inventorship-guidance-ai-assisted-inventions) | Human inventors; ordinary inventorship standard |
| MARK | [USPTO trademark process](https://www.uspto.gov/trademarks/basics/trademark-process) | Brand/mark distinction and searches |
| FTCSEC | [FTC Start with Security](https://www.ftc.gov/business-guidance/resources/start-security-guide-business) | Consumer-protection security guidance |
| SUBS | [Federal Register February 12, 2026, FTC negative-option rule revision](https://www.govinfo.gov/content/pkg/FR-2026-02-12/html/2026-02866.htm) | Status of 2024 amended negative-option rule |
| CPPA | [California Privacy Protection Agency FAQ](https://www.cppa.ca.gov/faq.html) | Conditional CCPA/ADMT obligations |
| NISTAI | [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) | Voluntary AI governance, not itself law |
| COPPA | [FTC amended Children's Online Privacy Protection Rule guidance](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data) | Conditional covered children's data practices |

## Controlled vocabulary — legal terms

| Term | Class | Concise scope and correct Genesis usage | Authority |
|---|---|---|---|
| Legal entity | STATUTE | An entity formed under applicable law; Acing Gen LLC is not yet formed | NV86 |
| Articles of organization | STATUTE | Nevada LLC formation filing, not a technical project charter | NV86 § 86.161 |
| Operating agreement | STATUTE | LLC internal governance agreement; must be adopted as an actual agreement | NV86 § 86.286 |
| Member | STATUTE | LLC member under Nevada law, not every interface user | NV86 |
| Manager | STATUTE | Person designated to manage an LLC under Nevada law | NV86 |
| Membership interest | STATUTE | Legal LLC ownership interest, not an app subscription | NV86 |
| Registered agent | STATUTE | Designated person/entity for service of process; not an AI agent | NV86 |
| Reserved powers | CONTRACT TERM | Management decisions explicitly reserved in adopted governance documents | NV86 § 86.286 |
| Fiduciary duty | LEGAL DOCTRINE | Duties depend on role, agreement, and governing law; do not imply universal AI fiduciary status | NV86 § 86.298 |
| Good faith and fair dealing | LEGAL DOCTRINE | The implied covenant has legal significance in Nevada operating agreements | NV86 § 86.286 |
| Principal | LEGAL DOCTRINE | Natural person or entity in a legally established principal/agent relationship | Agency law; contextual |
| Agent | LEGAL DOCTRINE | Legal agency differs from a product software-agent label | Agency law; contextual |
| Electronic agent | STATUTE | Nevada-defined automated means for initiating/responding to electronic records | NV719 § 719.080 |
| Automated transaction | STATUTE | Statutory concept involving electronic agents and other parties | NV719 § 719.040, § 719.310 |
| Electronic record | STATUTE | Record created/stored/communicated electronically under covered transactions | NV719 |
| Electronic signature | STATUTE | Electronic sound, symbol, or process with required association/intent; not every token | NV719; ESIGN |
| Consent | LEGAL DOCTRINE | Context-specific legally effective agreement; authentication alone is insufficient | NV719; ESIGN |
| Actual authority | LEGAL DOCTRINE | Authority intentionally granted; map to independently verified grants | Agency law; contextual |
| Apparent authority | LEGAL DOCTRINE | Third-party belief based on principal manifestations can create legal risk | Agency law; contextual |
| Ratification | LEGAL DOCTRINE | Subsequent adoption of an act under applicable law; **not** a permission to execute first | Agency law; contextual |
| Revocation | LEGAL DOCTRINE | Withdrawal of legally or technically granted authority where permitted | Agency law; contractual |
| Offer / acceptance | CONTRACT TERM | Elements of contract formation; neither is a security access token | NV719; ESIGN |
| Consideration | CONTRACT TERM | Value/exchange relevant to many contract formations, subject to exceptions | State contract law |
| Governing law | CONTRACT TERM | Chosen law subject to enforceability limits | State contract law |
| Forum selection | CONTRACT TERM | Dispute venue provision, not an internal technical jurisdiction | State/federal law |
| Arbitration | CONTRACT TERM | ADR mechanism, only under valid agreement and applicable protections | Federal/state law |
| Indemnification | CONTRACT TERM | Allocation of specified loss or defense obligations, subject to limits | Contract/statutory law |
| Limitation of liability | CONTRACT TERM | Restriction on particular damages where enforceable; cannot eliminate all duties | Contract/consumer law |
| Intellectual property assignment | CONTRACT TERM | Transfer requires valid conveyance and chain-of-title evidence | Federal/state IP law |
| Copyright | STATUTE | Protection of qualifying human-authored original expression | Title 17; COPYRIGHTAI |
| Trademark | STATUTE | Source identification for goods/services; state LLC name filing is not trademark clearance | MARK |
| Patent inventorship | STATUTE | Inventor must be a natural person; AI assistance does not change ordinary test | INVENTOR |
| Trade secret | STATUTE | Qualifying information deriving value from secrecy and protected by reasonable measures | DTSA; state law |
| License | CONTRACT TERM | Permission to use IP under specified terms; not necessarily ownership | Title 17; state contract law |
| Data collector | STATUTE | Nevada-defined role, distinct from informal GDPR terminology | NV603A |
| Personal information | STATUTE | Definition varies by law and section; perform data inventory before applying | NV603A |
| Consumer health data | STATUTE | Additional Nevada rights/restrictions may attach to covered collection | NV603A §§ 603A.400-603A.550 |
| Security breach | STATUTE | Statutory definition/notification requirements differ by context | NV603A |
| Data retention | CONTRACT TERM | Product policy commitment and potentially regulated requirement | NV603A; applicable sector law |
| Data minimization | NONBINDING STANDARD | Privacy/security principle; mandatory only where applicable law or agreement makes it so | FTCSEC; relevant privacy law |
| Unauthorized access | STATUTE | Statutory and contextual concept: technical capability is not authorization | CFAA |
| Exceeding authorized access | STATUTE | Specific CFAA statutory term, not interchangeable with any Terms-of-Service breach | CFAA |
| Circumvention | STATUTE | Anti-circumvention legal restrictions may apply even to owned devices; assess exemptions | DMCA |
| Chain of custody | LEGAL DOCTRINE | Evidentiary provenance process; software log by itself is not courtroom admissibility | Evidence law; contextual |
| Privilege | LEGAL DOCTRINE | Legal protections apply to qualifying communications; ordinary AI chats not automatically privileged | Evidence law; contextual |
| Nonrepudiation | NONBINDING STANDARD | Cryptographic attribution property, not an automatic proof of legal consent | Security engineering |
| Automated decisionmaking | STATUTE | Defined differently by covered privacy laws; conditional coverage | CPPA |
| Risk management | NONBINDING STANDARD | NIST AI RMF voluntary governance practice, not legal certification | NISTAI |
| Unfair/deceptive practices | STATUTE | Avoid unsupported claims of enforcement, certifications or production readiness | Federal Trade Commission Act, § 5 |
| Negative option | STATUTE | Subscription/continuity practices: FTC's 2024 amended rule was vacated; 2026 revised text applies with other laws | SUBS |
| Children's personal information | STATUTE | COPPA coverage depends on service type, knowledge and ages; obligations are conditional | COPPA |

## Genesis-created vocabulary — internal only

| Proposed internal term | Class | Enforceable design intent | Caveat |
|---|---|---|---|
| Genesis Platform Constitution | GENESIS POLICY TERM | Versioned priority order for architecture and product governance | Not a governmental constitution |
| Constitutional Security Boundary | GENESIS POLICY TERM | Separate adaptive code from protected security enforcement and signing | Requires independently verified OS/cloud authorization |
| Reserved Human Authority | GENESIS POLICY TERM | Human-only high-impact approvals, releases, permissions and policy changes | Does not define legally valid agency alone |
| Independent Enforcement Covenant | GENESIS POLICY TERM | Assurance objective for external authorization checks | Not a binding covenant unless separately agreed |
| Delegation Grant | GENESIS POLICY TERM | Verifiable action, principal, resource, purpose, expiry and revocation scope | Must not be inferred from prompt text |
| Adaptive Development Scope | GENESIS POLICY TERM | Allowlisted sandbox modification class with zero production privilege | Does not create legal IP rights |
| Evidence-backed Capability | GENESIS POLICY TERM | Feature claim tied to successful tests and stable evidence | No certification implication |
| Human Authority Appeal | GENESIS POLICY TERM | Voluntary process to review platform decisions | Not constitutional due process or judicial review |
| Policy Amendment | GENESIS POLICY TERM | Controlled alteration to the protected foundation by approved humans | Untrusted AI cannot authorize or execute it |
| IU (Interface User) | GENESIS POLICY TERM | Human user role within Genesis | Do not conflate with statutory LLC member or legal person |

## Source conflicts and change alerts

- Nevada NRS Chapter 86 identifies LLC-management powers; it does not by itself confirm Acing Gen LLC has been registered or that any founder IP has been assigned.
- Nevada NRS Chapter 719 recognizes an **electronic agent**; this does not confer legal personhood, an LLC membership interest, ownership of generated inventions, or blanket authority.
- USPTO revised AI-assisted inventorship guidance in late 2025; older interpretations based solely on the superseded 2024 guidance should be rechecked.
- FTC's **2024 amended** negative-option rule was vacated; February 12, 2026 final action conformed the federal rule text. Review state automatic-renewal law separately before billing.
- California automated decisionmaking rules have compliance dates that may apply to covered businesses in 2027; do **not** assume Nevada incorporation eliminates California requirements.
- Statutory source links are research references, not proof of applicability or legal compliance.

## Incorporation into Genesis engineering gates

| Gate | Applied terminology | Decision |
|---|---|---|
| Requirements | principal, consent, scope, legal applicability | Define relevant user/data/transaction |
| Architecture | reserved authority, trust domains, revocation | Independent AI and security identities |
| Security | unauthorized access, least privilege, data minimization | Deny without verifiable grant |
| Implementation | electronic agents, audit, consent, electronic signatures | Distinguish automated act from legal consent |
| Testing | authority, revocation, concurrent actions, privacy | Positive and negative evidence |
| Documentation | warranties, representations, registered marks | No misleading capability or legal claims |
| Review | chain of title, licensed dependencies, third-party contributions | Reviewer verifies licenses and ownership evidence |
| Release | warranty claims, regulatory applicability, records | Human approval; no unreviewed new legal obligation |
| Operations | breach, data retention, litigation hold | Incident, retention and lawful disclosure workflows |

## Change policy

- Keep this file as a **source-linked research register** until reviewed by qualified counsel.
- Legal counsel and an authorized project owner must approve external-facing contract terms, corporate documents, public legal compliance claims and material binding legal commitments.
- AI is permitted to research, cite and propose edits; it cannot sign a contract, create an LLC, assign IP, accept legal risk, bypass authorization, or self-publish a binding policy.
- Record every future change: controlling law, jurisdiction, effective date, implementation impact, reviewer, evidence URL, and approval ID.
