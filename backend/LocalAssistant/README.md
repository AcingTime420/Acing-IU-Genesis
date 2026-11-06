# Genesis local assistant

Experimental, dependency-free Node.js 24+ application implementing Micki Hart's
local AI direction. No paid inference provider, API key, or cloud model is
configured. Ollama's local HTTP interface is an inter-process connection on the
same computer, not a paid external API. This is a custom Genesis application
using an existing locally installed model, not a newly trained GPT model.

## Start on Windows

From the checked-out `prototype/local-genesis-assistant` branch in VS Code:

```powershell
Set-Location D:\Acing-IU\Genesis
.\backend\LocalAssistant\start.ps1
```

The script lists already installed models and asks for their exact name. It does
not install software, download model weights, alter execution policy, or modify
other Genesis services. If PowerShell blocks scripts, use the Node command below
instead; do not weaken the machine's execution policy.

If Node 24+ and a local model are available, set `GENESIS_MODEL` to the model's
exact catalog name in the terminal, then run:

```powershell
node backend/LocalAssistant/server.mjs
```

Without `GENESIS_MODEL`, the server still starts for manual proposal/review tests,
but chat stays disabled. Open **http://127.0.0.1:4318** exactly. Use
`GENESIS_PORT` for a different unprivileged port. Do not expose or tunnel the
listener. This application serves its own interface without a Next build or
`npm install`.

Prerequisites: [Node.js](https://nodejs.org/), [Ollama](https://ollama.com/download),
and a locally downloaded model suitable for the host's RAM/VRAM and its license.
No model is selected automatically because the user's hardware has not been
verified. Run `ollama list` to inspect the installed catalog.

Configure Ollama with `OLLAMA_NO_CLOUD=1`, or set
`disable_ollama_cloud` to `true` in Ollama's `server.json`, and restart Ollama.
Setting an environment variable in Genesis does not reconfigure an already
running Ollama process. Keep both services on loopback. Genesis calls only
`http://127.0.0.1:11434/api/show` and `/api/chat`, rejects redirects and remote
model metadata, and never pulls or signs in to models. Ollama and its runtime
remain trusted dependencies; this is not host-wide network isolation.

## Workflow

1. Chat with the local model. Replies are plain, untrusted text.
2. Copy a reply into the editable draft, or write your own.
3. Stage a proposal. The server fixes text, destination, version, and expiry.
4. Review the displayed contract. Reject, or explicitly approve one append.
5. Execute separately. Inspect the test document and receipt.
6. Retry the same attempt without a duplicate append, or revoke before execution.

The model never receives browser cookies, CSRF tokens, grants, policy-editing
functions, tools, or access to the execution route. Neither chat parsing nor
model output can invoke an action. Instructions such as "approve yourself" are
treated as text. Model content is inserted with `textContent`, never rendered as
HTML or executed. The safe default is no approval.

## Foundation and limits

`policy.mjs` holds frozen server policy and an informational SHA-256 fingerprint.
There is no runtime endpoint or interface control to change it. The fingerprint
is a display aid, **not** attestation, signature, tamper protection, or proof of
an authentic server. The system prompt guides the model; authorization checks
do not depend on obedience to that prompt.

The server requires the exact loopback Host, same-origin POST, an HttpOnly
SameSite=Strict browser cookie, a per-session CSRF token, and exact request
fields. It caps input, output, sessions, history, proposals, document size and
concurrent inference. Requests cannot choose provider URLs, system roles,
tools, resources, operation types, grant expiry, or policy settings. The provider
response is never dispatched as a tool call. Inference failure shows an error;
there is no mock success or cloud fallback.

The only action is an append to a **session-owned in-memory test document**.
Grants bind exact proposal fingerprints and document versions, expire five
minutes after staging, and are single use. Execution and revocation are
synchronous serialized checks in one Node process; this is not a distributed
transaction guarantee. Fifteen-minute browser sessions expire absolutely.
Evidence is a bounded in-memory list, with the oldest entries discarded at its
cap; it is neither durable nor tamper-evident. Restarts lose all state.

This is a standalone integration experiment stacked on preview PR #219. It does
**not** replace or integrate with the separately drafted C#/PostgreSQL
`backend/HumanAuthority` service. Reconciliation with its identity, persistent
grants, transactional execution and audit model is required before real actions.

The local browser session is not a verified human identity. Host administrators,
malware, browser compromise, or a compromised Ollama/Node runtime can defeat this
application boundary. Model/runtime process separation, filesystem ACLs,
network isolation, hardened identity, persistence, signed releases, independent
review and real-model evaluation remain required before production use. No
claim of an absolutely immutable foundation or production readiness is made.

## Validate

```sh
node --test backend/LocalAssistant/tests/boundary.test.mjs
```

Tests exercise actual HTTP routes, authorization, revocation, expiry, duplicate
execution, stale versions, cookie-session isolation, CSRF/Origin/Host checks,
request schemas, provider failures, malicious model text, absent tool access,
remote-model rejection and concurrent inference. Provider responses are
synthetic; tests do not prove model quality, hardware compatibility or real
Ollama inference. Windows launcher execution needs Windows validation.

The hosted `assistant.html` mirrors this interface for review only. It cannot
reach a visitor's computer and does not pretend local inference is connected.
Its sample dialogue is explicitly labeled; approval/execution controls remain
disabled. All source changes belong in the Genesis repository.

## Troubleshooting

- **Chat unavailable:** start Ollama, confirm a local model is installed, set
  `GENESIS_MODEL` and restart Genesis. No network fallback will be used.
- **Remote model rejected:** use a locally stored model and disable Ollama cloud.
- **Wrong Host:** use `127.0.0.1`, not `localhost`, a LAN address, or a proxy.
- **Session expired:** reload to start fresh; old grants are inaccessible.
- **Stale/expired proposal:** stage a fresh proposal and review it again.
- **Unknown execution outcome:** retain the page and retry the same attempt;
  the UI retains its attempt identifier. Reload loses that UI identifier, so
  inspect the document/receipt instead of assuming nothing happened.

Protocol references: [Ollama chat](https://docs.ollama.com/api/chat),
[local-only configuration](https://docs.ollama.com/faq), and
[Ollama response types](https://github.com/ollama/ollama/blob/main/api/types.go).
