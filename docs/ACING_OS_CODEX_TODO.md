# ACING OS - SPRINT S0: SECURITY FOUNDATION
## MASTER CODEX IMPLEMENTATION CHECKLIST

> **INSTRUCTIONS FOR CODEX / AI DEVELOPER:**
> You are tasked with building the security-first foundation for **Acing OS**, a Knox-inspired, zero-trust architecture platform. 
> - **Execute the phases sequentially.** Do not skip any steps.
> - **Ensure absolute parity** between the database schemas and backend code.
> - **Write production-ready, clean, and secure code.** Do not use mock services unless explicitly told.
> - **Adhere strictly to the requested folder structure.**

---

## 📂 TARGET REPOSITORY STRUCTURE
All files created throughout these phases must align with the directory layout below:
```text
acing-os/
├── backend/
│   ├── AcingOS.Gateway/
│   ├── AcingOS.Identity/
│   ├── AcingOS.Security/
│   ├── AcingOS.DeviceTrust/
│   ├── AcingOS.Audit/
│   └── AcingOS.Shared/
├── frontend/
│   └── acing-os-ui/
├── database/
│   ├── migrations/
│   │   └── 000_security_core.sql
│   ├── seeds/
│   └── scripts/
├── infrastructure/
│   ├── docker/
│   │   ├── prometheus.yml
│   │   └── grafana/
│   └── deployment/
├── docs/
│   ├── architecture/
│   └── ACING_OS_CODEX_TODO.md
├── scripts/
│   ├── build-acingos.sh
│   ├── dev.sh
│   └── reset.sh
├── docker-compose.yml
└── .github/
    └── workflows/
        └── build.yml
```

---

## 🧭 SYSTEM ARCHITECTURE MAP
```text
                  ┌────────────────────────┐
                  │      User Browser      │
                  └───────────┬────────────┘
                              │ HTTPS
                              ▼
                  ┌────────────────────────┐
                  │   API Gateway (5000)   │
                  └───────────┬────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│Identity Service │  │  Device Trust   │  │  Policy Engine  │
│      (8081)     │  │  Service (8082) │  │  Service (8083) │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └───────────┬────────┴────────────────────┘
                     ▼
         ┌────────────────────────┐
         │ PostgreSQL DB (Port    │
         │ 5432 - Schema: 'acing')│
         └────────────────────────┘
```

---

## 🛠️ PHASE 0: WORKSPACE & DIRECTORY CREATION
Create the base project directory structure and solution wrappers on your local filesystem.

- [ ] **Step 0.1**: Initialize git repository:
  ```bash
  git init acing-os
  cd acing-os
  ```
- [ ] **Step 0.2**: Create the core folders:
  ```bash
  mkdir -p backend frontend database/migrations database/seeds infrastructure/docker/grafana scripts .github/workflows docs
  ```
- [ ] **Step 0.3**: Create a main .NET solution wrapper in `/backend`:
  ```bash
  cd backend
  dotnet new sln -n AcingOS
  cd ..
  ```
- [ ] **Step 0.4**: Write the base `.gitignore` file to ignore build files, `.env` files, node_modules, and user-specific configurations.

---

## 🐳 PHASE 1: DOCKER INFRASTRUCTURE FOUNDATION
Set up a unified Docker environment to start the entire backing stack (Database, Cache, and Monitoring) with one command.

- [ ] **Step 1.1**: Create `docker-compose.yml` in the root folder containing PostgreSQL, Redis, Prometheus, and Grafana:
  ```yaml
  version: "3.8"

  services:
    postgres:
      image: postgres:16-alpine
      container_name: acing-postgres
      restart: always
      environment:
        POSTGRES_USER: acing_admin
        POSTGRES_PASSWORD: KnoxMatrixSecurePass2026!
        POSTGRES_DB: acing_security
      ports:
        - "5432:5432"
      volumes:
        - pgdata:/var/lib/postgresql/data
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U acing_admin -d acing_security"]
        interval: 10s
        timeout: 5s
        retries: 5

    redis:
      image: redis:7-alpine
      container_name: acing-redis
      restart: always
      ports:
        - "6379:6379"
      volumes:
        - redisdata:/data
      healthcheck:
        test: ["CMD", "redis-cli", "ping"]
        interval: 10s
        timeout: 5s
        retries: 5

  volumes:
    pgdata:
    redisdata:
  ```
