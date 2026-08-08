-- Genesis database constraint tests
-- Run after bootstrap as superuser / migrator. Expect failures on negative cases.
\set ON_ERROR_STOP on

-- Clean bootstrap marker
SELECT version FROM schema_migrations ORDER BY version;

-- Duplicate email case-insensitive (CITEXT)
DO $$
DECLARE
  uid uuid := gen_random_uuid();
BEGIN
  INSERT INTO users (id, email, password_hash) VALUES (uid, 'CaseTest@acing.iu', 'x');
  BEGIN
    INSERT INTO users (email, password_hash) VALUES ('casetest@acing.iu', 'y');
    RAISE EXCEPTION 'EXPECTED_FAIL: duplicate email allowed';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS: case-insensitive email unique';
  END;
  DELETE FROM users WHERE id = uid;
END $$;

-- Trust score bounds
DO $$
BEGIN
  BEGIN
    INSERT INTO registered_devices (hw_identifier, soc_model, trust_score)
    VALUES ('bad-score', 'x', 101);
    RAISE EXCEPTION 'EXPECTED_FAIL: trust_score 101 allowed';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: trust_score upper bound';
  END;
  BEGIN
    INSERT INTO registered_devices (hw_identifier, soc_model, trust_score)
    VALUES ('bad-score2', 'x', -1);
    RAISE EXCEPTION 'EXPECTED_FAIL: trust_score -1 allowed';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: trust_score lower bound';
  END;
END $$;

-- Invalid role
DO $$
DECLARE uid uuid := gen_random_uuid();
BEGIN
  INSERT INTO users (id, email, password_hash) VALUES (uid, 'rolecheck@acing.iu', 'x');
  BEGIN
    INSERT INTO user_roles_mapping (user_id, assigned_role) VALUES (uid, 'Superuser');
    RAISE EXCEPTION 'EXPECTED_FAIL: invalid role allowed';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: invalid role rejected';
  END;
  DELETE FROM users WHERE id = uid;
END $$;

-- Invalid audit severity
DO $$
BEGIN
  BEGIN
    INSERT INTO security_audit_logs (event_type, severity, actor) VALUES ('t', 'BANANA', 'x');
    RAISE EXCEPTION 'EXPECTED_FAIL: invalid severity allowed';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: invalid severity rejected';
  END;
END $$;

-- Refresh token replaced_by FK + expires_at integrity
DO $$
DECLARE
  uid uuid := gen_random_uuid();
  tid bigint;
BEGIN
  INSERT INTO users (id, email, password_hash) VALUES (uid, 'refresh@acing.iu', 'x');
  INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
  VALUES (uid, 'hash1', gen_random_uuid(), now() + interval '1 day')
  RETURNING id INTO tid;

  BEGIN
    INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at, replaced_by)
    VALUES (uid, 'hash2', gen_random_uuid(), now() + interval '1 day', 999999999);
    RAISE EXCEPTION 'EXPECTED_FAIL: invalid replaced_by allowed';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASS: invalid replaced_by rejected';
  END;

  BEGIN
    INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at, created_at)
    VALUES (uid, 'hash3', gen_random_uuid(), now() - interval '1 day', now());
    RAISE EXCEPTION 'EXPECTED_FAIL: expires_at before created_at allowed';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: expires_at > created_at enforced';
  END;

  DELETE FROM refresh_tokens WHERE user_id = uid;
  DELETE FROM users WHERE id = uid;
END $$;

-- Runtime role must not UPDATE/DELETE audit (run as acing_identity if password available)
-- Documented for CI; optional SET ROLE when passwords known:
-- SET ROLE acing_identity;
-- UPDATE security_audit_logs SET actor = 'x'; -- must fail

SELECT 'constraint_tests complete' AS status;
