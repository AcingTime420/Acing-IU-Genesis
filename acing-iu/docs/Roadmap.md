# Acing IU — Technical Roadmap

The implementation schedule for **Acing IU** is prioritized on building a robust, security-first baseline before introducing peripheral business capabilities.

---

## Roadmap Overview

```text
  Sprint S0: Foundations       Sprint S1: Security Center     Sprint S2: Device Center & AI
  [ Weeks 1 - 2 ]             [ Weeks 3 - 4 ]                [ Weeks 5 - 6 ]
  +----------------------+    +-------------------------+    +-------------------------+
  | - Docker Compose     |    | - MFA Setup & Verify    |    | - Device Enroll SDK     |
  | - Postgres Schema    | -> | - Policy Manager        | -> | - Dynamic Trust Scoring |
  | - ASP.NET Core API   |    | - Audit Log Viewer      |    | - AI Workspace Sandbox  |
  | - Next.js UI Setup   |    | - Security Alert Engine |    | - Monitoring (Grafana)  |
  +----------------------+    +-------------------------+    +-------------------------+
```

---

## 1. Phase details

### Phase 1: Sprint S0 — Core Infrastructure Foundations (Current Phase)
The objective of Sprint S0 is to orchestrate the entire development toolchain, local service stack, and default database schemas.

*   **Milestones**:
    *   **M1.1**: Repository folder orchestration completed.
    *   **M1.2**: `docker-compose.yml` operational (PostgreSQL 16, Redis 7, with persistent volumes and healthy probes).
    *   **M1.3**: Backend projects scaffolded in `.NET 8` (Gateway, Identity, Policy Engine, Auditing).
    *   **M1.4**: Frontend Next.js scaffold running in a development container.
    *   **M1.5**: Database initialization scripts (`000_security_core.sql`) applying cleanly to PostgreSQL.

---

### Phase 2: Sprint S1 — Authentication & Security Core
Enforces zero-trust controls, roles management, and Multi-Factor Authentication.

*   **Milestones**:
    *   **M2.1**: BCrypt password hashing and robust token creation endpoints (`/api/auth/register`, `/api/auth/login`).
    *   **M2.2**: Refresh token rotation and active blacklist caching using Redis.
    *   **M2.3**: Interactive MFA registration with Time-Based One-Time Passwords (TOTP) and offline backup recovery codes.
    *   **M2.4**: Role-Based Access Control (RBAC) middleware verifying endpoint requests dynamically.

---

### Phase 3: Sprint S2 — Device Trust & Policy Management
Completes Knox-style hardware profiling and policy evaluation engines.

*   **Milestones**:
    *   **M3.1**: Device registration schema and client-side system fingerprinting engine.
    *   **M3.2**: Device trust evaluation scoring formulas based on OS version, security patches, and attestation.
    *   **M3.3**: Flexible, database-backed Policy Manager UI.
    *   **M3.4**: Automated security events logging and high-risk threshold warning system.

---

### Phase 4: Sprint S3 — Observability, CI/CD, and Production Hardening
Polishes operation diagnostics and automates build verification pipelines.

*   **Milestones**:
    *   **M4.1**: Telemetry metrics exposure (Prometheus and Serilog structured logging).
    *   **M4.2**: Rich visual dashboards in Grafana monitoring auth failure spikes, trusted device ratios, and system health.
    *   **M4.3**: GitHub Actions CI/CD workflows validating codebase test compilation, secret auditing, and dependency scanning.

---

## 2. Definition of Done (DoD)

To mark a Sprint completed and ready for advancement, all components must meet these criteria:
1.  **Zero Warnings**: All codebase changes compile without critical compiler or linter errors.
2.  **Fully Testable**: Code maintains unit test coverage for core business rules (e.g. JWT token creation, Policy evaluators).
3.  **Docker Up-To-Date**: Local containers boot up in a single command (`docker compose up -d`) and pass health criteria.
4.  **No Leaked Secrets**: All sensitive tokens and keys are externalized into local configuration environments (`.env`, `appsettings.json`).
5.  **Audit Trails Checked**: Every new security-relevant action is confirmed to create a persistent record in the Postgres Audit table.
