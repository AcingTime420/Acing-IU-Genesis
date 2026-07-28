# Acing IU — Architectural Specifications

This document outlines the system architecture for **Acing IU**, a security-first platform modeled after a Knox-style zero-trust trust architecture. All interactions are centralized, authenticated, authorized, policy-checked, and thoroughly audited before granting resource access.

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
Enforces hardware and platform health compliance:
*   Enrolls and identifies devices using unique digital signatures.
*   Calculates a dynamic **Device Trust Score** (0-100) based on platform version, security patches, app version, jailbreak status, and attestation.
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

## 3. Sequence Flow (Zero-Trust Validation)

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

## 4. Hardware and Infrastructure Integration

*   **Database: PostgreSQL 16**
    *   Chosen as the primary relational warehouse for transactions, audit trails, policy parameters, and user credentials.
*   **Cache & Session Storage: Redis 7**
    *   Handles distributed session tracking, token blacklist/whitelist cache, and API Gateway rate-limiting.
*   **Docker Containerization**
    *   Standardizes microservice environments across development, testing, and production stages.
