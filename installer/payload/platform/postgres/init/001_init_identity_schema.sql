-- Acing IU Genesis — 001_init_identity_schema.sql
-- Requires: 000_security_core.sql (citext, pgcrypto already created)

-- -------------------------------------------------------------------------
-- updated_at helper
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- Users (CITEXT required — extension created in 000)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email              CITEXT NOT NULL,
    password_hash      TEXT NOT NULL,
    mfa_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
    -- MFA seed: application-layer encryption required before production
    -- (see irp/02-database/MFA_SECRET_PROTECTION.md). Column holds ciphertext
    -- or envelope blob once encryption is enabled; never ship plaintext seeds.
    mfa_secret_base32  TEXT,
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_email_unique UNIQUE (email)
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS user_roles_mapping (
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_role  TEXT NOT NULL CHECK (assigned_role IN ('User','Operator','Admin')),
    PRIMARY KEY (user_id, assigned_role)
);

-- -------------------------------------------------------------------------
-- Refresh tokens
-- replaced_by references refresh_tokens.id (BIGSERIAL), not UUID
-- ip_address uses INET
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,
    family_id       UUID NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    replaced_by     BIGINT REFERENCES refresh_tokens(id),
    user_agent      TEXT,
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT refresh_tokens_expires_after_create CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_refresh_family ON refresh_tokens (family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_expires ON refresh_tokens (expires_at)
    WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_refresh_family_active ON refresh_tokens (family_id)
    WHERE revoked_at IS NULL;

-- -------------------------------------------------------------------------
-- Registered devices (Device Trust)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registered_devices (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hw_identifier             TEXT NOT NULL UNIQUE,
    soc_model                 TEXT NOT NULL,
    trust_score               INT NOT NULL DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
    selinux_status            TEXT NOT NULL DEFAULT 'Unknown',
    knox_warranty_fuse_blown  BOOLEAN NOT NULL DEFAULT FALSE,
    owner_user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    last_seen_at              TIMESTAMPTZ,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_devices_updated_at ON registered_devices;
CREATE TRIGGER trg_devices_updated_at
    BEFORE UPDATE ON registered_devices
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_devices_owner ON registered_devices (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_devices_score ON registered_devices (trust_score);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON registered_devices (last_seen_at DESC NULLS LAST);

INSERT INTO schema_migrations (version, description)
VALUES ('001', 'identity schema, devices, refresh tokens, updated_at triggers')
ON CONFLICT (version) DO NOTHING;
