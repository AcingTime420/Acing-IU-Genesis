#!/usr/bin/env python3
"""Local authority administration and deterministic agent API client.

Human approval is a separate explicit command. No autonomous command approves.
Use private credential/output files outside the checkout; never send them to a
browser. This tool is restricted to isolated local Development/Test resources.
"""

import argparse
import hashlib
import http.client
import ipaddress
import json
import os
from pathlib import Path
import secrets
import stat
import subprocess
import sys
from urllib.parse import quote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PREFIX = "/v1/authority"


def development():
    if os.environ.get("ASPNETCORE_ENVIRONMENT") not in ("Development", "Test"):
        raise ValueError("Explicit ASPNETCORE_ENVIRONMENT=Development or Test required.")


def local_database():
    development()
    host = os.environ.get("PGHOST", "127.0.0.1")
    database = os.environ.get("PGDATABASE", "")
    if host not in ("127.0.0.1", "::1", "localhost", "/var/run/postgresql"):
        raise ValueError("Only loopback or the exact /var/run/postgresql socket is allowed.")
    if database not in ("genesis_authority_dev", "genesis_authority_test"):
        raise ValueError("Only genesis_authority_dev or genesis_authority_test is allowed.")
    user = os.environ.get("PGUSER")
    if not user:
        raise ValueError("PGUSER is required.")
    port = int(os.environ.get("PGPORT", "5432"))
    if not 1 <= port <= 65535:
        raise ValueError("Invalid PostgreSQL port.")
    env = {key: value for key, value in os.environ.items() if not key.startswith("PG")}
    env.update(PGHOST=host, PGPORT=str(port), PGDATABASE=database, PGUSER=user,
               PGCONNECT_TIMEOUT="5")
    for key in ("PGPASSWORD", "PGPASSFILE"):
        if key in os.environ:
            env[key] = os.environ[key]
    return env


def sql(text):
    result = subprocess.run(["psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1"],
                            input=text, text=True, env=local_database(),
                            capture_output=True, check=False)
    if result.returncode:
        raise ValueError("Local database operation failed; inspect database permissions/schema.")
    return result.stdout.strip()


def output_path(value):
    path = Path(value).expanduser().absolute()
    if path.is_relative_to(ROOT) or path.resolve().is_relative_to(ROOT):
        raise ValueError("Credential/output files must be outside the repository.")
    if path.exists() or path.is_symlink():
        raise ValueError("Output already exists; select a new private file.")
    if not path.parent.is_dir():
        raise ValueError("Create the private output directory first.")
    return path


def save(value, data):
    path = output_path(value)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as stream:
        json.dump(data, stream, ensure_ascii=False, indent=2)
        stream.write("\n")


def token(path, kind):
    path = Path(path).expanduser()
    if path.is_symlink() or stat.S_IMODE(path.stat().st_mode) & 0o077:
        raise ValueError("Credentials must be a private mode-0600 file, not a symlink.")
    return json.loads(path.read_text(encoding="utf-8"))[kind]["credential"]


def listener(value):
    url = urlsplit(value)
    if (url.scheme != "http" or url.username or url.password or
            url.path not in ("", "/") or url.query or url.fragment):
        raise ValueError("Use a plain local HTTP base URL without credentials or path/query/fragment.")
    try:
        loopback = ipaddress.ip_address(url.hostname).is_loopback
    except ValueError:
        loopback = url.hostname == "localhost"
    if not loopback:
        raise ValueError("API URL must use loopback.")
    return url.hostname, url.port or 80


