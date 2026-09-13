# Software Requirements Specification (SRS) for Acing IU

> **Claim status (issue #63):** This SRS describes *target* and *research*
> requirements. References to Knox, carrier certification, or hardware
> attestation are **design inspiration and planned evaluation criteria**.
> They do **not** assert that Samsung Knox, carrier certification, or
> production hardware attestation is implemented or certified in this
> repository today.

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the **Acing IU** platform. Acing IU is a high-security enterprise platform **inspired by industry device-trust architectures** (including concepts popularized by platforms such as Samsung Knox). It is designed to coordinate user identity, device compliance metrics, policy decisions, and audit events to protect critical workspace operations.

### 1.2 Scope
Acing IU comprises:
1.  An API Gateway controlling all ingress traffic.
2.  An Identity Provider (IdP) service with robust Multi-Factor Authentication (MFA).
3.  An Attribute-Based and Role-Based Authorization engine.
4.  A Device Trust service calculating dynamic client compliance profiles.
5.  An Immutable Auditing pipeline recording all transactional events.
6.  An interactive Next.js-based Security Dashboard displaying analytics, telemetry, and configuration settings.

This specification uses the **SM-S938U Verizon baseline** (Samsung Galaxy S25 Ultra) as a *reference research endpoint* for evaluating hardware-oriented trust signals (bootloader state, warranty flags, radio metrics). Those constraints are **targets for future device integration**, not claims of current certified integration.

---

## 2. Overall Description

### 2.1 User Personas
*   **Acing Administrator**: Configures system policies, reviews audit logs, manages user roles, and modifies device trust assessment parameters.
*   **Platform Operator**: Enrolls devices, reviews security alerts, manages inventory, and handles quarantined devices.
*   **End User**: Authenticates via registered devices, manages local MFA profiles, and performs standard platform operations.

### 2.2 Design-Inspired Trust Model (not a vendor product)
Access to any protected module (e.g., AI Research, Workspace data) is decided at runtime by evaluating:
$$\text{Access Granted} = f(\text{User Identity}, \text{MFA Completed}, \text{Device Trust Score} \ge \text{Policy Threshold})$$

This model is inspired by enterprise device-trust patterns. It is **not** an implementation or certification of any third-party Knox product.

---

## 3. Functional Requirements

### 3.1 Identity & Access Management (IAM)
*   **FR-1.1 (User Enrollment)**: The system must allow users to register secure accounts with email validation, secure password strength guidelines, and initial low-privilege roles.
*   **FR-1.2 (Token Authentication)**: Logins must generate short-lived JWT access tokens (15 minutes expiration) and secure, rotatable refresh tokens stored in secure cookie structures or protected cache.
*   **FR-1.3 (Multi-Factor Authentication)**: The system must support industry-standard Time-Based One-Time Passwords (TOTP) compliant with Google/Microsoft Authenticator. Users must be provided 10 recovery codes upon MFA setup.
*   **FR-1.4 (Single Sign-On SSO)**: The platform must support OAuth2/OIDC integration to federate logins to Google Cloud Console or other Identity Providers when configured.

### 3.2 Authorization & Policy Controls
*   **FR-2.1 (RBAC Support)**: Admins must be able to assign roles (`Admin`, `Operator`, `User`) that carry explicit permissions (e.g., `audit.read`, `devices.write`).
*   **FR-2.2 (Dynamic Policy Engine)**: Access policies must evaluate dynamic context including:
    *   Time-of-day access bounds.
    *   Minimum Device Trust Score requirement.
    *   Multi-factor enrollment enforcement.
*   **FR-2.3 (Quarantine Enforcement)**: If a device's trust score falls below 40, the system must immediately revoke active sessions and redirect the client to quarantine resolution guidelines.

### 3.3 Device Trust & Compliance Tracking (SM-S938U research baseline)
*   **FR-3.1 (Device Registration)**: End users must register their client devices. The registration must capture operating system, version, unique platform signature, and system integrity attestations *when available*.
*   **FR-3.2 (Trust Assessment)**: The system must execute trust score calculation using the following guidelines:
    *   OS is updated with current patch level (+30 pts).
    *   Device is not jailbroken or rooted (+30 pts).
    *   Valid device attestation token present (+40 pts).
*   **FR-3.3 (Hardware signal evaluation — target)**: For the SM-S938U research baseline, *when* hardware integration exists, trust assessment *should* evaluate:
    *   **Warranty void flag (e-fuse analog)**: Target value `0x0`. If blown (`0x1`), trust score drops to `0` (Quarantined). *Not implemented against live hardware today.*
    *   **Hardware-backed key storage**: Prefer keys in isolated storage (TrustZone / vendor vault when available). Current builds use a software emulator only.
    *   **SELinux State**: Prefer `Enforcing`.
    *   **Kernel integrity signals**: Prefer active real-time kernel protection when the platform exposes it.
*   **FR-3.4 (Firmware baseline verification — target)**: Match AP, BL, CP, and CSC hashes against an approved baseline when a signed firmware inventory is available. Custom ROM / unlocked-bootloader states fail policy when that evidence exists.
*   **FR-3.5 (Revocation)**: Administrators must have immediate capability to revoke a device certificate, isolating the associated device.

### 3.4 Immutable Auditing & Security Alerts
*   **FR-4.1 (Event Interception)**: The system must hook into all authentication, authorization, policy update, and device registration calls to write an event to the audit trail.
*   **FR-4.2 (Audit Log Formats)**: Each audit log entry must include:
    *   `Id` (UUID)
    *   `Timestamp` (UTC)
    *   `UserId` & `DeviceId`
    *   `Action` Name & `Outcome` (Success/Failure)
    *   `Details` (Structured JSON payload describing changes)
*   **FR-4.3 (Anomaly Alerts)**: The system must fire critical warnings under the following conditions:
    *   3 consecutive failed MFA verification attempts.
    *   A sudden drop in device trust score (>30 points).
    *   Attempts to modify global system security policies from an untrusted device.

---

## 4. Non-Functional Requirements & Hardware Constraints

### 4.1 SM-S938U Verizon research constraints (targets)
*   **Snapdragon 8 Elite (SM8750) Integration**: Prefer hardware-accelerated AES-256-GCM when available on target SoCs.
*   **Carrier radio standards**: Research baseline may track CTIA-style radio metrics for connectivity quality; this is **not** a claim of CTIA certification.
*   **Locked Bootloader Constraint**: For the Verizon research profile, unlocked bootloaders are treated as non-compliant when reliable signals exist.

### 4.2 Security
*   All communications in transit must be protected by TLS 1.3.
*   All user passwords must be hashed using BCrypt with a minimum work factor of 12.
*   Secrets, database credentials, and token-signing keys must never be committed to source repositories, remaining localized in `.env` configurations.

### 4.3 Performance
*   The API Gateway must process incoming authentication and policy check requests under 100 milliseconds at the 95th percentile.
*   Redis caches must keep cache-hit rates above 85% for active user authorizations.

### 4.4 Reliability & Persistence
*   PostgreSQL databases must use write-ahead logging (WAL) and persistent Docker volume storage to prevent data loss in the event of unexpected platform crashes.
