-- Acing IU Genesis â€” 002_roles_and_grants.sql
-- Least-privilege roles. Passwords injected via env at bootstrap (see 003 or init wrapper).
-- Default bootstrap uses roles created with login + password from compose env substitution
-- in infrastructure/postgres/init/002 â€” this IRP copy documents the grant model.
--
-- Roles:
--   acing_migrator     â€” DDL + data for migrations only
--   acing_identity     â€” Identity API runtime
--   acing_device_trust â€” Device Trust API runtime

-- Role creation is idempotent; passwords set by bootstrap script using env
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'acing_migrator') THEN
        CREATE ROLE acing_migrator LOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'acing_identity') THEN
        CREATE ROLE acing_identity LOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'acing_device_trust') THEN
        CREATE ROLE acing_device_trust LOGIN;
    END IF;
END
$$;

-- CONNECT on database is granted by bootstrap shell (needs concrete DB name).
GRANT USAGE ON SCHEMA public TO acing_identity, acing_device_trust;
GRANT USAGE, CREATE ON SCHEMA public TO acing_migrator;

-- Migrator: full DDL on public schema objects
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO acing_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO acing_migrator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO acing_migrator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO acing_migrator;

-- Identity runtime
GRANT SELECT, INSERT, UPDATE ON TABLE users TO acing_identity;
GRANT SELECT, INSERT, DELETE ON TABLE user_roles_mapping TO acing_identity;
GRANT SELECT, INSERT, UPDATE ON TABLE refresh_tokens TO acing_identity;
GRANT USAGE, SELECT ON SEQUENCE refresh_tokens_id_seq TO acing_identity;
GRANT SELECT ON TABLE policy_configurations TO acing_identity;
GRANT SELECT ON TABLE registered_devices TO acing_identity;
-- Audit: insert-only (no UPDATE/DELETE)
GRANT INSERT ON TABLE security_audit_logs TO acing_identity;
GRANT USAGE, SELECT ON SEQUENCE security_audit_logs_id_seq TO acing_identity;

-- Device Trust runtime
GRANT SELECT, INSERT, UPDATE ON TABLE registered_devices TO acing_device_trust;
GRANT SELECT ON TABLE policy_configurations TO acing_device_trust;
GRANT SELECT ON TABLE users TO acing_device_trust; -- owner linkage only
GRANT INSERT ON TABLE security_audit_logs TO acing_device_trust;
GRANT USAGE, SELECT ON SEQUENCE security_audit_logs_id_seq TO acing_device_trust;

-- Explicitly revoke dangerous rights if role was previously over-privileged
REVOKE UPDATE, DELETE ON TABLE security_audit_logs FROM acing_identity;
REVOKE UPDATE, DELETE ON TABLE security_audit_logs FROM acing_device_trust;
REVOKE ALL ON TABLE schema_migrations FROM acing_identity, acing_device_trust;
GRANT SELECT ON TABLE schema_migrations TO acing_migrator;

INSERT INTO schema_migrations (version, description)
VALUES ('002', 'least-privilege roles and grants')
ON CONFLICT (version) DO NOTHING;
