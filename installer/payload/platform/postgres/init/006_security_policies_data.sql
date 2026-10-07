-- Acing IU Genesis — 006_security_policies_data.sql
-- Requires: 000_security_core.sql (policy_configurations exists)
-- Seeds default security policies for device trust and operations

-- Insert default policies
INSERT INTO policy_configurations (policy_key, policy_value, description)
VALUES
(
    'device.trust.score.minimum',
    '{"threshold": 80, "quarantine_below": 40}'::jsonb,
    'Minimum trust score thresholds for device compliance'
),
(
    'mfa.enforcement.admin',
    '{"required": true, "grace_period_days": 0}'::jsonb,
    'MFA enforcement policy for Admin role'
),
(
    'mfa.enforcement.operator',
    '{"required": true, "grace_period_days": 7}'::jsonb,
    'MFA enforcement policy for Operator role'
),
(
    'password.policy',
    '{"min_length": 12, "require_uppercase": true, "require_lowercase": true, "require_digit": true, "require_special": true, "history_count": 5}'::jsonb,
    'Password complexity and history requirements'
),
(
    'session.timeout',
    '{"access_token_minutes": 15, "refresh_token_days": 14}'::jsonb,
    'Session and token lifetime configuration'
),
(
    'device.attestation.required',
    '{"system_modification": true, "firmware_flash": true, "key_rotation": true}'::jsonb,
    'Hardware attestation requirements by operation type'
),
(
    'audit.retention.days',
    '{"default": 365, "compliance": 2555}'::jsonb,
    'Audit log retention periods (default: 1 year, compliance: 7 years)'
),
(
    'rate.limit.auth',
    '{"login_attempts": 5, "window_seconds": 300}'::jsonb,
    'Rate limiting for authentication endpoints'
)
ON CONFLICT (policy_key) DO NOTHING;

INSERT INTO schema_migrations (version, description)
VALUES ('006', 'default security policies and configuration')
ON CONFLICT (version) DO NOTHING;
