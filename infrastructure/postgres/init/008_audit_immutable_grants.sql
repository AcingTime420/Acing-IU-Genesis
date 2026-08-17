-- Acing IU Genesis â€” 008_audit_immutable_grants.sql
-- Enforces database-level append-only semantics for the canonical security audit ledger.
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE security_audit_logs FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE security_audit_logs FROM acing_identity;
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE security_audit_logs FROM acing_device_trust;
GRANT INSERT ON TABLE security_audit_logs TO acing_identity, acing_device_trust;
GRANT USAGE, SELECT ON SEQUENCE security_audit_logs_id_seq TO acing_identity, acing_device_trust;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'acing_audit_reader') THEN
        CREATE ROLE acing_audit_reader NOINHERIT;
    END IF;
END
$$;
REVOKE ALL ON TABLE security_audit_logs FROM acing_audit_reader;
GRANT SELECT ON TABLE security_audit_logs TO acing_audit_reader;
INSERT INTO schema_migrations (version, description)
VALUES ('008', 'security audit immutable grants and dedicated reader role')
ON CONFLICT (version) DO NOTHING;
