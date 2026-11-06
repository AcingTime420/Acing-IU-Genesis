# Genesis repository simulation preview

This dependency-free review view runs the existing `MockGenesisAdapter` from
`frontend/src/lib/genesis-adapter.ts` on the human-authority UI branch (PR #161).
The build strips TypeScript syntax without changing the adapter logic. The
Next.js `/genesis` page remains the original prototype interface.

Requires Node.js 24 or newer. From the repository root:

```sh
node --experimental-strip-types --test frontend/tests/genesis-adapter.test.mjs
node frontend/preview/build.mjs
python -m http.server 8080 --bind 127.0.0.1 --directory frontend/preview/dist
```

Open `http://127.0.0.1:8080`. Node alone builds the preview; Python is only
one option for serving static files. Use an HTTP server, not a file URL.
The output is ignored. Build from a committed checkout; the footer reports
its source SHA. A hosting mirror may set `GENESIS_SOURCE_SHA` to the exact
verified Genesis commit used to produce its input files.

Review approval and exact append, then retry the same attempt. Reset before
each independent scenario: rejection, approval then revocation then execution,
changed text, expired grant, stale version, or uncertain outcome and inspection.
The adapter's timeline is displayed as session-only evidence.

## Boundaries

MOCK MODE / NOT LIVE / NOT ENFORCED. Alex Morgan is an unauthenticated demo
human. No AI provider, real credentials, device executor, filesystem writer,
or live authority API is connected. Refresh resets state. Expiry and stale
versions are explicit fixture scenarios, not real backend enforcement. The
adapter's cached attempt snapshots and fixture behavior are not production
authorization or audit guarantees. This preview does not validate other
Genesis services or declare the platform production ready.

The hosted preview is a generated mirror of these repository files. Source
changes belong in Genesis; the hosting service is only the delivery mechanism.
Do not deploy unrelated repository files, secrets, or runtime data.