- [ ] **Step 1.2**: Test infrastructure startup:
  ```bash
  docker compose up -d
  docker compose ps
  ```

---

## 🗄️ PHASE 2: DATABASE MIGRATION `000_security_core.sql`
Create the relational database layout for Identity, MFA, Sessions, Audit trail, Policy engine, and Device attestation.

- [ ] **Step 2.1**: Create `/database/migrations/000_security_core.sql` with the following schema:
  ```sql
  -- Enable UUID Generation
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- 1. Identity Domain
  CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      mfa_enabled BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE roles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(50) UNIQUE NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE permissions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      code VARCHAR(100) UNIQUE NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE user_roles (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, role_id)
  );

  CREATE TABLE role_permissions (
      role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
      permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, permission_id)
  );

  -- 2. Sessions & Authentication Tokens
  CREATE TABLE sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      device_id VARCHAR(100) NOT NULL,
      ip_address VARCHAR(45),
      user_agent VARCHAR(255),
      token_hash VARCHAR(255) UNIQUE NOT NULL,
      is_revoked BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE refresh_tokens (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(500) UNIQUE NOT NULL,
      jwt_id VARCHAR(100) NOT NULL,
      is_used BOOLEAN DEFAULT FALSE,
      is_revoked BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE mfa_secrets (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      secret_key VARCHAR(128) NOT NULL,
      recovery_codes TEXT[] NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- 3. Samsung Knox-inspired Device Trust Domain
  CREATE TABLE devices (
      id VARCHAR(100) PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      platform VARCHAR(30) NOT NULL, -- e.g., Android, iOS, Linux
      os_version VARCHAR(30) NOT NULL,
      app_version VARCHAR(30) NOT NULL,
      registration_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, TRUSTED, BLOCKED, QUARANTINED
      last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE device_certificates (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      device_id VARCHAR(100) REFERENCES devices(id) ON DELETE CASCADE,
      serial_number VARCHAR(100) UNIQUE NOT NULL,
      x509_cert_pem TEXT NOT NULL,
      is_valid BOOLEAN DEFAULT TRUE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE device_trust_scores (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      device_id VARCHAR(100) REFERENCES devices(id) ON DELETE CASCADE,
      trust_score INT NOT NULL CHECK (trust_score >= 0 AND trust_score <= 100),
      root_detected BOOLEAN DEFAULT FALSE,
      integrity_verified BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- 4. Audit & Event Trail
  CREATE TABLE audit_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      target_resource VARCHAR(100) NOT NULL,
      ip_address VARCHAR(45),
      details JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE security_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      device_id VARCHAR(100) REFERENCES devices(id) ON DELETE SET NULL,
      severity VARCHAR(20) NOT NULL, -- INFO, WARNING, CRITICAL
      event_type VARCHAR(100) NOT NULL, -- e.g., PRIVILEGE_ESCALATION, SIGNATURE_MISMATCH
      message TEXT NOT NULL,
      is_resolved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- 5. Zero-Trust Access Policy Engine
  CREATE TABLE policies (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) UNIQUE NOT NULL,
      description VARCHAR(255),
      min_trust_score INT DEFAULT 90,
      require_mfa BOOLEAN DEFAULT TRUE,
      rules JSONB NOT NULL, -- Structured JSON mapping out network-IP lists or time windows
      is_enabled BOOLEAN DEFAULT TRUE
  );

  CREATE TABLE policy_results (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      device_id VARCHAR(100) REFERENCES devices(id) ON DELETE CASCADE,
      decision VARCHAR(20) NOT NULL, -- ALLOW, DENY
      evaluation_details JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  ```
- [ ] **Step 2.2**: Write seed data in `/database/seeds/001_seed_baseline.sql` to populate initial roles (`Admin`, `SecOps`, `Standard`), permissions (`users.read`, `policy.write`, `device.trust`), and a standard policy rule.

---

## ⚙️ PHASE 3: ASP.NET CORE 8 MICROSERVICES SETUP
Set up the core .NET Web API services that run under a unified API Gateway.

- [ ] **Step 3.1**: From `/backend`, create the standard microservices and shared project libraries:
  ```bash
  cd backend
  dotnet new webapi -n AcingOS.Gateway -f net8.0
  dotnet new webapi -n AcingOS.Identity -f net8.0
  dotnet new webapi -n AcingOS.Security -f net8.0
  dotnet new webapi -n AcingOS.DeviceTrust -f net8.0
  dotnet new classlib -n AcingOS.Shared
  ```
