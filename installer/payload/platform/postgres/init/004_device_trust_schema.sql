-- Acing IU Genesis — 004_device_trust_schema.sql
-- Requires: 001_init_identity_schema.sql (users table exists)
-- Creates reserved device-evidence tables. These tables are not proof of hardware attestation or active enforcement.

-- Devices table (extends registered_devices from 001)
CREATE TABLE IF NOT EXISTS device_telemetry (
    id                    BIGSERIAL PRIMARY KEY,
    device_id             UUID NOT NULL REFERENCES registered_devices(id) ON DELETE CASCADE,
    selinux_enforced      BOOLEAN NOT NULL DEFAULT FALSE,
    bootloader_locked     BOOLEAN NOT NULL DEFAULT FALSE,
    knox_warranty_valid   BOOLEAN NOT NULL DEFAULT TRUE,
    partition_verified    BOOLEAN NOT NULL DEFAULT FALSE,
    trust_score_delta     INT NOT NULL DEFAULT 0,
    submitted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT telemetry_score_range CHECK (trust_score_delta >= -100 AND trust_score_delta <= 100)
);

CREATE INDEX IF NOT EXISTS idx_device_telemetry_device_id ON device_telemetry (device_id);
CREATE INDEX IF NOT EXISTS idx_device_telemetry_submitted_at ON device_telemetry (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_telemetry_device_time ON device_telemetry (device_id, submitted_at DESC);

-- Device attestation records (for firmware validation)
CREATE TABLE IF NOT EXISTS device_attestations (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id             UUID NOT NULL REFERENCES registered_devices(id) ON DELETE CASCADE,
    attestation_type      TEXT NOT NULL CHECK (attestation_type IN ('TIMA_RKP', 'KNOX_ATTESTATION', 'BOOTLOADER', 'SYSTEM_PARTITION')),
    challenge_nonce       BYTEA NOT NULL,
    signed_response       BYTEA NOT NULL,
    is_valid              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at            TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_device_attestations_device_id ON device_attestations (device_id);
CREATE INDEX IF NOT EXISTS idx_device_attestations_type ON device_attestations (attestation_type);
CREATE INDEX IF NOT EXISTS idx_device_attestations_expires ON device_attestations (expires_at)
    WHERE is_valid = true;

-- Device quarantine log (audit trail for quarantine decisions)
CREATE TABLE IF NOT EXISTS device_quarantine_log (
    id                    BIGSERIAL PRIMARY KEY,
    device_id             UUID NOT NULL REFERENCES registered_devices(id) ON DELETE CASCADE,
    reason                TEXT NOT NULL,
    triggered_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    released_at           TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_quarantine_device_id ON device_quarantine_log (device_id);
CREATE INDEX IF NOT EXISTS idx_device_quarantine_active ON device_quarantine_log (device_id)
    WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_device_quarantine_created_at ON device_quarantine_log (created_at DESC);

-- Comments
COMMENT ON TABLE device_telemetry IS 'Reserved telemetry-history schema; canonical DeviceTrust currently updates registered_devices and does not use this table.';
COMMENT ON TABLE device_attestations IS 'Target attestation-evidence schema only; no hardware attestation provider is integrated or verified.';
COMMENT ON TABLE device_quarantine_log IS 'Target quarantine-history schema only; no live quarantine enforcement is established by this table.';

-- No runtime grants are issued here. These are target/reserved schemas until
-- an implementation, authorization model, and tests are added.
REVOKE ALL PRIVILEGES ON TABLE device_telemetry, device_attestations, device_quarantine_log
    FROM acing_device_trust;
REVOKE ALL PRIVILEGES ON SEQUENCE device_telemetry_id_seq, device_quarantine_log_id_seq
    FROM acing_device_trust;

INSERT INTO schema_migrations (version, description)
VALUES ('004', 'device trust telemetry and attestation schemas')
ON CONFLICT (version) DO NOTHING;
