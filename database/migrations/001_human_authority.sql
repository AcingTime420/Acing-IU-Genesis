-- Explicit local Development/Test migration; the service never applies migrations.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('genesis_authority:migration:001', 0));
DO $migration$
BEGIN
IF to_regclass('genesis_authority.schema_versions') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM genesis_authority.schema_versions WHERE version = 1) THEN
        RETURN;
    END IF;
    RAISE EXCEPTION 'authority schema exists without migration version 1';
END IF;
CREATE SCHEMA genesis_authority;

CREATE TABLE genesis_authority.schema_versions (
    version integer PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE genesis_authority.principals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kind text NOT NULL CHECK (kind IN ('human', 'agent')),
    display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 200),
    credential_hash bytea NOT NULL UNIQUE CHECK (octet_length(credential_hash) = 32),
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE genesis_authority.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
    title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
    content text NOT NULL CHECK (octet_length(content) <= 1048576),
    version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE genesis_authority.document_versions (
    document_id uuid NOT NULL REFERENCES genesis_authority.documents(id),
    version bigint NOT NULL CHECK (version >= 0),
    content text NOT NULL CHECK (octet_length(content) <= 1048576),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (document_id, version)
);

CREATE TABLE genesis_authority.proposals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
    document_id uuid NOT NULL REFERENCES genesis_authority.documents(id),
    operation text NOT NULL DEFAULT 'append' CHECK (operation = 'append'),
    text text NOT NULL CHECK (octet_length(text) BETWEEN 1 AND 8192),
    expected_version bigint NOT NULL CHECK (expected_version >= 0),
    expires_at timestamptz NOT NULL,
    single_use boolean NOT NULL DEFAULT true CHECK (single_use),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CHECK (expires_at > created_at AND expires_at <= created_at + interval '600 seconds'),
    UNIQUE (id, document_id, agent_id, expires_at)
);

CREATE TABLE genesis_authority.decisions (
    proposal_id uuid PRIMARY KEY REFERENCES genesis_authority.proposals(id),
    approver_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
    decision text NOT NULL CHECK (decision IN ('approved', 'rejected')),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (proposal_id, decision)
);

CREATE TABLE genesis_authority.grants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id uuid NOT NULL UNIQUE,
    document_id uuid NOT NULL,
    agent_id uuid NOT NULL,
    expires_at timestamptz NOT NULL,
    decision text NOT NULL DEFAULT 'approved' CHECK (decision = 'approved'),
    single_use boolean NOT NULL DEFAULT true CHECK (single_use),
    state text NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'consumed', 'revoked')),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    FOREIGN KEY (proposal_id, document_id, agent_id, expires_at)
        REFERENCES genesis_authority.proposals(id, document_id, agent_id, expires_at),
    FOREIGN KEY (proposal_id, decision)
        REFERENCES genesis_authority.decisions(proposal_id, decision)
);

CREATE TABLE genesis_authority.revocations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    grant_id uuid NOT NULL UNIQUE REFERENCES genesis_authority.grants(id),
    requester_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
    reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- Submitted target identifiers intentionally have no FK: random or mismatched IDs
-- must be durable denials, not referential-integrity errors or foreign disclosures.
CREATE TABLE genesis_authority.attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
    proposal_id uuid NOT NULL,
    grant_id uuid NOT NULL,
    document_id uuid NOT NULL,
    operation text NOT NULL CHECK (char_length(operation) <= 200),
    text text NOT NULL CHECK (octet_length(text) BETWEEN 1 AND 8192),
    expected_version bigint NOT NULL CHECK (expected_version >= 0),
    outcome text NOT NULL CHECK (outcome IN ('allowed', 'denied')),
    reason text NOT NULL,
    document_version bigint,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CHECK ((outcome = 'allowed' AND document_version IS NOT NULL AND document_version > 0)
        OR (outcome = 'denied' AND document_version IS NULL))
);

CREATE TABLE genesis_authority.idempotency (
    principal_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
    operation text NOT NULL CHECK (operation = 'execute'),
    key text NOT NULL CHECK (char_length(key) BETWEEN 1 AND 200),
    fingerprint bytea NOT NULL CHECK (octet_length(fingerprint) = 32),
    attempt_id uuid NOT NULL UNIQUE REFERENCES genesis_authority.attempts(id),
    response_status integer NOT NULL CHECK (response_status IN (200, 403)),
    response_body jsonb NOT NULL CHECK (jsonb_typeof(response_body) = 'object'),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (principal_id, operation, key)
);

