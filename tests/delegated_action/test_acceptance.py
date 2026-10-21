#!/usr/bin/env python3
"""Local-only reference simulator; does not exercise Genesis application services.

Run with Python 3.11+: python3 tests/delegated_action/test_acceptance.py
Only synthetic expenses in a temporary SQLite database can be changed.
"""
from __future__ import annotations

import hashlib
import json
import secrets
import sqlite3
import tempfile
import threading
import time
import unittest
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from pathlib import Path


def digest(row: sqlite3.Row) -> str:
    """Bind approval to all material persisted inputs, including their revision."""
    fields = ("id", "project", "cents", "currency", "recipient", "eligible", "revision")
    payload = json.dumps({key: row[key] for key in fields}, sort_keys=True,
                         separators=(",", ":"))
    return hashlib.sha256(payload.encode()).hexdigest()


class ReferenceSimulator:
    """Test oracle only. Fixture credentials stand in for an identity boundary.

    BEGIN IMMEDIATE serializes grant checks, revocation, record updates and audit
    writes across connections. Successful commit is the linearization point.
    A database writer may bypass this model: no tamper resistance is claimed.
    """

    def __init__(self, path: Path):
        self.path = path
        self.manager = secrets.token_urlsafe(32)
        self.agent = secrets.token_urlsafe(32)
        self.outsider = secrets.token_urlsafe(32)
        self.other_human = secrets.token_urlsafe(32)
        self.identities = {
            self.manager: ("manager-sarah", "human", "Phoenix"),
            self.agent: ("agent-expenses", "agent", None),
            self.outsider: ("agent-outsider", "agent", None),
            self.other_human: ("manager-other", "human", "Other"),
        }
        with sqlite3.connect(path) as db:
            db.executescript("""
                CREATE TABLE expense (
                    id TEXT PRIMARY KEY, project TEXT NOT NULL,
                    cents INTEGER NOT NULL CHECK(cents > 0), currency TEXT NOT NULL,
                    recipient TEXT NOT NULL, eligible INTEGER NOT NULL,
                    revision INTEGER NOT NULL, status TEXT NOT NULL);
                CREATE TABLE authority_grant (
                    id TEXT PRIMARY KEY, approver TEXT NOT NULL, principal TEXT NOT NULL,
                    project TEXT NOT NULL, operation TEXT NOT NULL, maximum INTEGER NOT NULL,
                    currency TEXT NOT NULL, expires REAL NOT NULL, revoked INTEGER NOT NULL);
                CREATE TABLE approval (
                    id TEXT PRIMARY KEY, grant_id TEXT NOT NULL, expense_id TEXT NOT NULL,
                    fingerprint TEXT NOT NULL, approver TEXT NOT NULL);
                CREATE TABLE receipt (
                    request_id TEXT PRIMARY KEY, principal TEXT NOT NULL,
                    grant_id TEXT NOT NULL, approval_id TEXT NOT NULL,
                    expense_id TEXT NOT NULL, operation TEXT NOT NULL);
                CREATE TABLE evidence (
                    sequence INTEGER PRIMARY KEY, event_id TEXT UNIQUE NOT NULL,
                    time REAL NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL,
                    target TEXT NOT NULL, outcome TEXT NOT NULL,
                    details TEXT NOT NULL);
            """)

    @contextmanager
    def transaction(self):
        db = sqlite3.connect(self.path, timeout=10, isolation_level=None)
        db.row_factory = sqlite3.Row
        try:
            db.execute("BEGIN IMMEDIATE")
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    def actor(self, token):
        return self.identities.get(token, ("unrecognized", "unknown", None))

    def evidence(self, db, actor, action, target, outcome, **details):
        db.execute("INSERT INTO evidence VALUES(NULL,?,?,?,?,?,?,?)",
                   (secrets.token_hex(16), time.time(), actor, action, target,
                    outcome, json.dumps(details, sort_keys=True)))

    def seed(self, expense_id="e1", *, project="Phoenix", cents=20000,
             currency="USD", eligible=1):
        """Fixture setup only; deliberately excluded from the simulated agent API."""
        with self.transaction() as db:
            db.execute("INSERT INTO expense VALUES(?,?,?,?,?,?,1,'pending')",
                       (expense_id, project, cents, currency, "employee-fixture", eligible))

    def grant(self, token, *, expires=None, principal="agent-expenses"):
        actor, kind, project = self.actor(token)
        grant_id = secrets.token_hex(16)
        expires = time.time() + 3600 if expires is None else expires
        with self.transaction() as db:
            allowed = (kind == "human" and project == "Phoenix"
                       and principal == "agent-expenses" and expires > time.time())
            if allowed:
                db.execute("INSERT INTO authority_grant VALUES(?,?,?,?,?,?,?,?,0)",
                           (grant_id, actor, principal, project, "approve_expense",
                            50000, "USD", expires))
            self.evidence(db, actor, "grant", grant_id, "allowed" if allowed else "denied",
                          principal=principal, expires=expires)
        return grant_id if allowed else None

    def approve(self, token, grant_id, expense_id):
        actor, kind, project = self.actor(token)
        approval_id = secrets.token_hex(16)
        with self.transaction() as db:
            grant = db.execute("SELECT * FROM authority_grant WHERE id=?", (grant_id,)).fetchone()
            expense = db.execute("SELECT * FROM expense WHERE id=?", (expense_id,)).fetchone()
            allowed = bool(grant and expense and kind == "human"
                           and actor == grant["approver"] and project == expense["project"]
                           and not grant["revoked"] and grant["expires"] > time.time()
                           and expense["project"] == grant["project"]
                           and expense["cents"] <= grant["maximum"]
                           and expense["currency"] == grant["currency"]
                           and expense["eligible"] == 1 and expense["status"] == "pending")
            fingerprint = digest(expense) if expense else None
            if allowed:
                db.execute("INSERT INTO approval VALUES(?,?,?,?,?)",
                           (approval_id, grant_id, expense_id, fingerprint, actor))
            self.evidence(db, actor, "approve_operation", expense_id,
                          "allowed" if allowed else "denied", grant_id=grant_id,
                          approval_id=approval_id if allowed else None,
                          input_digest=fingerprint, input_origin="synthetic-human-fixture",
                          generated_fields=[])
        return approval_id if allowed else None

    def revoke(self, token, grant_id):
        actor, kind, _ = self.actor(token)
        with self.transaction() as db:
            grant = db.execute("SELECT * FROM authority_grant WHERE id=?", (grant_id,)).fetchone()
            allowed = bool(grant and kind == "human" and actor == grant["approver"])
            if allowed:
                db.execute("UPDATE authority_grant SET revoked=1 WHERE id=?", (grant_id,))
            self.evidence(db, actor, "revoke", grant_id, "allowed" if allowed else "denied")
        return allowed

    def execute(self, token, grant_id, approval_id, expense_id, request_id,
                operation="approve_expense"):
        actor, kind, _ = self.actor(token)
        with self.transaction() as db:
            grant = db.execute("SELECT * FROM authority_grant WHERE id=?", (grant_id,)).fetchone()
            approval = db.execute("SELECT * FROM approval WHERE id=?", (approval_id,)).fetchone()
            expense = db.execute("SELECT * FROM expense WHERE id=?", (expense_id,)).fetchone()
            receipt = db.execute("SELECT * FROM receipt WHERE request_id=?", (request_id,)).fetchone()
            reason = "allowed"
            if kind != "agent" or not grant or actor != grant["principal"]:
                reason = "principal_denied"
            elif grant["revoked"]:
                reason = "revoked"
            elif grant["expires"] <= time.time():
                reason = "expired"
            elif operation != grant["operation"]:
                reason = "operation_denied"
            elif not expense or expense["project"] != grant["project"]:
                reason = "resource_denied"
            elif (expense["cents"] > grant["maximum"]
                  or expense["currency"] != grant["currency"] or expense["eligible"] != 1):
                reason = "scope_denied"
            elif (not approval or approval["grant_id"] != grant_id
                  or approval["expense_id"] != expense_id
                  or approval["approver"] != grant["approver"]
                  or approval["fingerprint"] != digest(expense)):
                reason = "approval_denied"
            elif receipt:
                expected = (request_id, actor, grant_id, approval_id, expense_id, operation)
                reason = "replayed" if tuple(receipt) == expected else "request_conflict"
            elif expense["status"] != "pending":
                reason = "already_processed"

            if reason == "allowed":
                db.execute("UPDATE expense SET status='approved' WHERE id=?", (expense_id,))
                db.execute("INSERT INTO receipt VALUES(?,?,?,?,?,?)",
                           (request_id, actor, grant_id, approval_id, expense_id, operation))
            self.evidence(db, actor, "execute", expense_id, reason,
                          request_id=request_id, grant_id=grant_id, approval_id=approval_id,
                          operation=operation, input_digest=digest(expense) if expense else None,
                          verification="persisted-scope-and-approval-check",
                          mutation=reason == "allowed")
        return reason


class AcceptanceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="genesis-simulator-")
        self.addCleanup(self.temp.cleanup)
        self.model = ReferenceSimulator(Path(self.temp.name) / "synthetic.sqlite")
        self.model.seed()
        self.grant = self.model.grant(self.model.manager)
        self.approval = self.model.approve(self.model.manager, self.grant, "e1")

    def execute(self, **changes):
        args = dict(token=self.model.agent, grant_id=self.grant, approval_id=self.approval,
                    expense_id="e1", request_id="request-1")
        args.update(changes)
        return self.model.execute(**args)

    def query(self, sql, args=()):
        with sqlite3.connect(self.model.path) as db:
            return db.execute(sql, args).fetchall()

    def modify(self, sql, args=()):
        """Simulate trusted fixture edits and explicit fault injection."""
        with sqlite3.connect(self.model.path) as db:
            db.execute(sql, args)

    def assert_pending(self):
        self.assertEqual(self.query("SELECT status FROM expense WHERE id='e1'"), [("pending",)])

    def test_allowed(self):
        self.assertEqual(self.execute(), "allowed")
        self.assertEqual(self.query("SELECT status FROM expense"), [("approved",)])

    def test_no_grant(self):
        self.assertEqual(self.execute(grant_id="missing"), "principal_denied")
        self.assert_pending()

    def test_agent_cannot_grant_or_approve(self):
        self.assertIsNone(self.model.grant(self.model.agent))
        self.assertIsNone(self.model.approve(self.model.agent, self.grant, "e1"))

    def test_human_has_no_universal_authority(self):
        self.assertIsNone(self.model.grant(self.model.other_human))
        self.assertIsNone(self.model.approve(self.model.other_human, self.grant, "e1"))
        self.assertFalse(self.model.revoke(self.model.other_human, self.grant))

    def test_unrecognized_identity(self):
        self.assertEqual(self.execute(token="manager-sarah"), "principal_denied")
        self.assert_pending()

    def test_other_agent(self):
        self.assertEqual(self.execute(token=self.model.outsider), "principal_denied")
        self.assert_pending()

    def test_wrong_operation(self):
        self.assertEqual(self.execute(operation="pay_expense"), "operation_denied")
        self.assert_pending()

    def test_wrong_project(self):
        self.model.seed("other", project="Other")
        self.assertEqual(self.execute(expense_id="other"), "resource_denied")
        self.assertEqual(self.query("SELECT DISTINCT status FROM expense"), [("pending",)])

    def test_unknown_resource(self):
        self.assertEqual(self.execute(expense_id="missing"), "resource_denied")
        self.assertEqual(self.query("SELECT COUNT(*) FROM expense"), [(1,)])

    def test_over_limit(self):
        self.modify("UPDATE expense SET cents=70000 WHERE id='e1'")
        self.assertEqual(self.execute(), "scope_denied")
        self.assert_pending()

    def test_currency_and_eligibility(self):
        for column, value in (("currency", "EUR"), ("eligible", 0)):
            with self.subTest(column=column):
                # Column names are fixed test constants, never request inputs.
                self.modify(f"UPDATE expense SET {column}=? WHERE id='e1'", (value,))
                self.assertEqual(self.execute(), "scope_denied")
                self.assert_pending()
                self.modify("UPDATE expense SET currency='USD', eligible=1 WHERE id='e1'")

    def test_changed_material_inputs_need_new_approval(self):
        for column, value in (("cents", 21000), ("recipient", "another-fixture"), ("revision", 2)):
            with self.subTest(column=column):
                self.modify(f"UPDATE expense SET {column}=? WHERE id='e1'", (value,))
                self.assertEqual(self.execute(), "approval_denied")
                self.assert_pending()
                self.modify("UPDATE expense SET cents=20000,recipient='employee-fixture',revision=1")
        self.modify("UPDATE expense SET cents=21000,revision=2")
        approval = self.model.approve(self.model.manager, self.grant, "e1")
        self.assertEqual(self.execute(approval_id=approval), "allowed")

    def test_missing_approval(self):
        self.assertEqual(self.execute(approval_id="missing"), "approval_denied")
        self.assert_pending()

    def test_approval_cannot_cross_resources_or_grants(self):
        self.model.seed("e2")
        self.assertEqual(self.execute(expense_id="e2"), "approval_denied")
        another_grant = self.model.grant(self.model.manager)
        self.assertEqual(self.execute(grant_id=another_grant), "approval_denied")
        self.assert_pending()

    def test_revocation(self):
        self.assertTrue(self.model.revoke(self.model.manager, self.grant))
        self.assertEqual(self.execute(), "revoked")
        self.assert_pending()

    def test_expiry(self):
        # Set a past deadline directly; no timing-dependent sleep in this test.
        self.modify("UPDATE authority_grant SET expires=?", (time.time() - 1,))
        self.assertEqual(self.execute(), "expired")
        self.assert_pending()

    def test_retry_and_conflicting_request(self):
        self.assertEqual(self.execute(), "allowed")
        self.assertEqual(self.execute(), "replayed")
        self.model.seed("e2")
        other_approval = self.model.approve(self.model.manager, self.grant, "e2")
        self.assertEqual(self.execute(expense_id="e2", approval_id=other_approval), "request_conflict")
        self.assertEqual(self.query("SELECT status FROM expense WHERE id='e2'"), [("pending",)])
        self.assertEqual(self.query("SELECT COUNT(*) FROM receipt"), [(1,)])

    def test_revoked_retry_does_not_bypass_check(self):
        self.assertEqual(self.execute(), "allowed")
        self.model.revoke(self.model.manager, self.grant)
        self.assertEqual(self.execute(), "revoked")
        self.assertEqual(self.query("SELECT COUNT(*) FROM receipt"), [(1,)])

    def test_concurrent_retry(self):
        barrier = threading.Barrier(8)
        def attempt(_):
            barrier.wait(timeout=10)
            return self.execute()
        with ThreadPoolExecutor(max_workers=8) as pool:
            outcomes = list(pool.map(attempt, range(8)))
        self.assertEqual(outcomes.count("allowed"), 1)
        self.assertEqual(outcomes.count("replayed"), 7)
        self.assertEqual(self.query("SELECT COUNT(*) FROM receipt"), [(1,)])

    def test_concurrent_distinct_requests(self):
        barrier = threading.Barrier(2)
        def attempt(index):
            barrier.wait(timeout=10)
            return self.execute(request_id=f"request-{index}")
        with ThreadPoolExecutor(max_workers=2) as pool:
            outcomes = list(pool.map(attempt, range(2)))
        self.assertCountEqual(outcomes, ["allowed", "already_processed"])

    def test_revocation_race_has_consistent_durable_order(self):
        barrier = threading.Barrier(2)
        def execute():
            barrier.wait(timeout=10)
            return self.execute()
        def revoke():
            barrier.wait(timeout=10)
            return self.model.revoke(self.model.manager, self.grant)
        with ThreadPoolExecutor(max_workers=2) as pool:
            execution = pool.submit(execute)
            revocation = pool.submit(revoke)
            outcome = execution.result(timeout=20)
            self.assertTrue(revocation.result(timeout=20))
        events = self.query("SELECT action,outcome FROM evidence WHERE action IN ('execute','revoke') ORDER BY sequence")
        if outcome == "allowed":
            self.assertEqual(events, [("execute", "allowed"), ("revoke", "allowed")])
        else:
            self.assertEqual(outcome, "revoked")
            self.assertEqual(events, [("revoke", "allowed"), ("execute", "revoked")])
            self.assert_pending()
        self.assertEqual(self.execute(request_id="after-revoke"), "revoked")

    def test_audit_failure_rolls_back_mutation_and_receipt(self):
        self.modify("""CREATE TRIGGER fail_evidence BEFORE INSERT ON evidence
                       BEGIN SELECT RAISE(ABORT, 'injected audit failure'); END""")
        with self.assertRaises(sqlite3.IntegrityError):
            self.execute()
        self.assert_pending()
        self.assertEqual(self.query("SELECT COUNT(*) FROM receipt"), [(0,)])

    def test_evidence_survives_reopen_and_links_decisions(self):
        self.assertEqual(self.execute(token=self.model.outsider), "principal_denied")
        self.assertEqual(self.execute(), "allowed")
        rows = self.query("SELECT actor,action,target,outcome,details FROM evidence ORDER BY sequence")
        self.assertEqual(len(rows), 4)
        self.assertEqual(rows[0][:2], ("manager-sarah", "grant"))
        details = json.loads(rows[-1][4])
        self.assertEqual(details["grant_id"], self.grant)
        self.assertEqual(details["approval_id"], self.approval)
        self.assertEqual(details["request_id"], "request-1")
        self.assertEqual(len(details["input_digest"]), 64)
        self.assertNotIn(self.model.agent, json.dumps(rows))


if __name__ == "__main__":
    unittest.main(verbosity=2)
