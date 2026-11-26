-- Acing IU Genesis — 005_mfa_secrets_encryption.sql
-- Requires: 001_init_identity_schema.sql (users table exists, pgcrypto from 000)
-- Implements envelope encryption for MFA secrets with key rotation support

-- MFA secret keys table (for key rotation)
CREATE TABLE IF NOT EXISTS mfa_encryption_keys (
    id              BIGSERIAL PRIMARY KEY,
    key_identifier  TEXT NOT NULL UNIQUE,
    key_material    BYTEA NOT NULL,  -- Encrypted with KMS or external service
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    rotated_at      TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    algorithm       TEXT NOT NULL DEFAULT 'AES-256-GCM'
);

CREATE INDEX IF NOT EXISTS idx_mfa_keys_active ON mfa_encryption_keys (is_active)
    WHERE is_active = true;

-- MFA secret ciphertexts (encrypted OTP secrets)
CREATE TABLE IF NOT EXISTS mfa_secrets_encrypted (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    ciphertext      BYTEA NOT NULL,
    iv              BYTEA NOT NULL,
    key_id          BIGINT NOT NULL REFERENCES mfa_encryption_keys(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    rotated_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mfa_secrets_user_id ON mfa_secrets_encrypted (user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_secrets_key_id ON mfa_secrets_encrypted (key_id);

-- MFA recovery codes (single-use, hashed)
CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash       TEXT NOT NULL UNIQUE,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mfa_recovery_user ON mfa_recovery_codes (user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_used ON mfa_recovery_codes (used_at)
    WHERE used_at IS NULL;

-- Comments
COMMENT ON TABLE mfa_encryption_keys IS 'Master encryption keys for MFA secrets (key rotation support)';
COMMENT ON COLUMN mfa_encryption_keys.key_material IS 'Encrypted key material (encrypt with external KMS in production)';
COMMENT ON TABLE mfa_secrets_encrypted IS 'Encrypted TOTP secrets; never store plaintext';
COMMENT ON TABLE mfa_recovery_codes IS 'Single-use recovery codes for MFA (hashed for prevention of exposure)';

-- Grants
GRANT SELECT, INSERT ON TABLE mfa_encryption_keys TO acing_identity;
GRANT SELECT, INSERT, UPDATE ON TABLE mfa_secrets_encrypted TO acing_identity;
GRANT SELECT, INSERT, UPDATE ON TABLE mfa_recovery_codes TO acing_identity;
GRANT USAGE, SELECT ON SEQUENCE mfa_encryption_keys_id_seq TO acing_identity;
GRANT USAGE, SELECT ON SEQUENCE mfa_recovery_codes_id_seq TO acing_identity;

INSERT INTO schema_migrations (version, description)
VALUES ('005', 'mfa secrets encryption and recovery codes')
ON CONFLICT (version) DO NOTHING;
