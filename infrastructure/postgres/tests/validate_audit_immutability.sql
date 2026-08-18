-- PostgreSQL audit-ledger append-only integration test.
-- Run as the configured database administrator against a disposable database.
\set ON_ERROR_STOP on

DO $$
BEGIN
    IF NOT has_table_privilege('acing_identity', 'security_audit_logs', 'INSERT')
       OR has_table_privilege('acing_identity', 'security_audit_logs', 'UPDATE')
       OR has_table_privilege('acing_identity', 'security_audit_logs', 'DELETE')
       OR NOT has_table_privilege('acing_device_trust', 'security_audit_logs', 'INSERT')
       OR has_table_privilege('acing_device_trust', 'security_audit_logs', 'UPDATE')
       OR has_table_privilege('acing_device_trust', 'security_audit_logs', 'DELETE') THEN
        RAISE EXCEPTION 'security_audit_logs grant policy is not append-only for producer roles';
    END IF;
END
$$;

SET ROLE acing_identity;
INSERT INTO security_audit_logs (event_type, severity, actor)
VALUES ('IMMUTABILITY_INTEGRATION_TEST', 'INFO', 'postgres-integration-test');

DO $$
BEGIN
    BEGIN
        UPDATE security_audit_logs
        SET severity = 'WARNING'
        WHERE event_type = 'IMMUTABILITY_INTEGRATION_TEST';
        RAISE EXCEPTION 'UPDATE unexpectedly succeeded for acing_identity';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'UPDATE correctly rejected for acing_identity';
    END;

    BEGIN
        DELETE FROM security_audit_logs
        WHERE event_type = 'IMMUTABILITY_INTEGRATION_TEST';
        RAISE EXCEPTION 'DELETE unexpectedly succeeded for acing_identity';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'DELETE correctly rejected for acing_identity';
    END;
END
$$;
