# Local browser / authority integration

Status: implemented for review; not merged, deployed, or production-ready.
Integration branch combines frontend PR #161 at a73f9b5 and backend PR #163 at e2e2de0.
The backend contract remains proposed. This branch supplies a human-only browser
boundary; it does not give the browser the agent credential or an execution API.

## Run locally

Use the backend prerequisites, explicit migration, fixtures and CLI described in
`genesis-authority-api-proposed.md`. Use a dedicated development database.
Create a document and an agent proposal through that CLI. Keep the returned
proposal UUID. Do not run the CLI approval command for this demonstration.

In a separate terminal, from `frontend`:

```bash
npm ci
GENESIS_LOCAL_LIVE=1 GENESIS_AUTHORITY_URL=http://127.0.0.1:5088 npm run dev -- --hostname 127.0.0.1
```

In Windows PowerShell with an already-running local backend:

```powershell
$env:GENESIS_LOCAL_LIVE = '1'
$env:GENESIS_AUTHORITY_URL = 'http://127.0.0.1:5088'
npm run dev -- --hostname 127.0.0.1
```

Open http://127.0.0.1:3000/genesis/live. Enter the proposal UUID and the **human**
credential from the private local fixture file. Never paste that file or its
credentials into chat, GitHub, screenshots or issue reports. The agent credential
is not accepted as a browser identity.

Review the exact text, mandatory appended LF, target, version, expiration and
single-use scope. Approve explicitly in the browser. Run the existing agent CLI
`execute` command separately with the returned grant ID and a stable idempotency
key. Refresh the browser to see current document and persisted evidence.
Retry the same CLI request/key to verify no additional append. Create a fresh
proposal at the current version and use a new browser session to review it;
approve and revoke before execution to demonstrate denial. Inspect CLI attempt
reconciliation with the original key after a lost response.

The original `/genesis` page remains an explicitly labeled mock demonstration.
The `/genesis/live` route never uses its mock adapter.

## Session and request boundaries

- Disabled unless `GENESIS_LOCAL_LIVE=1` is set on the server.
- Backend origin restricted to a plain loopback HTTP origin, without credentials,
  path or query; redirects are rejected.
- Exact loopback Host and same Origin required for POST, including login/logout.
  Cross-site Fetch Metadata rejected. JSON body capped at 8 KiB while streaming.
- Login validates the credential against a human-owner-only backend document
  endpoint. Session binds a single proposal and its document on the server.
- Random opaque cookie, HttpOnly, SameSite=Strict, restricted API path; raw bearer
  stays in server memory for 15 minutes. Logout/restart invalidates sessions.
  HTTP/no Secure cookie is deliberate for loopback-only development; this must
  not be deployed publicly. No durable sessions or production enrollment claims.
- Only read, approve, reject, revoke and logout are exposed. Backend enforcement
  remains authoritative. No browser agent execution or arbitrary URL proxy.
- Snapshots use independent backend reads and are not a database-atomic view.
  Refresh after agent activity; historical evidence never restores document state.
- Decision failures can be uncertain. Refresh before retrying; identical decisions
  preserve the original backend grant. Backend failure never produces mock success.

## Validation in this integration workspace

Node 24.19.0 / npm 11.9.0:
- `npm ci --no-audit --no-fund` succeeded (pre-existing glob deprecation warning).
- Existing mock adapter tests: 9 passed.
- `npm run test:genesis-session`: 3 passed (origin/host, backend URL, expiry/logout).
- `npm run build -- --webpack`: passed, including new page and dynamic route.
- `npm run test:genesis-live-http`: passed against a real production Next server
  and a synthetic HTTP authority fixture: rejected cross-origin and agent login,
  accepted human session, kept bearer out of cookie/response, approval, revocation,
  refreshed terminal state, unsupported execution action and logout.
- Type check passed; lint has no errors and the existing 19 unrelated warnings.

HTTP fixture tests validate transport and sessions, not PostgreSQL enforcement.
Independent real backend/browser/database execution remains unverified here:
PostgreSQL package setup was blocked by container UID/group restrictions; the
attempted .NET SDK installation/CLI also failed under container process/ownership
restrictions. Earlier backend tests recorded in PR #163 are separately attributed
implementation-owner evidence, not tests rerun by this integration.

Before merge: independent review, real local PostgreSQL end-to-end execution,
browser visual/interaction checks, and CI integration remain required. Do not
publish this route as a hosted service or claim the full prototype verified yet.