CREATE TABLE genesis_authority.evidence (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid REFERENCES genesis_authority.documents(id),
    requester_id uuid NOT NULL REFERENCES genesis_authority.principals(id),
    approver_id uuid REFERENCES genesis_authority.principals(id),
    proposal_id uuid REFERENCES genesis_authority.proposals(id),
    grant_id uuid REFERENCES genesis_authority.grants(id),
    attempt_id uuid UNIQUE REFERENCES genesis_authority.attempts(id),
    action text NOT NULL,
    decision text CHECK (decision IN ('approved', 'rejected')),
    outcome text NOT NULL,
    details jsonb NOT NULL CHECK (jsonb_typeof(details) = 'object'),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX evidence_document_history ON genesis_authority.evidence(document_id, created_at, id);
CREATE INDEX proposals_document ON genesis_authority.proposals(document_id);

CREATE FUNCTION genesis_authority.reject_immutable_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'immutable authority record' USING ERRCODE = '23514';
END $$;

DO $$
DECLARE relation_name text;
BEGIN
    FOREACH relation_name IN ARRAY ARRAY[
        'schema_versions', 'document_versions', 'proposals', 'decisions',
        'revocations', 'attempts', 'idempotency', 'evidence'
    ] LOOP
        EXECUTE format('CREATE TRIGGER immutable_record BEFORE UPDATE OR DELETE ON genesis_authority.%I
            FOR EACH ROW EXECUTE FUNCTION genesis_authority.reject_immutable_change()', relation_name);
        EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON genesis_authority.%I
            FOR EACH STATEMENT EXECUTE FUNCTION genesis_authority.reject_immutable_change()', relation_name);
    END LOOP;
END $$;

CREATE FUNCTION genesis_authority.check_document() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF (NEW.id, NEW.owner_id, NEW.title, NEW.created_at)
            IS DISTINCT FROM (OLD.id, OLD.owner_id, OLD.title, OLD.created_at)
            OR NEW.version <> OLD.version + 1 THEN
            RAISE EXCEPTION 'immutable document metadata or invalid version' USING ERRCODE = '23514';
        END IF;
    ELSIF NEW.version <> 0 THEN
        RAISE EXCEPTION 'initial version must be zero' USING ERRCODE = '23514';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM genesis_authority.principals AS actor
        WHERE actor.id = NEW.owner_id AND actor.kind = 'human' AND actor.enabled) THEN
        RAISE EXCEPTION 'enabled human owner required' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER validate_document BEFORE INSERT OR UPDATE ON genesis_authority.documents
    FOR EACH ROW EXECUTE FUNCTION genesis_authority.check_document();
CREATE TRIGGER immutable_document_delete BEFORE DELETE ON genesis_authority.documents
    FOR EACH ROW EXECUTE FUNCTION genesis_authority.reject_immutable_change();
CREATE TRIGGER immutable_document_truncate BEFORE TRUNCATE ON genesis_authority.documents
    FOR EACH STATEMENT EXECUTE FUNCTION genesis_authority.reject_immutable_change();

CREATE FUNCTION genesis_authority.record_document_version() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO genesis_authority.document_versions(document_id, version, content)
        VALUES (NEW.id, NEW.version, NEW.content);
    RETURN NEW;
END $$;
CREATE TRIGGER record_version AFTER INSERT OR UPDATE ON genesis_authority.documents
    FOR EACH ROW EXECUTE FUNCTION genesis_authority.record_document_version();

CREATE FUNCTION genesis_authority.check_authority_actor() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_TABLE_NAME = 'proposals' THEN
        IF NOT EXISTS (SELECT 1 FROM genesis_authority.principals AS actor
            WHERE actor.id = NEW.agent_id AND actor.kind = 'agent' AND actor.enabled) THEN
            RAISE EXCEPTION 'enabled agent required' USING ERRCODE = '23514';
        END IF;
    ELSIF TG_TABLE_NAME = 'decisions' THEN
        IF NOT EXISTS (SELECT 1 FROM genesis_authority.proposals AS proposal
            JOIN genesis_authority.documents AS document ON document.id = proposal.document_id
            JOIN genesis_authority.principals AS actor ON actor.id = document.owner_id
            WHERE proposal.id = NEW.proposal_id AND actor.id = NEW.approver_id
                AND actor.kind = 'human' AND actor.enabled) THEN
            RAISE EXCEPTION 'enabled current human owner required' USING ERRCODE = '23514';
        END IF;
    ELSIF TG_TABLE_NAME = 'revocations' THEN
        IF NOT EXISTS (SELECT 1 FROM genesis_authority.grants AS authority_grant
            JOIN genesis_authority.documents AS document ON document.id = authority_grant.document_id
            JOIN genesis_authority.principals AS actor ON actor.id = document.owner_id
            WHERE authority_grant.id = NEW.grant_id AND actor.id = NEW.requester_id
                AND actor.kind = 'human' AND actor.enabled) THEN
            RAISE EXCEPTION 'enabled current human owner required' USING ERRCODE = '23514';
        END IF;
    ELSIF TG_TABLE_NAME = 'attempts' THEN
        IF NOT EXISTS (SELECT 1 FROM genesis_authority.principals AS actor
            WHERE actor.id = NEW.requester_id AND actor.kind = 'agent' AND actor.enabled) THEN
            RAISE EXCEPTION 'enabled agent required' USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER validate_proposal_actor BEFORE INSERT ON genesis_authority.proposals
    FOR EACH ROW EXECUTE FUNCTION genesis_authority.check_authority_actor();
CREATE TRIGGER validate_decision_actor BEFORE INSERT ON genesis_authority.decisions
    FOR EACH ROW EXECUTE FUNCTION genesis_authority.check_authority_actor();
CREATE TRIGGER validate_revocation_actor BEFORE INSERT ON genesis_authority.revocations
    FOR EACH ROW EXECUTE FUNCTION genesis_authority.check_authority_actor();
CREATE TRIGGER validate_attempt_actor BEFORE INSERT ON genesis_authority.attempts
    FOR EACH ROW EXECUTE FUNCTION genesis_authority.check_authority_actor();

CREATE FUNCTION genesis_authority.check_grant_transition() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.state <> 'active' THEN
            RAISE EXCEPTION 'initial grant must be active' USING ERRCODE = '23514';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM genesis_authority.decisions AS approval
            JOIN genesis_authority.documents AS document ON document.id = NEW.document_id
            JOIN genesis_authority.principals AS human ON human.id = approval.approver_id
            JOIN genesis_authority.principals AS agent ON agent.id = NEW.agent_id
            WHERE approval.proposal_id = NEW.proposal_id AND approval.decision = 'approved'
                AND human.id = document.owner_id AND human.kind = 'human' AND human.enabled
                AND agent.kind = 'agent' AND agent.enabled) THEN
            RAISE EXCEPTION 'enabled owner approval and agent required' USING ERRCODE = '23514';
        END IF;
    ELSIF (NEW.id, NEW.proposal_id, NEW.document_id, NEW.agent_id, NEW.expires_at,
            NEW.decision, NEW.single_use, NEW.created_at)
        IS DISTINCT FROM (OLD.id, OLD.proposal_id, OLD.document_id, OLD.agent_id, OLD.expires_at,
            OLD.decision, OLD.single_use, OLD.created_at)
        OR OLD.state <> 'active' OR NEW.state NOT IN ('consumed', 'revoked') THEN
        RAISE EXCEPTION 'immutable grant or invalid terminal transition' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER validate_grant BEFORE INSERT OR UPDATE ON genesis_authority.grants
    FOR EACH ROW EXECUTE FUNCTION genesis_authority.check_grant_transition();
CREATE TRIGGER immutable_grant_delete BEFORE DELETE ON genesis_authority.grants
    FOR EACH ROW EXECUTE FUNCTION genesis_authority.reject_immutable_change();
CREATE TRIGGER immutable_grant_truncate BEFORE TRUNCATE ON genesis_authority.grants
    FOR EACH STATEMENT EXECUTE FUNCTION genesis_authority.reject_immutable_change();

INSERT INTO genesis_authority.schema_versions(version) VALUES (1);
END
$migration$;
COMMIT;
