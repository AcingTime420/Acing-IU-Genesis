# Acing IU: Genesis Requirements Baseline

**Version:** 1.0  
**Recorded:** 2026-10-01  
**Status:** Project requirements baseline; implementation and compliance are not implied by inclusion here.  
**Relationship to capability truth:** `docs/CAPABILITY_REGISTER.md` remains the authoritative statement of what Genesis can currently prove.

## 1. Purpose

This document defines the security, assurance, privacy, reliability, accessibility, software-supply-chain, AI-governance, and privileged-operation requirements that Acing IU: Genesis adopts as engineering gates.

Genesis separates three things that must not be conflated:

1. **Project requirement** — a rule Genesis deliberately adopts for itself.
2. **Conditional external requirement** — a protocol, platform, contract, legal, certification, or ecosystem requirement that becomes normative only when it actually applies.
3. **Recommended reference** — guidance Genesis uses to shape implementation or verification; citing it does not mean Genesis is certified, compliant, or verified against it.

External standards do not become Genesis claims merely because they are referenced here.

## 2. Normative language

Within this document:

- **SHALL / SHALL NOT** — mandatory Genesis requirement once this baseline is merged.
- **SHOULD / SHOULD NOT** — strong default that requires a documented exception when not followed.
- **MAY** — permitted but not required.
- **P0** — foundational gate; should be satisfied before a capability is represented as production-ready.
- **P1** — required before broad public or production operation when applicable.
- **P2** — maturity or optimization requirement.

## 3. Evidence rule

A requirement is not satisfied merely because source code, documentation, a UI, a dependency, or a configuration file exists.

The minimum assurance chain is:

**requirement -> threat/risk -> architecture decision -> implementation -> automated validation -> recorded evidence -> capability classification -> public/operator claim**

A broken or missing link prevents promotion to **Verified**.

Evidence SHOULD identify:

- requirement ID;
- repository commit;
- affected component;
- test or validation procedure;
- result;
- date;
- evidence artifact location;
- reviewer or approving authority when required;
- known limitations and exceptions.

## 4. Source precedence

When sources conflict, use this order unless an ADR or owner decision explicitly overrides it:

1. current repository code and reproducible tests;
2. `docs/CAPABILITY_REGISTER.md`;
3. current governance documents and ADRs;
4. recorded validation evidence;
5. applicable external normative requirements;
6. current authoritative standards and vendor documentation;
7. approved architecture plans;
8. historical planning material;
9. brainstorming or speculative design notes.

## 5. Foundational Genesis requirements

| ID | Priority | Class | Requirement |
|---|---|---|---|
| GEN-ASSURANCE-001 | P0 | Project | Every material security or reliability claim SHALL trace to reproducible evidence at a recorded commit. |
| GEN-ASSURANCE-002 | P0 | Project | Capability maturity SHALL use the labels and evidence rules in `docs/CAPABILITY_REGISTER.md`; UI presence or source presence alone SHALL NOT promote maturity. |
| GEN-ASSURANCE-003 | P0 | Project | Simulator, fixture, target, planned, external-dependency, and unavailable states SHALL remain visibly distinguishable from operational capability. |
| GEN-AUTHORITY-001 | P0 | Project | A UI, AI model, client assertion, or presentation layer SHALL NOT create authorization or trust by itself. Authority SHALL originate from authenticated identity, policy, and server-side enforcement. |
| GEN-AUTHORITY-002 | P0 | Project | Security-sensitive operations SHALL fail closed on missing identity, policy, evidence, configuration, or dependency state. |
| GEN-TRUST-001 | P0 | Project | Device Trust SHALL report posture/evidence; Policy SHALL make authorization decisions. Trust scoring SHALL NOT silently become authorization logic. |
| GEN-GOV-001 | P0 | Project + reference | Genesis security governance SHALL cover Govern, Identify, Protect, Detect, Respond, and Recover activities and maintain owners for material security risks. |
| GEN-THREAT-001 | P0 | Project | Material architecture changes SHALL update threat assumptions, security boundaries, or the project threat model when they change attack surface. |
| GEN-EXCEPTION-001 | P0 | Project | Exceptions to P0 requirements SHALL be documented with scope, rationale, owner, expiry/review date, compensating controls, and evidence. |

