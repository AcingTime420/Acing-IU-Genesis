-- Acing IU Genesis — 000_security_core.sql
-- Bootstrap order: extensions → migration ledger → audit → policy
-- Applied on empty volume via docker-entrypoint-initdb.d AND/OR migrate.sh

-- Extensions MUST be first (citext required; no silent fallback)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Versioned migration ledger (upgrade mechanism)
CREATE TABLE IF NOT EXISTS schema_migrations (
    version     TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO schema_migrations (version, description)
VALUES ('000', 'extensions, migration ledger, audit, policy')
ON CONFLICT (version) DO NOTHING;

CREATE TABLE IF NOT EXISTS security_audit_logs (
    id                BIGSERIAL PRIMARY KEY,
    event_type        TEXT NOT NULL,
    severity          TEXT NOT NULL CHECK (severity IN ('DEBUG','INFO','WARNING','ERROR','CRITICAL')),
    actor             TEXT NOT NULL,
    resource_accessed TEXT,
    payload           JSONB,
    trace_id          TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    -- No updated_at: audit rows are append-only
);

CREATE INDEX IF NOT EXISTS idx_audit_event_type ON security_audit_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON security_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON security_audit_logs (actor);

CREATE TABLE IF NOT EXISTS policy_configurations (
    policy_key   TEXT PRIMARY KEY,
    policy_value JSONB NOT NULL,
    description  TEXT,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO policy_configurations (policy_key, policy_value, description)
VALUES (
    'trust.score.threshold',
    '{"minimum": 80}'::jsonb,
    'Minimum trust score required for Allowed=true on device telemetry'
)
ON CONFLICT (policy_key) DO NOTHING;
