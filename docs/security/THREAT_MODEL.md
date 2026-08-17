# Acing IU: Genesis Threat Model

**Status:** Active security-baseline artifact
**Owner:** Micki Hart, Founder / Lead Developer
**Applies to:** Canonical Genesis source, local Docker Compose validation environment, CI workflows, and planned Android and AI integrations.
**Review triggers:** Any authentication, authorization, policy, database, gateway, Android, provider, CI, or release-architecture change; and at least once per release candidate.

## 1. Objective and scope

This threat model defines the security boundaries that Genesis must preserve while it evolves from a validated service foundation into a device-trust platform. It distinguishes verified implementation from planned capability. It does not claim that hardware attestation, Android firmware safety, an AI integration, or a certification is present unless separate implementation and test evidence exists.

The current validated container topology contains a browser-facing Nginx gateway, Identity API, DeviceTrust API, PostgreSQL, Redis, and a migration job. The production-mode validation environment exposes the gateway health endpoint and routes API traffic through the gateway. PostgreSQL uses distinct identity, device-trust, and migrator roles. The standalone `backend/Audit` project is explicitly **not** an approved audit authority: it is non-durable and unauthenticated, as recorded in [issue #60](https://github.com/AcingTime420/Acing-IU-Genesis/issues/60).

## 2. Security objectives

| Objective | Required outcome |
|---|---|
| Confidentiality | Secrets, authentication material, personal identifiers, device identifiers, audit evidence, backups, and provider credentials are disclosed only to authorized principals. |
| Integrity | Identity, policy, device-trust, migration, audit, and release data is authenticated, tenant-scoped where applicable, validated, and resistant to unauthorized modification or replay. |
| Availability | Gateway, identity, device-trust, database, cache, and migration operations fail safely; abuse and dependency failures do not create a permissive security decision. |
| Accountability | Privileged and security-relevant operations are attributable through durable, access-controlled, tamper-evident evidence. This objective is blocked for the current standalone Audit API until issue #60 is resolved. |
| Safety | Android and firmware actions remain observation-first and deny state-changing behavior until exact-device compatibility, ownership, authorization, backup, and recovery evidence exists. |

## 3. Assets and protection requirements

| Asset | Classification | Primary threats | Required protection |
|---|---|---|---|
| Password verifiers, refresh tokens, MFA material | Restricted | Credential theft, token replay, brute force, data disclosure | Strong hashing and encryption, key isolation, expiry, rotation, revocation, replay tests, and rate limiting. |
| JWT signing keys and service credentials | Restricted | Key theft, forged tokens, lateral movement | Secret-store-only distribution, least privilege, rotation, fail-closed startup, redacted logging, and leak response. |
| Device identity and trust evidence | Sensitive | Spoofing, stale evidence, correlation of device/user data | Input validation, freshness, provenance, tenant and ownership scope, reason codes, and privacy-minimizing storage. |
| Policy and role assignments | Restricted | Privilege escalation, unauthorized publishing | Server-side deny-by-default authorization, approval lifecycle, versioning, rollback, and durable audit records. |
| Audit and incident evidence | Restricted | Deletion, alteration, anonymous reads/writes, loss on restart | Append-only durable store, separate writer/query roles, tenant-scoped access, retention, controlled export, and integration tests. |
| PostgreSQL and Redis data | Restricted | Direct access, default grants, disclosure through backup | Network isolation, unique credentials, least-privilege grants, encrypted backup, restore drills, and no public host exposure unless explicitly approved. |
| Container images and CI artifacts | Internal / Restricted | Poisoned dependencies, malicious action, tampered artifact | Pinned dependencies and actions, SBOM, scanning, provenance, signed release evidence, and protected branches. |
| Android devices, firmware packages, backups | Restricted / Safety-critical | Wrong-target flashing, unauthorized unlock, data loss, bypass | Read-only inventory first, exact-device matrix, source/hash verification, ownership checks, backup-before-change, allowlisted commands, and recovery drills. |
| AI prompts and provider credentials | Restricted | Secret or device-data egress, uncontrolled action, cost abuse | Server-side adapters, classified inputs, redaction/blocking, advisory-only tools, approval gates, bounded retry/cost, and policy-decision logs. |

## 4. Actors and trust boundaries

| Boundary | Trusted side | Untrusted or lower-trust side | Security decision required |
|---|---|---|---|
| B1: Operator browser to gateway | Authenticated operator session and approved browser | Internet or local network client, malformed requests, stolen session | TLS termination in approved deployment, request-size and input validation, correlation identifier, authentication, authorization, and rate limiting. |
| B2: Gateway to APIs | Gateway routing configuration | Request headers, bearer tokens, forwarded identity context | Preserve only allowlisted forwarding headers; independently validate tokens and enforce authorization in each API. |
| B3: Identity / DeviceTrust to PostgreSQL and Redis | Named service credentials and isolated network | Compromised application process, SQL injection, cache misuse | Parameterized data access, segregated roles, explicit grants, credential rotation, and no reliance on network location as authorization. |
| B4: Migration job to PostgreSQL | Time-bounded migrator credential | Application services and compromised migration content | Dedicated migrator role, ordered reviewed migrations, separate application grants, empty-volume test, and rollback/recovery evidence. |
| B5: Backend to Audit capability | Approved durable audit writer, once implemented | Current standalone Audit API and caller-controlled event payloads | Treat issue #60 implementation as unsafe; do not accept its persistence or integrity claims until replaced and tested. |
| B6: Engineering workstation / CI to source and artifacts | Reviewed maintainers and protected CI identities | Unreviewed pull requests, compromised action or dependency, leaked token | Protected branch controls, least-privilege tokens, pinned actions, scanning, SBOM, provenance, and review evidence. |
| B7: Backend to Android devices | Authorized owned lab device with approved procedure | Unknown, disconnected, spoofed, unsupported, or user-owned device | No destructive command without exact compatibility, ownership, policy authorization, backup, confirmation, and recovery plan. |
| B8: Backend to AI provider | Approved provider adapter and purpose-limited request | External provider, prompt injection, data retention, provider outage | Explicit approval, minimization/redaction, advisory-only behavior, timeouts, bounded retries, and no client-side credentials. |

## 5. Data flows

1. An operator interacts with the web frontend through the gateway. The gateway routes requests to Identity or DeviceTrust. API security decisions remain the responsibility of the destination API; gateway routing is not a substitute for service authorization.
2. Identity authenticates users and manages token- and MFA-related data. Its public authentication routes are protected by a fixed-window limit of ten requests per client per minute with no queue. A runtime probe verified that requests 11 and 12 received HTTP 429 after ten rapid malformed login requests.
3. DeviceTrust receives and evaluates device-related requests. Device trust is not proof of hardware-backed attestation unless the validated evidence input and verifier explicitly establish it.
4. Identity, DeviceTrust, and the migrator access PostgreSQL using separate roles. Redis supports service operation and requires an authenticated connection in the Compose configuration.
5. CI builds and tests the repository, produces container artifacts, and executes configured supply-chain checks. A green build is not, by itself, evidence of authorization, hardware enforcement, or audit immutability.
6. Android and AI flows are future trust boundaries. They are not enabled by this threat model; implementation must meet the specific gate requirements before processing production data or sending state-changing commands.

## 6. Threat analysis and prioritized mitigations

| ID | Threat / abuse case | Affected boundary | Impact | Current state | Required mitigation and evidence | Priority |
|---|---|---|---|---|---|---|
| T-01 | Password spraying, MFA guessing, refresh-token abuse | B1, B2 | Account takeover and service degradation | Partially mitigated: Identity fixed-window abuse policy validated at runtime | Add lockout, token replay, expiry, revocation, recovery, and security-event tests; verify trusted-client keying and proxy behavior. | Critical |
| T-02 | Anonymous or low-privilege caller accesses privileged APIs | B1, B2 | Policy, device, or identity compromise | Requires service-by-service evidence | Define RBAC/ABAC matrix, apply authorization policies at every privileged endpoint, and add 401/403 deny-path tests. | Critical |
| T-03 | Audit records are forged, disclosed, modified, deleted, or lost | B5 | Loss of forensic accountability and unsupported compliance claims | **Blocked:** standalone Audit API is in-memory, unauthenticated, and non-durable | Resolve issue #60 with append-only durable storage, least-privilege writer/query roles, authenticated tenant-scoped access, and destructive-operation rejection tests. | Critical |
| T-04 | Secrets enter source, logs, images, or client bundles | B3, B6, B8 | Credential compromise and data breach | Compose requires required variables; complete register and response process not yet evidenced | Maintain metadata-only secret register; use protected CI/production store; secret scan; rotation and incident runbook; redaction tests. | Critical |
| T-05 | SQL injection, cross-service database access, or migration privilege abuse | B3, B4 | Data alteration or disclosure | Separate role validation and empty-volume migration drill completed | Preserve parameterized access and application-role grant tests; review migration grants; prohibit application DDL and role administration. | High |
| T-06 | Gateway or API documentation exposes unnecessary production attack surface | B1, B2 | Endpoint discovery and attack assistance | Mitigated in Identity and DeviceTrust: Swagger restricted to Development; production endpoint test returned HTTP 404 | Repeat in every new API; maintain environment-specific deployment test and public-route inventory. | High |
| T-07 | Compromised dependency, action, image, or release artifact enters delivery path | B6 | Supply-chain compromise | Existing SBOM/security workflow must be validated against Phase 4 criteria | Publish SBOM in CI, scan dependencies and secrets, pin actions and base images, review licenses, and record provenance. | High |
| T-08 | Device evidence is stale, forged, or mismatched to the requested action | B7 | Unsafe trust decision or device damage | Not verified; Android work is later-gated | Build supported-device matrix, read-only signed inventory, evidence freshness and signature validation, mismatch blocking, and recovery lab. | High |
| T-09 | Provider receives secrets, identifiers, firmware data, or injection-controlled instructions | B8 | Data exfiltration and unsafe actions | Not enabled or approved | Use server-side adapter only, classify/redact inputs, deny sensitive defaults, restrict tools to advisory actions, and require approval. | High |
| T-10 | Correlation identifiers or logs disclose sensitive data or enable spoofing | B1, B2, B3 | Privacy leak and investigation failure | Operational control pending | Generate/validate bounded request IDs, propagate allowlisted values, redact credentials/tokens/PII, and cap log volume. | Medium |
| T-11 | Backup encryption or recovery process fails when needed | B3, B4 | Data loss and extended outage | Encrypted isolated restore has been validated | Define RTO/RPO, rotate recovery certificate/material, schedule and record drills, and restrict backup access. | Medium |
| T-12 | UI or documentation makes unsupported security or certification claims | All | Misleading operators, unsafe reliance, legal/reputational exposure | Capability register exists; review remains incomplete | Maintain evidence-linked claim register; label targets and simulators; remove unsupported certification, hardware, and recovery claims. | Medium |

## 7. Required design rules

The following rules are mandatory for current and future work:

1. **Deny by default.** A backend endpoint that changes identity, policy, device, firmware, secret, release, or audit state requires an explicit server-side authorization policy. User-interface visibility is never authorization.
2. **No production documentation surface by default.** Interactive API documentation is available only in Development. New services must prove equivalent behavior in a production-mode test.
3. **Fail closed for security configuration.** Required secrets, signing material, encryption keys, and database credentials must prevent startup when absent rather than fall back to development defaults.
4. **Separate duties at the database boundary.** Application, migrator, and future audit writer/query accounts require only their documented permissions. Application services may not create databases, create roles, or modify audit history.
5. **Audit claims require durable evidence.** Do not describe logging as immutable, securely persisted, tenant-scoped, or forensically complete before issue #60 is resolved and its integration tests pass.
6. **No destructive device operation without evidence.** Firmware and bootloader operations remain disabled until later gates establish exact supported-device scope, ownership authorization, backups, recovery, and anomaly stops.
7. **No AI credential or sensitive-data exposure.** AI calls must occur through governed server-side adapters only after the Phase 8 controls are complete.
8. **No unsupported certification claims.** Terms such as certified, FIPS-validated, Knox-equivalent, brick-proof, or quantum-secure require source-specific external evidence and approved wording. Otherwise label the item as a target, prototype, simulation, or unverified capability.

## 8. Validation evidence and open decisions

| Control | Evidence available | Remaining evidence |
|---|---|---|
| Backend build baseline | Release build succeeded with zero warnings/errors; 21 backend unit tests passed. | Expand to security-specific integration and authorization matrix tests. |
| Authentication abuse control | Twelve-request runtime login probe returned HTTP 400 for requests 1–10 and HTTP 429 for requests 11–12. | Lockout, token lifecycle, MFA recovery, proxy-keying, and failure event tests. |
| Production documentation exposure | Identity and DeviceTrust production containers returned HTTP 404 for Swagger UI while health endpoints remained available. | Add a reusable service test/gate for every future API. |
| Database separation and recovery | Fresh-volume migrations, least-privilege role checks, and encrypted isolated backup restore completed. | CI/scheduled migration and recovery evidence; audit-specific append-only grants after issue #60. |
| Immutable audit and controlled export | No valid evidence; current Audit API is not acceptable. | Full resolution of issue #60. |
| Android / firmware safety | No valid enforcement evidence. | Phase 7 supported-device, inventory, verification, backup, command-control, and recovery-lab evidence. |
| AI data governance | No enabled-provider evidence. | Phase 8 inventory, adapters, redaction, advisory-mode, and batch lifecycle evidence. |

## 9. Review and exception process

A proposed exception must identify the specific threat ID, affected asset, reason, compensating controls, accountable owner, expiry date, and rollback plan. Exceptions do not convert a target or simulation into an implemented security control. The owner must update this document and the capability register when a mitigation changes status.

## 10. References

- [Master To-Do Guide, Phase 4 requirements](../../upload/pasted_content.txt)
- [Capability Register](CAPABILITY_REGISTER.md)
- [Security architecture ADR](adr/ADR-0003-zero-trust-security-baseline.md)
- [Audit-service blocker](https://github.com/AcingTime420/Acing-IU-Genesis/issues/60)
