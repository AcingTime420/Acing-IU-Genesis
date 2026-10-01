-- Acing IU Genesis — 008_audit_immutable_grants.sql
-- Canonical audit-ledger hardening.
--
-- security_audit_logs is the only active application audit ledger.
-- Runtime producers may INSERT but may not read, update, delete, or truncate.
-- A dedicated NOLOGIN reader role is provided for a future authenticated,
-- privileged audit-query service. No such service is claimed operational here.

REVOKE ALL PRIVILEGES ON TABLE security_audit_logs FROM PUBLIC;
REVOKE SELECT, UPDATE, DELETE, TRUNCATE ON TABLE security_audit_logs
    FROM acing_identity, acing_device_trust;
GRANT INSERT ON TABLE security_audit_logs TO acing_identity, acing_device_trust;
GRANT USAGE, SELECT ON SEQUENCE security_audit_logs_id_seq
    TO acing_identity, acing_device_trust;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'acing_audit_reader') THEN
        CREATE ROLE acing_audit_reader NOLOGIN NOINHERIT;
    END IF;
END
$$;

REVOKE ALL PRIVILEGES ON TABLE security_audit_logs FROM acing_audit_reader;
GRANT SELECT ON TABLE security_audit_logs TO acing_audit_reader;

-- Older Genesis branches created a second audit_logs table. Do not destroy
-- possible historical data during upgrade, but remove application authority
-- if that legacy table exists.
DO $$
BEGIN
    IF to_regclass('public.audit_logs') IS NOT NULL THEN
        EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.audit_logs FROM PUBLIC';
        EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.audit_logs FROM acing_identity';
        EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.audit_logs FROM acing_device_trust';
        EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.audit_logs FROM acing_audit_reader';
        COMMENT ON TABLE audit_logs IS
            'Legacy Genesis audit table retained only for migration/history; not an active application ledger.';
    END IF;
END
$$;

-- Remove stale policy rows that appeared authoritative but were never consumed
-- by canonical runtime code. Requirements remain documented elsewhere until
-- implementation and tests exist.
DELETE FROM policy_configurations
WHERE policy_key IN (
    'device.trust.score.minimum',
    'mfa.enforcement.admin',
    'mfa.enforcement.operator',
    'password.policy',
    'session.timeout',
    'device.attestation.required',
    'audit.retention.days',
    'rate.limit.auth'
);

INSERT INTO schema_migrations (version, description)
VALUES ('008', 'canonical audit ledger grants and stale policy cleanup')
ON CONFLICT (version) DO NOTHING;