## 6. Secure software development

| ID | Priority | Class | Requirement |
|---|---|---|---|
| GEN-SDLC-001 | P0 | Project + reference | Genesis SHALL use NIST SSDF 1.1 as the current final secure-development reference baseline. Draft SSDF 1.2 material MAY be tracked but SHALL NOT be represented as a finalized baseline until NIST finalizes it. |
| GEN-SDLC-002 | P0 | Project | Pull requests SHALL identify security-sensitive behavior changes, validation performed, known gaps, and claim-surface effects when applicable. |
| GEN-SDLC-003 | P0 | Project | Security-critical code paths SHALL receive automated tests appropriate to their boundary, including negative/denial behavior. |
| GEN-SDLC-004 | P1 | Project | Release evidence SHALL be reproducible from the reviewed source and locked dependency state. |

## 7. Web, API, and mobile verification

| ID | Priority | Class | Requirement |
|---|---|---|---|
| GEN-WEB-001 | P0 | Project + reference | Web/operator surfaces SHALL be designed and tested against applicable OWASP ASVS 5.0.0 requirements. Adoption of ASVS as a verification source does not imply ASVS certification. |
| GEN-API-001 | P0 | Project + reference | Every API operation that accesses a resource by identifier SHALL enforce server-side object-level authorization appropriate to the authenticated principal. |
| GEN-API-002 | P0 | Project | APIs SHALL enforce input validation, bounded payloads, pagination where needed, safe timeouts, resource limits, and denial behavior that does not disclose protected ownership or authorization state. |
| GEN-API-003 | P0 | Project | API inventory, version, authentication expectations, and deprecated endpoints SHALL be documented and testable. |
| GEN-MOBILE-001 | P0 | Project + reference | Android/mobile components SHALL use OWASP MASVS control groups and MASTG testing guidance as the mobile-security verification reference. |
| GEN-MOBILE-002 | P0 | Project | Mobile storage, cryptography, authentication, network communication, platform interaction, update behavior, privacy, and resilience requirements SHALL be assessed independently rather than inferred from backend security. |

## 8. Identity, authentication, and federation

| ID | Priority | Class | Requirement |
|---|---|---|---|
| GEN-IAM-001 | P0 | Project + reference | Identity architecture SHALL define assurance appropriate to account risk using NIST SP 800-63-4 concepts rather than treating all authentication as equivalent. |
| GEN-IAM-002 | P0 | Project | Privileged administration SHALL support a phishing-resistant authentication option before production administrative use. |
| GEN-IAM-003 | P0 | Project | Enrollment, authenticator replacement, recovery, reset, revocation, session termination, and account restoration SHALL have explicit audited lifecycle rules. |
| GEN-IAM-004 | P0 | Project | Authentication and authorization events SHALL be attributable without placing reusable secrets, recovery material, or sensitive tokens in logs. |
| GEN-OAUTH-001 | P0 when OAuth/OIDC exists | Conditional external | OAuth/OIDC implementations SHALL follow applicable RFC 9700 security requirements, including exact redirect URI matching and PKCE where required. Open redirectors SHALL NOT be used in authorization flows. |
| GEN-OAUTH-002 | P1 when federation exists | Conditional external | Federation provider metadata, issuer/audience validation, signing-key handling, redirect registration, token validation, and provider failure behavior SHALL have automated integration tests. |

## 9. Cryptography and key management

