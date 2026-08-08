# Software Requirements Specification (SRS) for Acing IU

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the **Acing IU** platform. Acing IU is a high-security, Knox-inspired enterprise platform designed to coordinate user identity, device compliance metrics, policy decisions, and audit events to protect critical workspace operations. 

### 1.2 Scope
Acing IU comprises:
1.  An API Gateway controlling all ingress traffic.
2.  An Identity Provider (IdP) service with robust Multi-Factor Authentication (MFA).
3.  An Attribute-Based and Role-Based Authorization engine.
4.  A Device Trust service calculating dynamic client compliance profiles.
5.  An Immutable Auditing pipeline recording all transactional events.
6.  An interactive Next.js-based Security Dashboard displaying analytics, telemetry, and configuration settings.

This specification details the **SM-S938U Verizon baseline** (Samsung Galaxy S25 Ultra) as the primary secure endpoint reference, imposing hardware-specific Knox, carrier-locked bootloader, and radio performance constraints.

---

## 2. Overall Description

### 2.1 User Personas
*   **Acing Administrator**: Configures system policies, reviews audit logs, manages user roles, and modifies device trust assessment parameters.
*   **Platform Operator**: Enrolls devices, reviews security alerts, manages inventory, and handles quarantined devices.
*   **End User**: Authenticates via registered devices, manages local MFA profiles, and performs standard platform operations.

### 2.2 Knox-Inspired Trust Model
Access to any protected module (e.g., AI Research, Workspace data) is decided at runtime by evaluating:
$$\text{Access Granted} = f(\text{User Identity}, \text{MFA Completed}, \text{Device Trust Score} \ge \text{Policy Threshold})$$

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

### 3.3 Device Trust & Compliance Tracking (SM-S938U Baseline)
*   **FR-3.1 (Device Registration)**: End users must register their client devices. The registration must capture operating system, version, unique platform signature, and system integrity attestations.
*   **FR-3.2 (Trust Assessment)**: The system must execute trust score calculation using the following guidelines:
    *   OS is updated with current patch level (+30 pts).
    *   Device is not jailbroken or rooted (+30 pts).
    *   Valid device attestation token present (+40 pts).
*   **FR-3.3 (Hardware Attestation Enforcement)**: For the SM-S938U, the trust assessment must verify:
    *   **Knox Warranty Void (e-fuse)**: Must read `0x0`. If blown (`0x1`), trust score drops to `0` instantly (Quarantined status).
    *   **Qualcomm SPU (Secure Processing Unit) / Knox Vault State**: Enforce hardware-backed key storage integrity. Keys must reside strictly in Knox Vault.
    *   **SELinux State**: Must be strictly `Enforcing`.
    *   **TIMA / RKP Protection**: Real-time Kernel Protection status must be verified as active.
*   **FR-3.4 (Carrier Firmware Baseline Verification)**: The system must match the SM-S938U AP, BL, CP (Modem/Baseband), and CSC hashes against the certified Verizon firmware release. Any modification (custom ROM, unlocked bootloader attempts) fails policy evaluation.
*   **FR-3.5 (Revocation)**: Administrators must have immediate capability to revoke a device certificate, instantly isolating the associated device.

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

### 4.1 SM-S938U Verizon Hardware Constraints
*   **Snapdragon 8 Elite (SM8750) Integration**: Encryption routines (AES-256-GCM) must leverage hardware acceleration on the SM8750 SoC.
*   **Carrier Lock & Verizon Radio Standards**: Devices must maintain active cellular connection on Verizon's primary LTE/5G bands (B13, B66, n2, n5, n77, n260, n261). Radio performance metrics must align with CTIA standards to ensure secure over-the-air platform connectivity.
*   **Locked Bootloader Constraint**: Bootloader unlocking is strictly prohibited on the SM-S938U Verizon model. Firmware updates are validated through signed Verizon delta-OTAs.

### 4.2 Security
*   All communications in transit must be protected by TLS 1.3.
*   All user passwords must be hashed using BCrypt with a minimum work factor of 12.
*   Secrets, database credentials, and token-signing keys must never be committed to source repositories, remaining localized in `.env` configurations.

### 4.3 Performance
*   The API Gateway must process incoming authentication and policy check requests under 100 milliseconds at the 95th percentile.
*   Redis caches must keep cache-hit rates above 85% for active user authorizations.

### 4.4 Reliability & Persistence
*   PostgreSQL databases must use write-ahead logging (WAL) and persistent Docker volume storage to prevent data loss in the event of unexpected platform crashes.
