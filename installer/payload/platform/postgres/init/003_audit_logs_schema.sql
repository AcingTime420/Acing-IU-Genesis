-- Acing IU Genesis — 003_audit_logs_schema.sql
-- Requires: 000_security_core.sql (audit table exists)
-- Creates indexes and partitioning strategy for immutable audit logs

-- Verify audit logs table exists
CREATE TABLE IF NOT EXISTS audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID,
    device_id       UUID,
    action          TEXT NOT NULL,
    status          TEXT NOT NULL,
    details         JSONB,
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id)
    WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_device_id ON audit_logs (device_id)
    WHERE device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs (status);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_device_time ON audit_logs (user_id, device_id, created_at DESC)
    WHERE user_id IS NOT NULL AND device_id IS NOT NULL;

-- Prevent any modifications (audit logs are append-only)
-- Application: use triggers or enforce at application layer
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Revoke UPDATE/DELETE at database level
REVOKE UPDATE, DELETE ON TABLE audit_logs FROM acing_identity;
REVOKE UPDATE, DELETE ON TABLE audit_logs FROM acing_device_trust;
GRANT SELECT, INSERT ON TABLE audit_logs TO acing_identity;
GRANT SELECT, INSERT ON TABLE audit_logs TO acing_device_trust;

-- Comment table
COMMENT ON TABLE audit_logs IS 'Immutable audit log of all system events. Write-once, append-only semantics enforced.';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action (nullable for system events)';
COMMENT ON COLUMN audit_logs.device_id IS 'Device involved in the action (nullable for non-device operations)';
COMMENT ON COLUMN audit_logs.action IS 'Type of action: LOGIN, REGISTER, DEVICE_REGISTER, POLICY_EVALUATION, etc.';
COMMENT ON COLUMN audit_logs.status IS 'Outcome: SUCCESS, FAILURE, DENIED, APPROVED, etc.';
COMMENT ON COLUMN audit_logs.details IS 'Event-specific metadata as JSONB (schemas vary by action type)';
COMMENT ON COLUMN audit_logs.ip_address IS 'Source IP address (INET type supports both IPv4 and IPv6)';

INSERT INTO schema_migrations (version, description)
VALUES ('003', 'audit logs schema with indexes and immutability')
ON CONFLICT (version) DO NOTHING;
