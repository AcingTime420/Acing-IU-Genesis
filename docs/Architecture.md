# Acing IU — Architectural Specifications

> **Claim status (issue #63):** This document describes *target architecture*
> and *design inspiration*. References to Knox, CTIA, or carrier certification
> are **not** claims that those products or certifications are implemented,
> integrated, or certified in this repository today.

This document outlines the system architecture for **Acing IU**, a security-first platform modeled after industry zero-trust device-trust patterns (design inspiration includes concepts popularized by platforms such as Samsung Knox). All interactions are intended to be centralized, authenticated, authorized, policy-checked, and thoroughly audited before granting resource access.

---

## 1. System Topology (System Level)

Acing IU adopts a centralized API Gateway pattern to protect and route traffic to localized microservices. 

```text
                               +-------------------+
                               |    Frontend UI    |
                               |    (Next.js)      |
                               +---------+---------+
                                         |
                                         | HTTPS (JSON)
                                         v
                               +-------------------+
                               |    API Gateway    |
                               |   (Ocelot/.NET)   |
                               +---------+---------+
                                         |
         +-------------------------------+-------------------------------+
         |                               |                               |
         v                               v                               v
+------------------+           +------------------+            +------------------+
| Identity Service |           |   Policy Engine  |            |Device Trust Serv.|
|  & Auth Module   |           | (ABAC Engine)    |            | (Attestation/OS) |
+--------+---------+           +--------+---------+            +--------+---------+
         |                              |                               |
         +------------------------------+-------------------------------+
                                         |
                                         v
                               +-------------------+
                               |  Audit Log Serv.  |
                               +---------+---------+
                                         |
                                         v
                               +-------------------+
                               |  Infrastructure   |
                               |  PostgreSQL/Redis |
                               +-------------------+
```

---

## 2. Logical Components Description

### 2.1 API Gateway
The gateway acts as the single entry point. It handles:
*   SSL/TLS termination.
*   Header validation and CORS enforcement.
*   Rate limiting via Redis.
*   Request routing to downstream backend services.

### 2.2 Identity & Authentication Service
Responsible for credentials validation, session tracking, and key distribution:
*   Supports secure email/password registration and logins.
*   Enforces Time-Based One-Time Password (TOTP) Multi-Factor Authentication (MFA).
*   Issues short-lived JWT access tokens and rotates refresh tokens.
*   Federates authentication to third-party OAuth providers (Google, Microsoft, etc.) if configured.

### 2.3 Authorization Service (RBAC / ABAC)
Protects endpoints and specific features by:
*   Evaluating user role mappings (`Admin`, `Operator`, `User`).
*   Verifying specific granular permissions (e.g., `devices.read`, `policy.write`).
*   Consulting the Attribute-Based Access Control (ABAC) engine to consider operational variables (e.g., source IP, time-of-day).

### 2.4 Device Trust Engine
Enforces hardware and platform health compliance *when signals are available*:
*   Enrolls and identifies devices using unique digital signatures.
*   Calculates a dynamic **Device Trust Score** (0-100) based on platform version, security patches, app version, jailbreak status, and attestation *when present*.
*   Grants access only to devices with acceptable trust tiers:
    *   **90 - 100**: Trusted
    *   **70 - 89**: Elevated
    *   **40 - 69**: Restricted
    *   **0 - 39**: Quarantined

### 2.5 Policy Engine
The rule-evaluator of Acing IU:
*   Stores access control policies in the database.
*   Performs pre-flight decision checks combining: `User Identity` + `MFA Status` + `Device Trust Score` + `Target Operation`.
*   Blocks unauthorized or risky requests immediately.

### 2.6 Audit Service
The immutable compliance recorder:
*   Collects security events asynchronously via a message channel or localized high-performance logger.
*   Enforces that no transaction, login, policy update, or device registration can complete without saving a persistent audit log entry.

---

## 3. The Acing Matrix Trust Chain (target design)

The following chain is the **target** model for high-assurance endpoints (e.g., SM-S938U research profile). Tiers below that require vendor hardware or carrier evidence are **not implemented as live integrations** in the current codebase; software simulators and fixtures stand in for development.

```text
  [Tier 1: Hardware Root of Trust — target]
                |
                v  (Hardware-backed key signing & boot status when available)
  [Tier 2: Isolated Vault — target / currently emulated]
                |
                v  (Kernel integrity & SELinux checks when signals exist)
  [Tier 3: Device attestation — target]
                |
                v  (Partition baseline checks when inventory exists)
  [Tier 4: Firmware asset verification — target]
                |
                v  (Radio quality metrics — research only, not certification)
  [Tier 5: Secure transport signals — research]
                |
                v  (Acing Device Trust Service validation)
  [Tier 6: Policy Evaluator decision payload]
```

### 3.1 Trust Chain Verification Mechanics (targets vs current)
1.  **Tier 1: Hardware Root of Trust**: *Target* — verify system image signatures during boot on supported devices. Current builds do not perform live hardware RoT validation.
2.  **Tier 2: Isolated Vault**: *Target* — hardware-isolated key storage. Current builds use `AcingVaultEmulator` (software only).
3.  **Tier 3: Device attestation**: *Target* — platform attestation APIs and integrity signals (e.g., TIMA/RKP/SELinux analogs when exposed). Not a third-party Knox product integration.
4.  **Tier 4: Firmware asset verification**: *Target* — compare partition hashes to an approved baseline when a signed inventory is available.
5.  **Tier 5: Radio transport signals**: *Research* — optional quality metrics. **Not** a claim of CTIA certification.
6.  **Tier 6: Acing Policy Evaluator**: Access is permitted only when configured policy checks pass on available signals.

---

## 4. Sequence Flow (Zero-Trust Validation)

This sequence diagram specifies the transaction lifecycle of a request requiring high security trust (e.g., accessing confidential research):

```text
User/Client           Gateway           Auth Serv          Trust Eng.        Policy Eng.         Database
    |                    |                  |                  |                  |                  |
    |-- 1. POST Request ->|                  |                  |                  |                  |
    |   (with JWT)       |-- 2. Validate -> |                  |                  |                  |
    |                    |      Token & Role|                  |                  |                  |
    |                    |<-- 3. Token OK --|                  |                  |                  |
    |                    |                                     |                  |                  |
    |                    |----- 4. Assess Device Signature --->|                  |                  |
    |                    |<---- 5. Trust Score (e.g. 95) ------|                  |                  |
    |                    |                                                        |                  |
    |                    |--------- 6. Check Policy (Score, Role, Target) ------->|                  |
    |                    |<-------- 7. Decision: GRANTED -------------------------|                  |
    |                    |                                                                           |
    |                    |--------------------------- 8. Commit Audit Record ----------------------->|
    |                    |<-------------------------- 9. Audit Committed ----------------------------|
    |                    |                                                                           |
    |<- 10. Success -----|                                                                           |
    |   (Data Payload)   |                                                                           |
```

---

## 5. Hardware and Infrastructure Integration

*   **Database: PostgreSQL 16**
    *   Chosen as the primary relational warehouse for transactions, audit trails, policy parameters, and user credentials.
*   **Cache & Session Storage: Redis 7**
    *   Handles distributed session tracking, token blacklist/whitelist cache, and API Gateway rate-limiting.
*   **Docker Containerization**
    *   Standardizes microservice environments across development, testing, and production stages.
