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
    platform VARCHAR(50) NOT NULL DEFAULT 'Android',
    os_version VARCHAR(50) NOT NULL,
    app_version VARCHAR(50) NOT NULL,
    trust_score INT NOT NULL DEFAULT 100 CHECK (trust_score BETWEEN 0 AND 100),
    is_quarantined BOOLEAN DEFAULT FALSE,
    
    -- SM-S938U Knox & Telemetry baseline fields
    knox_warranty_void INT NOT NULL DEFAULT 0, -- 0 = Valid, 1 = Blown / Modified
    selinux_status VARCHAR(20) NOT NULL DEFAULT 'Enforcing', -- Enforcing, Permissive, Disabled
    tima_rkp_active BOOLEAN NOT NULL DEFAULT TRUE, -- Real-time kernel integrity
    bootloader_status VARCHAR(20) NOT NULL DEFAULT 'Locked', -- Locked, Unlocked
    ap_partition_hash VARCHAR(64), -- SHA-256 system partition signature
    cp_partition_hash VARCHAR(64), -- SHA-256 modem/baseband signature
    carrier_baseline_matched BOOLEAN NOT NULL DEFAULT TRUE, -- Matches certified Verizon image
    
    -- CTIA OTA Performance Telemetry fields
    ctia_trp_dbm NUMERIC(5,2), -- Total Radiated Power
    ctia_tis_dbm NUMERIC(5,2), -- Total Isotropic Sensitivity
    
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
    recovery_codes TEXT NOT NULL, -- Comma-separated recovery codes
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. POLICIES TABLE
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    min_trust_score INT DEFAULT 70 CHECK (min_trust_score BETWEEN 0 AND 100),
    require_mfa BOOLEAN DEFAULT TRUE,
    allowed_roles VARCHAR(255), -- Comma-separated list of allowed roles
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

-- SEED MOCK COMPLIANT RECORDS FOR TESTING
INSERT INTO roles (name, description) VALUES 
('Admin', 'Global system security administrator'),
('Operator', 'Platform compliance operator'),
('User', 'End user standard privilege');