| ID | Priority | Class | Requirement |
|---|---|---|---|
| GEN-CRYPTO-001 | P0 | Project | Genesis SHALL maintain an inventory of security-relevant algorithms, protocols, certificates, key types, storage locations, owners, consumers, and planned deprecation dates. |
| GEN-CRYPTO-002 | P0 | Project + reference | Cryptographic dependencies SHALL be replaceable through documented crypto-agility boundaries; core application behavior SHOULD NOT depend on one hard-coded algorithm where replacement is foreseeable. |
| GEN-CRYPTO-003 | P0 | Project + reference | Key lifecycle controls SHALL cover generation, import, storage, access, rotation, revocation, backup/recovery where appropriate, archival, destruction, and compromise response. |
| GEN-CRYPTO-004 | P0 | Project | Secrets and private keys SHALL NOT be hardcoded in source, sample production configuration, images, or committed environment files. |
| GEN-PQC-001 | P1/Target | Project + reference | Post-quantum work SHALL use current standardized terminology such as ML-KEM (FIPS 203), ML-DSA (FIPS 204), and SLH-DSA (FIPS 205) when applicable. Historical Kyber/Dilithium terminology MAY be retained only with context. |
| GEN-PQC-002 | P1/Target | Project | Genesis SHALL NOT claim post-quantum protection, FIPS validation, or a FIPS security level without implementation evidence and the applicable external validation evidence. |

## 10. Updates, provenance, and software supply chain

| ID | Priority | Class | Requirement |
|---|---|---|---|
| GEN-UPDATE-001 | P0 before production updater | Project + reference | Update systems SHALL authenticate update metadata/artifacts, reject unauthorized or expired metadata, resist rollback/freeze/replay where applicable, and provide recovery from key or repository compromise. TUF MAY be used as a reference architecture. |
| GEN-SUPPLY-001 | P0 | Project + reference | Genesis SHALL track risk from direct and transitive dependencies, container bases, build tools, GitHub Actions, external services, AI providers, and other suppliers. |
| GEN-SBOM-001 | P0 | Project | Release candidates intended for distribution SHALL produce an SBOM from the reviewed dependency state and associate it with the release evidence. |
| GEN-PROV-001 | P1 | Project | Release provenance SHOULD identify source revision, build workflow, artifact digest, and relevant build inputs. SLSA and Sigstore/Cosign MAY be used as implementation references. |
| GEN-DEPEND-001 | P1 | Project | Material dependency admission SHALL consider maintenance status, security history, provenance, license, update policy, known vulnerabilities, and operational necessity. Automated reputation scores MAY inform but SHALL NOT replace engineering review. |
| GEN-VULN-001 | P0 | Project + reference | Vulnerability prioritization SHALL consider exploitability and known exploitation, not CVSS alone. CISA KEV SHOULD be used as an input where relevant. |

## 11. Vulnerability disclosure and incident response

| ID | Priority | Class | Requirement |
|---|---|---|---|
| GEN-VDP-001 | P1 before public production service | Project + reference | Public production services SHOULD publish an RFC 9116-compatible `/.well-known/security.txt` in addition to repository vulnerability-reporting instructions. |
| GEN-IR-001 | P0 | Project + reference | Incident response SHALL cover preparation, detection, triage, containment, investigation, evidence preservation, eradication/mitigation, recovery, communication, and lessons learned using NIST SP 800-61 Rev. 3 as a reference. |
| GEN-IR-002 | P0 | Project | Incident procedures SHALL identify who may disable credentials, rotate keys, revoke releases, restrict services, preserve evidence, restore service, and approve public communication. |
| GEN-IR-003 | P1 | Project | Security incidents and exercises SHALL produce post-incident actions with owners and closure evidence when systemic issues are found. |

## 12. Recovery, availability, and operational resilience

