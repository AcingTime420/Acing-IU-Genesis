# Genesis human-authority UI prototype

**Status:** Frontend simulator only; not live and not enforced.
**Route:** `/genesis`
**Branch:** `prototype/human-authority-ui`

## Local startup and demonstration

```bash
cd frontend
npm ci
npm run dev
```

Open <http://localhost:3000/genesis>, or choose **Genesis Approval Demo** in the sidebar. The page is explicitly marked **MOCK MODE**. It uses only in-memory, local fixtures; reload the page to reset the scenario. No human sign-in is performed and the test agent is a separate fixture identity.

Suggested happy path:

1. Review the named test agent, fixed target document, append operation, expected version, expiration, single-use scope, and exact text.
2. Select **Approve exact proposal**; before that action no grant exists and execution is unavailable.
3. Select **Execute exact approved append**. The fixture appends once and consumes its mock grant.
4. Select **Check same attempt** to inspect the existing attempt; no duplicate append should appear. The adapter tests also retry the same key directly to verify the local idempotency demonstration.
5. Reload for other paths: reject before approval; revoke after approval; choose **Stale version**, **Expired grant**, or **Connection uncertain** before execution. On uncertain outcome choose **Check same attempt**, not a new operation. Changed-text and changed-destination probes demonstrate denial pending fresh review.

The selected conditions and fixture results are demonstrations only. They are not evidence of real authentication, authorization, execution, persistence, race safety, idempotency enforcement, or durable/tamper-proof audit records. The local countdown is not authoritative; only a future backend could decide expiry.

## Screenshots

Captured from the local prototype; each screenshot displays the mock-mode warning:

- [Pending proposal review](./screenshots/genesis-pending-review.webp)
- [Approved proposal and active mock grant](./screenshots/genesis-approved-state.webp)
- [Completed mock append and consumed mock grant](./screenshots/genesis-completed-state.webp)
- [Narrow-screen proposal view](./screenshots/genesis-mobile-review.png)

## Adapter and mode boundary

`frontend/src/lib/genesis-adapter.ts` defines the typed `GenesisAdapter` boundary and an in-memory `MockGenesisAdapter`. `UnconfiguredLiveGenesisAdapter` fails explicitly. It does **not** silently fall back to a mock success. No API endpoint, credential, or service secret is embedded in the frontend.

The repository's `acing-iu/docs/API.md` documents current identity/MFA routes but no agreed API for agent proposals, human decisions, scoped grants, revocation, execution, idempotency, or evidence. The dashboard is explicitly a simulator in `docs/CAPABILITY_REGISTER.md`; this prototype does not alter that classification.

## Proposed frontend data and operation requirements — PROPOSED, not authoritative

The following is a review checklist for the backend/API owners, **not an API contract**:

- Read a human-authenticated, named agent proposal with proposal ID; agent ID; target document ID and safe display content/version; operation; exact text; expiration; single-use scope; and current request state.
- Record an explicit human decision (approve/reject) associated with the authenticated human and proposal. Approval response must expose a server-owned grant ID and server-reported state/expiry; human and agent principals remain distinct.
- Revoke an active grant and return the server-reported result. Revocation must be checked atomically by the execution authority; it does not reverse prior completion.
- Execute only against a server-validated exact tuple: agent, grant, proposal, one document, append operation, exact content, expected document version, expiry, and single use. Return an unambiguous state, outcome, denial reason, resulting document version, and server timestamps.
- Accept a stable idempotency key for one unchanged execution attempt; reject key reuse with materially different inputs. Define retry behavior and retention for resolved and unresolved attempts.
- Provide an attempt lookup operation keyed to the existing attempt so the UI can reconcile a dropped connection without blindly issuing a different operation.
- Provide evidence fields where available: request/agent, proposal and grant IDs, authenticated approving human, decision/reason, requested operation/target, server time, execution state/outcome, and attempt ID. Define access control and retention; do not claim tamper-proof evidence without proof.
- Define typed error cases for unauthenticated/forbidden access, expiry, revocation, consumed grant, stale version, changed scope, conflict, validation failure, network uncertainty, and server failure.

Before connecting live mode, API/backend owners must agree on the schema, endpoint paths, authentication/session mechanism, status/error mapping, idempotency semantics, authorization timing and atomicity, and attempt-reconciliation behavior. Frontend does not own those backend semantics or the shared API contract.

## Tests and validation

The adapter tests use Node's built-in test runner and do not add dependencies:

```bash
cd frontend
npm run test:genesis
npm run lint
npx tsc --noEmit
npm run build
```

Run these from the project checkout; the commands report frontend checks only and do not verify backend enforcement.

## GitHub issue triage snapshot (2026-10-16)

The repository had one open issue in the inspected issue inventory:

- [#54 — Phase 0: repository control and stabilization baseline](https://github.com/AcingTime420/Acing-IU-Genesis/issues/54) — open, last updated 2026-10-08, currently unlabelled. Its latest note says the remaining action is owner/admin confirmation of `master` branch protection; the issue itself says the integration cannot inspect or change that setting. At eight days since update it is **not stale by a 30-day inactivity threshold**; it is blocked on an owner-only verification.
- Suggested labels (existing repository labels): `security`, `help wanted` (optional if maintainer assistance is useful). Avoid `bug` or `enhancement`: the remaining work is governance verification, not a software defect or feature.
- Responsible collaborator: **@AcingTime420**, the repository's only listed collaborator and the person named by `.github/CODEOWNERS`; branch-protection confirmation specifically requires an owner/admin.
- Next step: owner verifies required-review/check/no-force-push settings in GitHub, records evidence on #54, and updates/closes the issue only if the documented conditions are actually met. No labels or issue changes were applied by this task.

No other open issues were found in the queried issue list. The issue view is a dated snapshot; reassess before taking action later.
