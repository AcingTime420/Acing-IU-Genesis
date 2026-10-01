-- Acing IU Genesis — 006_security_policies_data.sql
-- Canonical runtime policy data only.
--
-- IMPORTANT: A database row is not evidence that a control is enforced.
-- Keep only keys consumed by canonical runtime code. Planned policy concepts
-- belong in documentation/requirements until an implementation reads and
-- enforces them with tests.

-- The canonical DeviceTrust service reads trust.score.threshold, created in
-- 000_security_core.sql. Preserve the value if it already exists; do not
-- introduce a second threshold key with a different JSON shape.
INSERT INTO policy_configurations (policy_key, policy_value, description)
VALUES (
    'trust.score.threshold',
    '{"minimum": 80}'::jsonb,
    'DeviceTrust posture threshold. This is a scoring threshold, not an authorization decision.'
)
ON CONFLICT (policy_key) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO schema_migrations (version, description)
VALUES ('006', 'canonical runtime policy configuration')
ON CONFLICT (version) DO NOTHING;