| ID | Priority | Class | Requirement |
|---|---|---|---|
| GEN-RECOVERY-001 | P0 | Project | Critical data and services SHALL have documented recovery objectives, backup scope, backup protection, restore procedures, and tested recovery evidence before production reliance. |
| GEN-RECOVERY-002 | P0 | Project | Recovery authority SHALL be separated from normal application behavior and SHALL be auditable. |
| GEN-RECOVERY-003 | P1 | Project | Recovery tests SHALL prove restoration from backups or replacement infrastructure; the existence of backups alone SHALL NOT count as recovery evidence. |
| GEN-EOL-001 | P1 | Project | Supported, deprecated, and retired API/client/module versions SHALL have documented lifecycle rules and migration paths. |

## 13. Logging, audit, and observability

| ID | Priority | Class | Requirement |
|---|---|---|---|
| GEN-LOG-001 | P0 | Project | Security-relevant events SHALL use stable event types, UTC timestamps, correlation identifiers where applicable, actor/principal references, outcome, and source/component metadata. |
| GEN-LOG-002 | P0 | Project | Logs SHALL redact secrets, tokens, authentication material, unnecessary personal data, and protected device evidence. |
| GEN-LOG-003 | P0 | Project | Audit data relied on as evidence SHALL have access-control and integrity protections appropriate to the claim being made. |
| GEN-OBS-001 | P1 | Project | Health/telemetry signals SHALL distinguish dependency failure, degraded service, validation failure, security denial, and simulator/test state where operationally relevant. |

## 14. Privacy and data governance

| ID | Priority | Class | Requirement |
|---|---|---|---|
| GEN-PRIVACY-001 | P0 | Project + reference | Genesis SHALL maintain a data inventory describing collected data, purpose, classification, source, allowed consumers, retention, disclosure, redaction, and deletion expectations. NIST Privacy Framework concepts MAY guide this process. |
| GEN-PRIVACY-002 | P0 | Project | Collection SHALL be purpose-limited and minimized. Data SHALL NOT be retained merely because it is technically available. |
| GEN-TELEM-001 | P0 | Project | Each material telemetry field SHALL have a defined purpose, sensitivity classification, allowed consumer, retention rule, and deletion/redaction rule. |
| GEN-PRIVACY-003 | P1 | Project | External processors/providers SHALL receive only data classes explicitly permitted by policy and configuration. |

## 15. AI and agent governance

| ID | Priority | Class | Requirement |
|---|---|---|---|
| GEN-AI-001 | P0 | Project + reference | Genesis SHALL maintain a registry of AI/model providers used by the project, permitted data classes, credential boundaries, retention assumptions, network dependencies, and failure behavior. NIST AI RMF and the Generative AI Profile MAY guide risk management. |
| GEN-AI-002 | P0 | Project | AI output SHALL be treated as untrusted analysis until independently validated when it affects code, security posture, release evidence, capability maturity, or privileged action. |
| GEN-AI-003 | P0 | Project | Agent/tool authority SHALL be least-privilege and scoped independently of the model's ability to request an action. A model SHALL NOT self-grant credentials, policy exceptions, or privileged capability. |
| GEN-AI-004 | P0 | Project | Repository text, websites, uploaded documents, API responses, generated content, and tool results SHALL be treated as potentially untrusted instructions. Tool execution SHALL remain bounded by explicit permissions and system policy. |
| GEN-AI-005 | P0 | Project | Secrets, private device data, regulated data, and high-sensitivity evidence SHALL NOT be sent to an external model unless a documented policy explicitly permits the provider, purpose, and data class. |

## 16. Accessibility and operator safety

| ID | Priority | Class | Requirement |
|---|---|---|---|
| GEN-ACCESS-001 | P1 | Project + reference | Public/operator web interfaces SHOULD target WCAG 2.2 Level AA, including keyboard operation, visible focus, accessible authentication, error identification, and target sizing. |
| GEN-UX-001 | P0 | Project | Destructive, privileged, simulator, unavailable, and irreversible states SHALL be visually and semantically distinguishable. |
| GEN-UX-002 | P0 | Project | Security-sensitive UI text SHALL describe what is actually enforced by the backend; presentation SHALL NOT imply certification, attestation, authorization, or hardware protection that the system cannot prove. |

