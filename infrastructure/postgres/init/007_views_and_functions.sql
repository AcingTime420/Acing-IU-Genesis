-- Acing IU Genesis — 007_views_and_functions.sql
-- Canonical authority cleanup.
--
-- Earlier development branches created convenience views/functions that were
-- not consumed by canonical services. In particular, update_device_trust_score
-- could bypass the ownership-aware repository mutation boundary. New installs
-- must not create alternate write/read authority outside the application APIs.

DROP FUNCTION IF EXISTS update_device_trust_score(UUID, INT);
DROP FUNCTION IF EXISTS record_audit_event(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT);
DROP VIEW IF EXISTS active_device_sessions;
DROP VIEW IF EXISTS audit_summary_by_action;

INSERT INTO schema_migrations (version, description)
VALUES ('007', 'remove non-canonical database views and alternate authority functions')
ON CONFLICT (version) DO NOTHING;