- [ ] **Step 3.2**: Add all projects to the main solution:
  ```bash
  dotnet sln AcingOS.sln add AcingOS.Gateway/AcingOS.Gateway.csproj
  dotnet sln AcingOS.sln add AcingOS.Identity/AcingOS.Identity.csproj
  dotnet sln AcingOS.sln add AcingOS.Security/AcingOS.Security.csproj
  dotnet sln AcingOS.sln add AcingOS.DeviceTrust/AcingOS.DeviceTrust.csproj
  dotnet sln AcingOS.sln add AcingOS.Shared/AcingOS.Shared.csproj
  ```
- [ ] **Step 3.3**: Configure cross-service references:
  - Reference `AcingOS.Shared` inside Gateway, Identity, Security, and DeviceTrust projects.
- [ ] **Step 3.4**: Import standard packages to `AcingOS.Shared`:
  - `Microsoft.AspNetCore.Authentication.JwtBearer`
  - `Npgsql.EntityFrameworkCore.PostgreSQL`
  - `BCrypt.Net-Next`
  - `Otp.NET` (for TOTP generation)

---

## 🔑 PHASE 4: AUTHENTICATION ENGINE
Implement the core signup, login, and secure token issuance using RS256 or secure HS256 JWT signatures.

- [ ] **Step 4.1**: In `AcingOS.Identity`, construct models mapped to the PostgreSQL database via Entity Framework Core (DbContext).
- [ ] **Step 4.2**: Implement password salting & hashing via BCrypt:
  ```csharp
  string hashedPassword = BCrypt.Net.BCrypt.HashPassword(rawPassword);
  bool isPasswordCorrect = BCrypt.Net.BCrypt.Verify(rawPassword, hashedPassword);
  ```
- [ ] **Step 4.3**: Write the `/api/auth/register` and `/api/auth/login` controllers. 
  - Login must generate both a JWT Access Token (expires in 15 minutes) containing role/permission claims, and a cryptographically random Refresh Token (expires in 7 days) stored in the Postgres database.
- [ ] **Step 4.4**: Implement `/api/auth/refresh` allowing users to swap valid refresh tokens for a brand new access/refresh pair (sliding session validity). Include **token reuse detection** to block access if an old refresh token is reused!

---

## 📱 PHASE 5: TWO-FACTOR TOTP MFA
Add secondary verification for all user log-ins to reach high security clearance levels.

- [ ] **Step 5.1**: Integrate `Otp.NET` into `AcingOS.Security`.
- [ ] **Step 5.2**: Create endpoints to manage MFA enrollment:
  - `POST /api/security/mfa/enable`: Generates a high-entropy base32 secret and corresponding 2FA onboarding URI (formatted for Google Authenticator / Authy app QR codes). Returns 10 static alphanumeric recovery codes.
  - `POST /api/security/mfa/verify`: Evaluates the current 6-digit verification code. If validated, flags the user's `mfa_enabled` database row as `TRUE`.
  - `POST /api/security/mfa/disable`: Revokes security keys. Requires active password and 6-digit token to confirm.

---

## 🔒 PHASE 6: ROLE-BASED ACCESS CONTROL (RBAC)
Build endpoint security ensuring that only authorized services can perform write, edit, or administrative tasks.

- [ ] **Step 6.1**: Implement custom ASP.NET Core authorization filters or policies:
  - Create a custom policy handler checking claims inside the incoming JWT token (e.g., matching permissions like `device.trust` or `policy.write`).
- [ ] **Step 6.2**: Add permission-based endpoint attributes to backend controllers:
  ```csharp
  [AuthorizePermission("policy.write")]
  [HttpPost("create")]
  public async Task<IActionResult> CreatePolicy([FromBody] PolicyDto dto) { ... }
  ```

---

## 📱 PHASE 7: KNOX-STYLE DEVICE TRUST
Map out hardware/app telemetry into a real-time integrity matrix verifying root access, signature matches, and custom trust score indices.

- [ ] **Step 7.1**: In `AcingOS.DeviceTrust`, implement a device verification service.
- [ ] **Step 7.2**: Design a **Trust Score Evaluation formula** (yielding a score between 0 and 100):
  - Base Score: `100`
  - Penalties:
    - Root Detected / Knox Bit Blown: `-60`
    - Debugging Enabled / Developer Options: `-20`
    - Outdated Security Patch: `-10`
    - Unsigned Application / Custom App Signature: `-30`