## 17. Privileged and device-changing capability gate

Genesis may plan privileged device-management capability. Planning is not the same as operational availability.

| ID | Priority | Class | Requirement |
|---|---|---|---|
| GEN-PRIVOP-001 | P0 | Project | A privileged or device-changing capability SHALL remain **Not available**, **Target**, or **Simulator** until its graduation evidence satisfies the applicable gates below. |
| GEN-PRIVOP-002 | P0 | Project | Graduation SHALL require an explicit supported-device/target matrix, authenticated operator and device ownership/authorization model, least-privilege execution boundary, complete audit path, failure model, and recovery path. |
| GEN-PRIVOP-003 | P0 | Project | Where artifacts or firmware are involved, provenance/integrity checks and compatibility validation SHALL occur before any production claim of support. |
| GEN-PRIVOP-004 | P0 | Project | Lab validation SHALL include denial cases, interrupted-operation recovery, unsupported-target behavior, repeatability, and evidence that public/operator controls cannot bypass policy. |
| GEN-PRIVOP-005 | P0 | Project | Capability graduation SHALL require an explicit update to `docs/CAPABILITY_REGISTER.md`; implementation code alone SHALL NOT enable an operator-facing success claim. |

## 18. Legal, licensing, and external applicability

| ID | Priority | Class | Requirement |
|---|---|---|---|
| GEN-LICENSE-001 | P0 before distribution | Project | Genesis SHALL finalize project licensing, third-party license handling, attribution/NOTICE obligations, and redistribution rules before broad binary/commercial distribution. |
| GEN-REG-001 | P1 before public production operation | Project | Genesis SHALL maintain an applicability matrix for privacy, consumer, accessibility, data-retention, sector, contractual, and security obligations based on actual markets, users, data, and product functions. |
| GEN-REG-002 | P0 | Project | Genesis SHALL NOT use broad statements such as "compliant", "certified", "FIPS validated", "Knox certified", or equivalent unless the exact scope, authority, version, and evidence support that statement. |

## 19. Machine-readable assurance direction

| ID | Priority | Class | Requirement |
|---|---|---|---|
| GEN-CONTROL-001 | P2 | Recommended reference | Genesis SHOULD evaluate an OSCAL-inspired machine-readable representation for requirements, implemented controls, assessments, findings, risks, and evidence links. |
| GEN-CONTROL-002 | P2 | Project | Any machine-readable control model SHALL preserve the same evidence/maturity distinction used by the human-readable Capability Register. |

## 20. External reference registry

The following sources inform this baseline. They are references unless a row above explicitly identifies a conditional external requirement.

