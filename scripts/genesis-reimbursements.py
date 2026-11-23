#!/usr/bin/env python3
"""Explicit local reimbursement fixture administration and human/agent API client.

Requires an existing private genesis-authority.py credential file. No model calls,
cloud access, autonomous approval, payment transfer, or service auto-start occurs.
The existing credential, loopback, environment and database guards are reused.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
from urllib.parse import quote
import uuid

_spec = importlib.util.spec_from_file_location("authority_cli", Path(__file__).with_name("genesis-authority.py"))
if _spec is None or _spec.loader is None:
    raise RuntimeError("Local authority client is unavailable.")
client = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(client)
PREFIX = "/v1/authority/reimbursements"


def identifier(value):
    parsed = uuid.UUID(value)
    if parsed.int == 0:
        raise ValueError("Nonempty UUID required.")
    return str(parsed)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:5088")
    parser.add_argument("--credentials", required=True)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("migrate")
    commands.add_parser("fixtures", help="Trusted SQL admin seeds synthetic org/project memberships only.")
    create = commands.add_parser("create")
    create.add_argument("--organization-id", required=True, type=identifier)
    create.add_argument("--project-id", required=True, type=identifier)
    create.add_argument("--category", required=True)
    create.add_argument("--amount-minor", type=int, required=True, help="USD cents; integer only.")
    propose = commands.add_parser("propose", help="Agent proposes one exact internal approval; never authorizes.")
    propose.add_argument("--reimbursement-id", type=identifier, required=True)
    propose.add_argument("--expected-version", type=int, default=0)
    propose.add_argument("--max-amount-minor", type=int, required=True)
    propose.add_argument("--ttl-seconds", type=int, default=600)
    propose.add_argument("--out", required=True)
    review = commands.add_parser("review")
    review.add_argument("--proposal-id", type=identifier, required=True)
    for name in ("approve", "reject"):
        command = commands.add_parser(name, help="Explicit human decision; exact-ID confirmation required.")
        command.add_argument("--proposal-id", type=identifier, required=True)
        command.add_argument("--confirm-exact-proposal", type=identifier, required=True)
    revoke = commands.add_parser("revoke")
    revoke.add_argument("--grant-id", type=identifier, required=True)
    revoke.add_argument("--reason", required=True)
    execute = commands.add_parser("execute", help="Agent execution; does not approve or expand scope.")
    execute.add_argument("--proposal-file", required=True)
    execute.add_argument("--grant-id", type=identifier, required=True)
    execute.add_argument("--key", required=True)
    lookup = commands.add_parser("reconcile")
    lookup.add_argument("--key", required=True)
    for name in ("record", "evidence"):
        command = commands.add_parser(name)
        command.add_argument("--reimbursement-id", type=identifier, required=True)
    args = parser.parse_args()
    client.development()
    if args.command == "migrate":
        client.sql((client.ROOT / "database/migrations/002_reimbursement_authority.sql").read_text(encoding="utf-8"))
        print("Opt-in reimbursement migration applied. No memberships granted.")
        return
    if args.command == "fixtures":
        # SQL interpolations below contain only generated UUIDs or SHA-256 hex.
        # Credentials remain private and are never printed or placed in SQL text.
        human = hashlib.sha256(client.token(args.credentials, "human").encode("utf-8")).hexdigest()
        agent = hashlib.sha256(client.token(args.credentials, "agent").encode("utf-8")).hexdigest()
        org, project = str(uuid.uuid4()), str(uuid.uuid4())
        client.sql(f"""
            BEGIN;
            DO $fixture$ BEGIN
                IF (SELECT count(*) FROM genesis_authority.principals WHERE enabled AND
                    ((kind='human' AND credential_hash=decode('{human}','hex')) OR
                     (kind='agent' AND credential_hash=decode('{agent}','hex')))) <> 2 THEN
                    RAISE EXCEPTION 'both existing enabled fixture principals required';
                END IF;
            END $fixture$;
            INSERT INTO genesis_reimbursements.organizations(id,name) VALUES ('{org}','Synthetic Genesis organization');
            INSERT INTO genesis_reimbursements.projects(id,organization_id,name)
                VALUES ('{project}','{org}','Project Phoenix');
            INSERT INTO genesis_reimbursements.memberships(organization_id,principal_id,role)
                SELECT '{org}',id,CASE WHEN kind='human' THEN 'manager' ELSE 'agent' END
                FROM genesis_authority.principals WHERE enabled AND
                    ((kind='human' AND credential_hash=decode('{human}','hex')) OR
                     (kind='agent' AND credential_hash=decode('{agent}','hex')));
            COMMIT;
        """)
        data = {"organizationId": org, "projectId": project, "mode": "Development/Test synthetic fixtures"}
    elif args.command == "create":
        data = client.api(args, "POST", PREFIX + "/records", "human", {
            "organizationId": args.organization_id, "projectId": args.project_id,
            "category": args.category, "amountMinor": args.amount_minor, "currency": "USD"})
    elif args.command == "propose":
        client.output_path(args.out)
        data = client.api(args, "POST", PREFIX + "/proposals", "agent", {
            "reimbursementId": args.reimbursement_id, "expectedVersion": args.expected_version,
            "maxAmountMinor": args.max_amount_minor, "ttlSeconds": args.ttl_seconds})
        client.save(args.out, data)
    elif args.command == "review":
        data = client.api(args, "GET", PREFIX + "/proposals/" + args.proposal_id, "human")
    elif args.command in ("approve", "reject"):
        if args.confirm_exact_proposal != args.proposal_id:
            raise ValueError("Confirmation must match the exact reviewed proposal ID.")
        data = client.api(args, "POST", PREFIX + "/proposals/" + args.proposal_id + "/decision", "human",
                          {"decision": "approved" if args.command == "approve" else "rejected"})
    elif args.command == "revoke":
        data = client.api(args, "POST", PREFIX + "/grants/" + args.grant_id + "/revoke", "human", {"reason": args.reason})
    elif args.command == "execute":
        p = json.loads(Path(args.proposal_file).read_text(encoding="utf-8"))
        body = {name: p[name] for name in ("organizationId", "projectId", "reimbursementId", "category",
                                          "amountMinor", "currency", "expectedVersion")}
        body.update(proposalId=p["id"], grantId=args.grant_id, operation="approve_reimbursement")
        data = client.api(args, "POST", PREFIX + "/execute", "agent", body, args.key)
    elif args.command == "reconcile":
        data = client.api(args, "GET", PREFIX + "/attempts/by-key?key=" + quote(args.key, safe=""), "agent")
    else:
        path = PREFIX + "/records/" + args.reimbursement_id
        data = client.api(args, "GET", path + ("/evidence" if args.command == "evidence" else ""), "human")
    print(json.dumps(data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, TypeError, OSError) as error:
        # Never echo arbitrary exception text that could contain credential-file data.
        print("Reimbursement command failed; check inputs, local setup and private credential permissions.", file=sys.stderr)
        sys.exit(1)
