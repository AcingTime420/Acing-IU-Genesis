# Acing IU — Architectural Specifications

This document outlines the system architecture for **Acing IU**, a security-first research and simulator platform modeled after a Knox-style zero-trust trust architecture. It describes the target authoritative architecture and planned controls; current simulator surfaces use fixture/synthetic data and do not perform hardware attestation or compliance certification.

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
Defines planned hardware and platform health evaluation:
*   Enrolls and identifies devices using unique digital signatures.
*   Models a dynamic **Device Trust Score** (0-100) based on platform version, security patches, app version, jailbreak status, and attestation signals.
*   Intended policy outcome in authoritative services is tiered access:
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
Planned immutable compliance recorder (authoritative-service boundary):
*   Collects security events asynchronously via a message channel or localized high-performance logger.
*   Enforces that no transaction, login, policy update, or device registration can complete without saving a persistent audit log entry.

---

## 3. The Acing Matrix Trust Chain

To define complete zero-trust access control goals, Acing IU specifies the **Acing Matrix Trust Chain** for SM-S938U Verizon endpoints. In current simulator flows, trust-chain results are synthetic; in target deployment, access is authorized only when each tier is validated in real time.

```text
  [Tier 1: SM-S938U Hardware RoT]
                |
                v  (Hardware-backed key signing & boot status)
  [Tier 2: Knox Vault Isolation]
                |
                v  (TIMA, RKP, and SELinux Enforcing checks)
  [Tier 3: Knox Attestation API]
                |
                v  (Odin AP/BL/CP/CSC simulation baseline checks)
  [Tier 4: Carrier Firmware Asset Verification]
                |
                v  (CTIA OTA 3.8.2 RF TRP/TIS connection checks)
  [Tier 5: Secure Radio Transport]
                |
                v  (Acing Device Trust Service validation)
  [Tier 6: Policy Evaluator decision payload]
```

### 3.1 Trust Chain Verification Mechanics
1.  **Tier 1: Hardware Root of Trust**: Production-target behavior is for the S25 Ultra Qualcomm Snapdragon 8 Elite hardware-backed RoT to verify primary system image signatures during boot.
2.  **Tier 2: Knox Vault Isolation**: Production-target behavior is for Knox Vault isolated security hardware to sign attestations using private keys generated in-chip.
3.  **Tier 3: Knox Attestation**: Planned authoritative behavior is to invoke the Knox Attestation API and validate TrustZone-based TIMA, RKP, and SELinux status.
4.  **Tier 4: Carrier Firmware Asset Verification**: Planned authoritative behavior is to evaluate Odin partitions (AP/BL/CP/CSC) against approved Verizon SM-S938U baselines.
5.  **Tier 5: Secure Radio Transport**: Planned authoritative behavior is to evaluate Verizon-band connectivity and CTIA OTA v3.8.2 benchmark alignment (TRP, TIS, A-GNSS metrics).
6.  **Tier 6: Acing Policy Evaluator**: Planned policy contract is to permit access only when all preceding trust tiers succeed.

---

## 4. Sequence Flow (Zero-Trust Validation)

This sequence diagram specifies the target transaction lifecycle of a request requiring high security trust (e.g., accessing confidential research). Simulator UI traces are representations of this design, not proof of live hardware attestation.

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