- [ ] **Step 7.3**: Create `POST /api/device/attest` endpoint where device agents send hardware telemetry payloads, recalculating trust scores and flagging compromised hardware as `QUARANTINED`.

---

## 🔍 PHASE 8: DYNAMIC POLICY ENGINE
Decide system access at the gate using context metrics: user identity + role permissions + device trust scores.

- [ ] **Step 8.1**: Create policy verification checks:
  ```csharp
  public class PolicyEngine {
      public bool EvaluateAccess(UserClaims user, DeviceTrustScore device, Policy rule) {
          if (rule.RequireMfa && !user.MfaVerified) return false;
          if (device.TrustScore < rule.MinTrustScore) return false;
          return true;
      }
  }
  ```
- [ ] **Step 8.2**: Log all allowance or rejection decisions straight to the `policy_results` table for security audit tracing.

---

## 📜 PHASE 9: AUDIT LOGGING & ALERTS
Track and lock down critical changes to users, devices, or access rules.

- [ ] **Step 9.1**: Create central audit logging middleware in `AcingOS.Gateway` recording user requests to `audit_logs` (IP address, user ID, requested endpoint, date, payload action).
- [ ] **Step 9.2**: Integrate real-time security alerts into the audit engine:
  - If a device trust score drops below 40, trigger a `CRITICAL` alert entry in the `security_events` table immediately.
  - If login fails 5 consecutive times on the same username within 5 minutes, generate a brute-force threshold alert.

---

## 🖥️ PHASE 10: NEXT.JS FRONTEND SECURITY DASHBOARD
Develop a secure Next.js web cockpit allowing administrators to overview identity, monitor trusted hardware, write policies, and track breaches.

- [ ] **Step 10.1**: Bootstrap the Next.js App Router workspace under `/frontend/acing-os-ui`.
- [ ] **Step 10.2**: Build interactive views:
  - `/security`: Overall command cockpit. Displays threat level, total active users, registered devices, trust-distribution breakdowns, and real-time security logs.
  - `/security/devices`: Grid of active machines showcasing OS platform, dynamic Knox trust status, and attestation logs.
  - `/security/policies`: Create/Edit panel to adjust dynamic system access rules (e.g., minimum required trust score sliders).
- [ ] **Step 10.3**: Save sorting configurations and session settings persistently to `localStorage` across page updates.

---

## 📊 PHASE 11: OBSERVABILITY (PROMETHEUS & GRAFANA)
Translate system events into visual, metric-driven telemetry alerts.

- [ ] **Step 11.1**: Set up Grafana metrics endpoints using `App.Metrics` or OpenTelemetry in C# APIs.
- [ ] **Step 11.2**: Deploy Prometheus/Grafana service containers inside `docker-compose.yml` mapped to trace authentication failures and attestation breaches.

---

## 🚀 PHASE 12: CI/CD WORKFLOW pipeline
Set up continuous testing and package containerization.

- [ ] **Step 12.1**: Write `.github/workflows/build.yml` executing:
  - Static code scanning (SAST)
  - Unit tests validation (`dotnet test`)
  - Multi-stage Docker builds of Gateway, Identity, and Security APIs
  - Package integrity validation

---

## ⚡ PHASE 13: AUTOMATED BOOTSTRAP SCRIPT
Write an automated script ensuring that any developer can download the repository and boot the security baseline in one click.

- [ ] **Step 13.1**: Create `/scripts/build-acingos.sh`:
  - Checks if Docker and .NET 8 SDK are installed.
  - Boots up all backing Docker containers.
  - Generates the security database structure and executes seed data migrations.
  - Builds and starts API Gateway and Security/Identity services.
  - Launches the Next.js UI frontend dashboard.
  - Outputs service routing addresses, endpoints, and credentials on screen.

---

## 🏁 PHASE 14: DEFINITION OF DONE (DOD)
Before declaring Sprint S0 complete, ensure that:
1. [ ] Core PostgreSQL DB starts and contains all 15 operational security schema tables.
2. [ ] Registration and authentication are fully functional with password hashing and JWT token rotation.
3. [ ] User can enable TOTP 2FA, register an app, and enforce MFA login constraints.
4. [ ] Devices successfully submit attestation telemetry, calculating dynamic trust score indices.
5. [ ] Unauthorized users or compromised devices (low trust score) are blocked at the Gateway.
6. [ ] Next.js Security Command Center successfully aggregates real-time system metrics.