def api(args, method, path, kind=None, body=None, key=None):
    host, port = listener(args.url)
    headers = {"Accept": "application/json"}
    if kind:
        headers["Authorization"] = "Bearer " + token(args.credentials, kind)
    if body is not None:
        headers["Content-Type"] = "application/json"
    if key:
        headers["Idempotency-Key"] = key
    connection = http.client.HTTPConnection(host, port, timeout=40)
    try:
        connection.request(method, path, headers=headers,
                           body=None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8"))
        response = connection.getresponse()
        raw = response.read()
        data = json.loads(raw) if raw else None
        if response.status >= 400:
            if key and response.status >= 500:
                print("Service uncertainty: reconcile the SAME key: " + key, file=sys.stderr)
            print(json.dumps({"httpStatus": response.status, "response": data}, indent=2))
            raise SystemExit(1)
        return data
    except (OSError, http.client.HTTPException, json.JSONDecodeError):
        if key:
            print("Transport uncertainty is not failure: reconcile the SAME key: " + key,
                  file=sys.stderr)
        raise ValueError("Could not confirm local API response.")
    finally:
        connection.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:5088")
    parser.add_argument("--credentials", default="/tmp/genesis-authority/credentials.json")
    commands = parser.add_subparsers(dest="command", required=True)
    for name in ("migrate", "fixtures", "serve", "health"):
        commands.add_parser(name)
    reset = commands.add_parser("reset", help="DESTRUCTIVE isolated authority-schema reset.")
    reset.add_argument("--confirm-database", required=True)
    create = commands.add_parser("create-document")
    create.add_argument("--title", default="Governed append test document")
    create.add_argument("--content-file", required=True)
    propose = commands.add_parser("propose", help="Agent proposes; never approves.")
    propose.add_argument("--document-id", required=True)
    propose.add_argument("--expected-version", type=int, required=True)
    propose.add_argument("--text-file", required=True)
    propose.add_argument("--ttl-seconds", type=int, default=600)
    propose.add_argument("--out", required=True)
    review = commands.add_parser("review")
    review.add_argument("--proposal-id", required=True)
    for name in ("approve", "reject"):
        decision = commands.add_parser(name, help="Explicit HUMAN decision.")
        decision.add_argument("--proposal-id", required=True)
        decision.add_argument("--confirm-exact-proposal", required=True)
    revoke = commands.add_parser("revoke")
    revoke.add_argument("--grant-id", required=True)
    revoke.add_argument("--reason", required=True)
    execute = commands.add_parser("execute", help="Agent executes reviewed exact input; never approves.")
    execute.add_argument("--proposal-file", required=True)
    execute.add_argument("--grant-id", required=True)
    execute.add_argument("--key", required=True)
    reconcile = commands.add_parser("reconcile")
    reconcile.add_argument("--key", required=True)
    for name in ("document", "evidence"):
        get = commands.add_parser(name)
        get.add_argument("--document-id", required=True)
    args = parser.parse_args()
    development()

    if args.command == "migrate":
        sql((ROOT / "database/migrations/001_human_authority.sql").read_text(encoding="utf-8"))
        print("Versioned authority migration applied explicitly.")
        return
    if args.command == "reset":
        env = local_database()
        if args.confirm_database != env["PGDATABASE"]:
            raise ValueError("Confirmation must exactly match PGDATABASE.")
        sql("DROP SCHEMA IF EXISTS genesis_authority CASCADE;")
        print("Local authority schema dropped; reapply migration and create NEW credentials.")
        return
    if args.command == "fixtures":
        output_path(args.credentials)
        values = {}
        inserts = []
        for kind, name in (("human", "Genesis Human Reviewer"),
                           ("agent", "Research Notes Agent (test identity)")):
            credential = secrets.token_urlsafe(32)
            digest = hashlib.sha256(credential.encode("utf-8")).hexdigest()
            inserts.append("INSERT INTO genesis_authority.principals(kind,display_name,credential_hash) "
                           f"VALUES ('{kind}','{name}',decode('{digest}','hex')) RETURNING id;")
            values[kind] = {"displayName": name, "credential": credential}
        ids = sql("BEGIN;\n" + "\n".join(inserts) + "\nCOMMIT;").splitlines()
        if len(ids) != 2:
            raise ValueError("Unexpected fixture result; credentials not printed.")
        for kind, identifier in zip(("human", "agent"), ids):
            values[kind]["id"] = identifier
        save(args.credentials, values)
        print("Distinct credentials written privately outside the repository.")
        return
    if args.command == "serve":
        pg = local_database()
        env = os.environ.copy()
        fields = [("Host", pg["PGHOST"]), ("Port", pg["PGPORT"]),
                  ("Database", pg["PGDATABASE"]), ("Username", pg["PGUSER"])]
        if "PGPASSWORD" in pg:
            fields.append(("Pass" + "word", pg["PGPASSWORD"]))
        if "PGPASSFILE" in pg:
            fields.append(("Passfile", pg["PGPASSFILE"]))
        env["ConnectionStrings__Default"] = ";".join(
            key + '="' + value.replace('"', '""') + '"' for key, value in fields)
        host, port = listener(args.url)
        env["ASPNETCORE_URLS"] = f"http://[{host}]:{port}" if ":" in host else f"http://{host}:{port}"
        os.execvpe("dotnet", ["dotnet", "run", "--no-launch-profile", "--project",
                            str(ROOT / "backend/HumanAuthority/HumanAuthority.csproj")], env)
    if args.command == "health":
        data = api(args, "GET", "/health/ready")
    elif args.command == "create-document":
        data = api(args, "POST", PREFIX + "/documents", "human",
                   {"title": args.title, "content": Path(args.content_file).read_bytes().decode("utf-8")})
    elif args.command == "propose":
        output_path(args.out)
        data = api(args, "POST", PREFIX + "/proposals", "agent",
                   {"documentId": args.document_id, "expectedVersion": args.expected_version,
                    "text": Path(args.text_file).read_bytes().decode("utf-8"), "ttlSeconds": args.ttl_seconds})
        save(args.out, data)
    elif args.command == "review":
        data = api(args, "GET", PREFIX + "/proposals/" + quote(args.proposal_id, safe=""), "human")
    elif args.command in ("approve", "reject"):
        if args.confirm_exact_proposal != args.proposal_id:
            raise ValueError("Human confirmation must exactly match the reviewed proposal ID.")
        data = api(args, "POST", PREFIX + "/proposals/" + quote(args.proposal_id, safe="") + "/decision",
                   "human", {"decision": "approved" if args.command == "approve" else "rejected"})
    elif args.command == "revoke":
        data = api(args, "POST", PREFIX + "/grants/" + quote(args.grant_id, safe="") + "/revoke",
                   "human", {"reason": args.reason})
    elif args.command == "execute":
        proposal = json.loads(Path(args.proposal_file).read_text(encoding="utf-8"))
        body = {key: proposal[key] for key in ("documentId", "text", "expectedVersion", "operation")}
        body.update(proposalId=proposal["id"], grantId=args.grant_id)
        data = api(args, "POST", PREFIX + "/execute", "agent", body, args.key)
    elif args.command == "reconcile":
        data = api(args, "GET", PREFIX + "/attempts/by-key?key=" + quote(args.key, safe=""), "agent")
    else:
        path = PREFIX + "/documents/" + quote(args.document_id, safe="")
        data = api(args, "GET", path + ("/evidence" if args.command == "evidence" else ""), "human")
    print(json.dumps(data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, OSError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
