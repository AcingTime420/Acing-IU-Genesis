-- Explicit local Development/Test migration. Apply 001_human_authority.sql first.
-- Internal approval records only: this schema cannot transfer money.
-- Membership and project administration are trusted local SQL fixture operations.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('genesis_reimbursements:migration:001', 0));
DO $migration$
BEGIN
    IF to_regclass('genesis_reimbursements.schema_versions') IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM genesis_reimbursements.schema_versions WHERE version = 1) THEN
            RETURN;
        END IF;
        RAISE EXCEPTION 'reimbursement schema exists without migration version 1';
    END IF;
    IF to_regclass('genesis_authority.schema_versions') IS NULL THEN
        RAISE EXCEPTION 'authority migration 001 must be applied first';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM genesis_authority.schema_versions WHERE version = 1) THEN
        RAISE EXCEPTION 'authority schema version 1 is required';
    END IF;

    CREATE SCHEMA genesis_reimbursements;
    CREATE TABLE genesis_reimbursements.schema_versions (
        version integer PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );
    CREATE TABLE genesis_reimbursements.organizations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
        enabled boolean NOT NULL DEFAULT true
    );
    CREATE TABLE genesis_reimbursements.memberships (
        organization_id uuid NOT NULL REFERENCES genesis_reimbursements.organizations(id),
        principal_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
        role text NOT NULL CHECK (role IN ('manager', 'member', 'agent')),
        enabled boolean NOT NULL DEFAULT true,
        PRIMARY KEY (organization_id, principal_id)
    );
    CREATE TABLE genesis_reimbursements.projects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES genesis_reimbursements.organizations(id),
        name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
        enabled boolean NOT NULL DEFAULT true,
        UNIQUE (organization_id, id)
    );
    CREATE TABLE genesis_reimbursements.reimbursements (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES genesis_reimbursements.organizations(id),
        project_id uuid NOT NULL,
        manager_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
        category text NOT NULL CHECK (char_length(category) BETWEEN 1 AND 100),
        amount_minor bigint NOT NULL CHECK (amount_minor BETWEEN 1 AND 1000000000000),
        currency text NOT NULL CHECK (currency = 'USD'),
        status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
        version bigint NOT NULL DEFAULT 0 CHECK (version IN (0, 1)),
        created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        UNIQUE (organization_id, id),
        CONSTRAINT reimbursement_exact_scope UNIQUE
            (organization_id, id, manager_id, project_id, category, amount_minor, currency),
        FOREIGN KEY (organization_id, project_id)
            REFERENCES genesis_reimbursements.projects(organization_id, id),
        CHECK ((status = 'pending' AND version = 0) OR (status = 'approved' AND version = 1))
    );
    CREATE TABLE genesis_reimbursements.proposals (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES genesis_reimbursements.organizations(id),
        reimbursement_id uuid NOT NULL,
        agent_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
        manager_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
        project_id uuid NOT NULL,
        category text NOT NULL CHECK (char_length(category) BETWEEN 1 AND 100),
        amount_minor bigint NOT NULL CHECK (amount_minor BETWEEN 1 AND 1000000000000),
        max_amount_minor bigint NOT NULL CHECK (max_amount_minor BETWEEN 1 AND 1000000000000),
        currency text NOT NULL CHECK (currency = 'USD'),
        expected_version bigint NOT NULL CHECK (expected_version >= 0),
        expires_at timestamptz NOT NULL,
        single_use boolean NOT NULL DEFAULT true CHECK (single_use),
        created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        UNIQUE (organization_id, id),
        UNIQUE (id, manager_id),
        CONSTRAINT proposal_exact_reimbursement_scope
            FOREIGN KEY (organization_id, reimbursement_id, manager_id, project_id, category, amount_minor, currency)
            REFERENCES genesis_reimbursements.reimbursements
                (organization_id, id, manager_id, project_id, category, amount_minor, currency),
        FOREIGN KEY (organization_id, project_id)
            REFERENCES genesis_reimbursements.projects(organization_id, id),
        CHECK (expires_at > created_at AND expires_at <= created_at + interval '600 seconds')
    );
    CREATE TABLE genesis_reimbursements.decisions (
        proposal_id uuid PRIMARY KEY,
        approver_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
        decision text NOT NULL CHECK (decision IN ('approved', 'rejected')),
        created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        FOREIGN KEY (proposal_id, approver_id)
            REFERENCES genesis_reimbursements.proposals(id, manager_id)
    );
    CREATE TABLE genesis_reimbursements.grants (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        proposal_id uuid NOT NULL UNIQUE REFERENCES genesis_reimbursements.decisions(proposal_id),
        state text NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'consumed', 'revoked')),
        created_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );
    CREATE TABLE genesis_reimbursements.revocations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        grant_id uuid NOT NULL UNIQUE REFERENCES genesis_reimbursements.grants(id),
        requester_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
        reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
        created_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );
    -- Submitted target IDs deliberately have no foreign keys: unknown or mismatched
    -- IDs must permit durable denials without linking a foreign organization's data.
    CREATE TABLE genesis_reimbursements.attempts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid REFERENCES genesis_reimbursements.organizations(id),
        requester_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
        proposal_id uuid NOT NULL,
        grant_id uuid NOT NULL,
        reimbursement_id uuid NOT NULL,
        outcome text NOT NULL CHECK (outcome IN ('allowed', 'denied')),
        reason text NOT NULL CHECK (reason IN ('authorized', 'authorization_denied')),
        reimbursement_version bigint,
        created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        CHECK ((outcome = 'allowed' AND reason = 'authorized' AND organization_id IS NOT NULL
                    AND reimbursement_version IS NOT NULL AND reimbursement_version = 1)
            OR (outcome = 'denied' AND reason = 'authorization_denied' AND reimbursement_version IS NULL))
    );
    CREATE TABLE genesis_reimbursements.idempotency (
        principal_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
        key text NOT NULL CHECK (char_length(key) BETWEEN 1 AND 200),
        fingerprint bytea NOT NULL CHECK (octet_length(fingerprint) = 32),
        attempt_id uuid NOT NULL UNIQUE REFERENCES genesis_reimbursements.attempts(id),
        response_status integer NOT NULL CHECK (response_status IN (200, 403)),
        response_body jsonb NOT NULL CHECK (jsonb_typeof(response_body) = 'object'),
        created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        PRIMARY KEY (principal_id, key)
    );
    CREATE TABLE genesis_reimbursements.evidence (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid REFERENCES genesis_reimbursements.organizations(id),
        reimbursement_id uuid,
        requester_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
        approver_id uuid REFERENCES genesis_authority.principals(id),
        proposal_id uuid,
        grant_id uuid REFERENCES genesis_reimbursements.grants(id),
        attempt_id uuid UNIQUE REFERENCES genesis_reimbursements.attempts(id),
        action text NOT NULL CHECK (char_length(action) BETWEEN 1 AND 200),
        outcome text NOT NULL CHECK (char_length(outcome) BETWEEN 1 AND 200),
        details jsonb NOT NULL CHECK (jsonb_typeof(details) = 'object'),
        created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        FOREIGN KEY (organization_id, reimbursement_id)
            REFERENCES genesis_reimbursements.reimbursements(organization_id, id),
        FOREIGN KEY (organization_id, proposal_id)
            REFERENCES genesis_reimbursements.proposals(organization_id, id)
    );
    CREATE INDEX reimbursement_evidence_history
        ON genesis_reimbursements.evidence(organization_id, reimbursement_id, created_at, id);
    CREATE INDEX reimbursement_proposals_resource
        ON genesis_reimbursements.proposals(organization_id, reimbursement_id);

    CREATE FUNCTION genesis_reimbursements.reject_immutable_change() RETURNS trigger
    LANGUAGE plpgsql AS $function$
    BEGIN
        RAISE EXCEPTION 'immutable reimbursement authority record' USING ERRCODE = '23514';
    END
    $function$;

    DECLARE
        relation_name text;
    BEGIN
        FOREACH relation_name IN ARRAY ARRAY[
            'schema_versions', 'proposals', 'decisions', 'revocations', 'attempts', 'idempotency', 'evidence'
        ] LOOP
            EXECUTE format('CREATE TRIGGER immutable_record BEFORE UPDATE OR DELETE ON genesis_reimbursements.%I
                FOR EACH ROW EXECUTE FUNCTION genesis_reimbursements.reject_immutable_change()', relation_name);
            EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON genesis_reimbursements.%I
                FOR EACH STATEMENT EXECUTE FUNCTION genesis_reimbursements.reject_immutable_change()', relation_name);
        END LOOP;
    END;

    CREATE FUNCTION genesis_reimbursements.check_reimbursement_transition() RETURNS trigger
    LANGUAGE plpgsql AS $function$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            IF NEW.status <> 'pending' OR NEW.version <> 0 THEN
                RAISE EXCEPTION 'initial reimbursement must be pending at version zero' USING ERRCODE = '23514';
            END IF;
        ELSIF (NEW.id, NEW.organization_id, NEW.project_id, NEW.manager_id, NEW.category,
                NEW.amount_minor, NEW.currency, NEW.created_at)
                IS DISTINCT FROM
              (OLD.id, OLD.organization_id, OLD.project_id, OLD.manager_id, OLD.category,
                OLD.amount_minor, OLD.currency, OLD.created_at)
            OR OLD.status <> 'pending' OR OLD.version <> 0 OR NEW.status <> 'approved' OR NEW.version <> 1 THEN
            RAISE EXCEPTION 'immutable reimbursement or invalid approval transition' USING ERRCODE = '23514';
        END IF;
        RETURN NEW;
    END
    $function$;
    CREATE TRIGGER validate_reimbursement BEFORE INSERT OR UPDATE ON genesis_reimbursements.reimbursements
        FOR EACH ROW EXECUTE FUNCTION genesis_reimbursements.check_reimbursement_transition();
    CREATE TRIGGER immutable_reimbursement_delete BEFORE DELETE ON genesis_reimbursements.reimbursements
        FOR EACH ROW EXECUTE FUNCTION genesis_reimbursements.reject_immutable_change();
    CREATE TRIGGER immutable_reimbursement_truncate BEFORE TRUNCATE ON genesis_reimbursements.reimbursements
        FOR EACH STATEMENT EXECUTE FUNCTION genesis_reimbursements.reject_immutable_change();

    CREATE FUNCTION genesis_reimbursements.check_grant_transition() RETURNS trigger
    LANGUAGE plpgsql AS $function$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            IF NEW.state <> 'active' OR NOT EXISTS (
                SELECT 1 FROM genesis_reimbursements.decisions
                WHERE proposal_id = NEW.proposal_id AND decision = 'approved'
            ) THEN
                RAISE EXCEPTION 'initial grant requires explicit approval' USING ERRCODE = '23514';
            END IF;
        ELSIF (NEW.id, NEW.proposal_id, NEW.created_at) IS DISTINCT FROM (OLD.id, OLD.proposal_id, OLD.created_at)
            OR OLD.state <> 'active' OR NEW.state NOT IN ('consumed', 'revoked') THEN
            RAISE EXCEPTION 'immutable grant or invalid terminal transition' USING ERRCODE = '23514';
        END IF;
        RETURN NEW;
    END
    $function$;
    CREATE TRIGGER validate_grant BEFORE INSERT OR UPDATE ON genesis_reimbursements.grants
        FOR EACH ROW EXECUTE FUNCTION genesis_reimbursements.check_grant_transition();
    CREATE TRIGGER immutable_grant_delete BEFORE DELETE ON genesis_reimbursements.grants
        FOR EACH ROW EXECUTE FUNCTION genesis_reimbursements.reject_immutable_change();
    CREATE TRIGGER immutable_grant_truncate BEFORE TRUNCATE ON genesis_reimbursements.grants
        FOR EACH STATEMENT EXECUTE FUNCTION genesis_reimbursements.reject_immutable_change();

    INSERT INTO genesis_reimbursements.schema_versions(version) VALUES (1);
END
$migration$;
COMMIT;