| Reference | Role in Genesis | Authoritative source |
|---|---|---|
| NIST Cybersecurity Framework 2.0 | Security governance and risk lifecycle | https://www.nist.gov/cyberframework |
| NIST SP 800-160 Vol. 1 Rev. 1 | Trustworthy systems engineering | https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final |
| NIST SP 800-218 / SSDF 1.1 | Current final secure software development baseline | https://csrc.nist.gov/pubs/sp/800/218/final |
| NIST SP 800-218 Rev. 1 / SSDF 1.2 | Draft tracked for future review; not current final baseline | https://csrc.nist.gov/pubs/sp/800/218/r1/ipd |
| OWASP ASVS 5.0.0 | Web application security verification | https://owasp.org/projects/asvs |
| OWASP API Security Top 10 2023 | API threat/verification reference | https://owasp.org/projects/api-security-project |
| OWASP MASVS + MASTG | Mobile security controls and testing | https://mas.owasp.org/MASVS/ |
| NIST SP 800-63-4 | Digital identity guidelines | https://csrc.nist.gov/pubs/sp/800/63/4/final |
| NIST SP 800-63B-4 | Authentication/authenticator guidance | https://pages.nist.gov/800-63-4/sp800-63b.html |
| RFC 9700 | OAuth 2.0 Security Best Current Practice | https://www.rfc-editor.org/rfc/rfc9700.html |
| NIST SP 800-57 Part 1 Rev. 5 | Key-management guidance | https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final |
| NIST CSWP 39upd1 | Cryptographic agility | https://csrc.nist.gov/pubs/cswp/39/upd1/considerations-for-achieving-crypto-agility/final |
| FIPS 203 / 204 / 205 | Standardized post-quantum cryptography terminology | https://csrc.nist.gov/publications/fips |
| The Update Framework | Secure software-update reference architecture | https://theupdateframework.io/ |
| NIST SP 800-161 Rev. 1 Update 1 | Cybersecurity supply-chain risk management | https://csrc.nist.gov/pubs/sp/800/161/r1/upd1/final |
| CISA Known Exploited Vulnerabilities Catalog | Vulnerability prioritization input | https://www.cisa.gov/known-exploited-vulnerabilities-catalog |
| CISA Secure by Design | Secure-default product guidance | https://www.cisa.gov/securebydesign |
| RFC 9116 | security.txt vulnerability-reporting format | https://www.rfc-editor.org/rfc/rfc9116.html |
| NIST SP 800-61 Rev. 3 | Incident-response risk-management guidance | https://csrc.nist.gov/pubs/sp/800/61/r3/final |
| NIST SP 800-34 Rev. 1 | Contingency/recovery planning reference | https://csrc.nist.gov/pubs/sp/800/34/r1/final |
| NIST Privacy Framework | Privacy-risk reference | https://www.nist.gov/privacy-framework |
| NIST AI RMF + Generative AI Profile | AI risk-management reference | https://www.nist.gov/itl/ai-risk-management-framework |
| NIST OSCAL | Machine-readable control and assessment models | https://pages.nist.gov/OSCAL/ |
| WCAG 2.2 | Web accessibility reference | https://www.w3.org/TR/WCAG22/ |
| SLSA | Build/provenance maturity reference | https://slsa.dev/ |
| Sigstore/Cosign | Artifact signing and verification reference | https://www.sigstore.dev/ |
| OpenSSF Scorecard | Dependency/project risk signal | https://openssf.org/projects/scorecard/ |

## 21. Requirement lifecycle

A requirement MAY carry one of these implementation states in future tracking:

- **Adopted** — normative requirement exists.
- **In progress** — implementation/evidence work is underway.
- **Satisfied** — current reproducible evidence demonstrates the requirement for its defined scope.
- **Exception** — approved, scoped, time-bounded deviation exists.
- **Not applicable** — applicability analysis demonstrates the requirement does not apply to the defined scope.
- **Retired** — superseded or intentionally removed through governance.

**Adopted is not Satisfied.**

## 22. Validation and claim rule

When a change claims to satisfy a requirement:

1. identify the requirement ID(s);
2. identify the affected threat/risk and architecture boundary;
3. add or update implementation;
4. add automated or reproducible validation;
5. record the result against a commit;
6. document known limitations;
7. update the Capability Register only if maturity genuinely changed;
8. update public/operator wording only after the evidence supports it.

## 23. Baseline review cadence

This baseline SHOULD be reviewed when:

- a major Genesis architecture boundary changes;
- a new externally operated provider is introduced;
- a privileged capability is proposed for graduation;
- an applicable external standard materially changes;
- a security incident exposes a requirements gap;
- a release is proposed as production-ready;
- at least annually if none of the above occurs.

A standards update SHALL NOT silently convert a reference into a compliance claim. Changes to normative Genesis requirements require repository review.

---

**Genesis assurance principle:** Claims follow evidence. Authority follows policy. Simulation stays visibly simulated. Security is foundational. User choice remains explicit. Trust must be earned.
