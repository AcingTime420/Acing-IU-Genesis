# Database Design Specifications — Acing IU

This document details the schema layout, relational structure, and table configurations for the **Acing IU** PostgreSQL 16 database.

---

## 1. Entity-Relationship Outline

Acing IU uses clean, fully normalization-compliant tables managed with UUIDs, foreign key cascades, and consistent indexing to protect session tracking and audit logs.

```text
  +------------------+         +------------------+         +------------------+
  |      roles       |         |      users       |         |     devices      |
  +------------------+         +------------------+         +------------------+
  | id (UUID) [PK]   |         | id (UUID) [PK]   |         | id (UUID) [PK]   |
  | name (VARCHAR)   |         | email (VARCHAR)  |         | user_id (UUID)   |<----+
  +--------+---------+         | pass_hash (TEXT) |         | platform (VARCHR)|     |
           |                   +--------+---------+         | OS_version (VCH) |     |
           |                            |                   | trust_score (INT)|     |
           |                            |                   +--------+---------+     |
           | Many-to-Many               |                            |               |
           v                            | Many-to-One                | One-to-Many   |
  +------------------+                  v                            v               |
  |  user_roles      |         +------------------+         +------------------+     |
  +------------------+         |     sessions     |         |  device_certs    |     |
  | user_id [FK]     |         +------------------+         +------------------+     |
  | role_id [FK]     |         | id (UUID) [PK]   |         | id (UUID) [PK]   |     |
  +------------------+         | user_id (UUID)   |         | device_id [FK]   |-----+
                               | device_id (UUID) |         | active (BOOLEAN) |
                               +------------------+         +------------------+
```

---

## 2. Core Security SQL Schema DDL (`000_security_core.sql`)

Below is the structured, production-grade migration layout designed to run inside the PostgreSQL 16 local environment:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES TABLE
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. USER_ROLES JOIN TABLE
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 4. DEVICES TABLE
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    platform VARCHAR(50) NOT NULL, -- iOS, Android, Windows, macOS, Linux
    os_version VARCHAR(50) NOT NULL,
    app_version VARCHAR(50) NOT NULL,
    trust_score INT NOT NULL DEFAULT 100 CHECK (trust_score BETWEEN 0 AND 100),
    is_quarantined BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. DEVICE_CERTIFICATES TABLE
CREATE TABLE device_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. SESSIONS & REFRESH TOKENS TABLE
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. MFA SECRETS TABLE
CREATE TABLE mfa_secrets (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    secret_key VARCHAR(128) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    recovery_codes TEXT NOT NULL, -- Comma-separated or encrypted values
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. POLICIES TABLE
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    min_trust_score INT DEFAULT 70 CHECK (min_trust_score BETWEEN 0 AND 100),
    require_mfa BOOLEAN DEFAULT TRUE,
    allowed_roles VARCHAR(255), -- Comma-separated list of role names
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. AUDIT_LOGS TABLE
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- NULL for anonymous events (failed logins)
    device_id UUID,
    action VARCHAR(100) NOT NULL, -- "LOGIN_SUCCESS", "POLICY_MODIFIED", etc.
    status VARCHAR(50) NOT NULL, -- "SUCCESS", "FAILURE", "DENIED"
    details JSONB, -- Flexible payload for modifications, inputs
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. INDEXES FOR PERFORMANCE
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
```

---

## 3. Database Maintenance and Seed Logic

The PostgreSQL container starts and parses this SQL sequence automatically during initial bootstrap. Default roles (`Admin`, `Operator`, `User`) and a bootstrap administrator account are seeded using localized SQL inserts in subsequent migration blocks.
