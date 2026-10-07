-- Acing IU Genesis â€” 007_views_and_functions.sql
-- Requires: all previous migrations
-- Creates materialized views, stored functions for common queries and operations

-- View: Active device sessions
CREATE OR REPLACE VIEW active_device_sessions AS
SELECT
    d.id AS device_id,
    d.hw_identifier,
    d.owner_user_id,
    d.trust_score,
    d.last_seen_at,
    u.email,
    CASE
        WHEN d.last_seen_at > now() - INTERVAL '1 hour' THEN 'Active'
        WHEN d.last_seen_at > now() - INTERVAL '24 hours' THEN 'Recently Active'
        ELSE 'Inactive'
    END AS session_status
FROM registered_devices d
LEFT JOIN users u ON d.owner_user_id = u.id
WHERE d.created_at > now() - INTERVAL '30 days';

-- View: Audit log summary by action
CREATE OR REPLACE VIEW audit_summary_by_action AS
SELECT
    actor,
    event_type,
    severity,
    COUNT(*) AS count,
    DATE(MIN(created_at)) AS first_occurrence,
    DATE(MAX(created_at)) AS last_occurrence
FROM security_audit_logs
WHERE created_at > now() - INTERVAL '7 days'
GROUP BY actor, event_type, severity
ORDER BY count DESC;

-- Function: Update device trust score
CREATE OR REPLACE FUNCTION update_device_trust_score(
    p_device_id UUID,
    p_new_score INT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_quarantine BOOLEAN;
BEGIN
    v_quarantine := p_new_score < 40;

    UPDATE registered_devices
    SET
        trust_score = p_new_score,
        updated_at = now(),
        last_seen_at = now()
    WHERE id = p_device_id;

    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function: Record audit event
CREATE OR REPLACE FUNCTION record_audit_event(
    p_event_type TEXT,
    p_severity TEXT,
    p_actor TEXT,
    p_resource TEXT DEFAULT NULL,
    p_payload JSONB DEFAULT NULL,
    p_trace_id TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_id BIGINT;
BEGIN
    INSERT INTO security_audit_logs (event_type, severity, actor, resource_accessed, payload, trace_id)
    VALUES (p_event_type, p_severity, p_actor, p_resource, p_payload, p_trace_id)
    RETURNING id INTO v_id;

    RETURN v_id;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION update_device_trust_score(UUID, INT) TO acing_device_trust;
GRANT EXECUTE ON FUNCTION record_audit_event(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT) TO acing_identity, acing_device_trust;

-- Grant select on views
GRANT SELECT ON active_device_sessions TO acing_identity, acing_device_trust;
GRANT SELECT ON audit_summary_by_action TO acing_identity;

INSERT INTO schema_migrations (version, description)
VALUES ('007', 'materialized views and stored functions')
ON CONFLICT (version) DO NOTHING;
