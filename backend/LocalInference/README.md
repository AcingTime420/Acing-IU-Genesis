# Local inference to durable reimbursement proposals

**Experimental Development/Test integration.** The real CLI/authority/database/
manager-browser pipeline is tested with explicitly simulated model responses.
Actual model inference, quality, resource use and native Windows execution of this
bridge remain unverified. Historical #220 Windows inference does not validate it.

The provider adapts `backend/LocalAssistant/ollama.mjs` from separate branch
`prototype/local-genesis-assistant` at
`5a7be09738a604d27d7df67b6964023c7d707263`. That prototype's history is preserved;
its ephemeral policy/grants are not imported into durable authority.

## Authority boundary

The operator fixes one reimbursement UUID, a maximum amount and a lifetime. The
bridge obtains current agent-authorized context, then sends the model only
category, integer USD amount, fixed maximum and bounded operator intent. Bearer
credentials, authority identifiers, credential/output paths and backend URL are
excluded from the model payload.

The model must return only `{recommendation: "propose" | "abstain", rationale}`.
Invalid or extra fields, tools, remote metadata, substituted models, oversized or
incomplete output and transport failures are rejected. The proposer validates
the recommendation independently and constructs the complete action tuple from
operator/context values. Even valid text demanding self-approval or execution
remains untrusted text. Rationale is not eligibility proof or an execution receipt.

A successful command stages one **unapproved** proposal. The distinct human
manager must inspect it in `/genesis/reimbursements`; execution remains separate.
The bridge's client exposes only `context` and `propose`, never approve, execute,
policy editing, membership assignment or payment. The server rechecks current
membership/status/version after inference. A context read does not reserve authority.

The provider-independent `recommend(input)` interface keeps model choice separate
from enforcement. The application CLI selects only the local Ollama adapter:
there is no external provider, cloud fallback, download, or runtime test-provider
switch. Provider injection exists for tests/module composition, not an HTTP route.

## Local setup and command

Use synthetic records and the supported
[reimbursement setup](../../docs/prototypes/genesis-reimbursements.md).
Prerequisites: Node 24+, Python 3, .NET 10 authority service, disposable PostgreSQL,
and an already installed local Ollama model appropriate for the host and license.
Native Windows also requires the existing Release credential-file helper.

Keep Ollama at `127.0.0.1:11434`. The official
[Ollama FAQ](https://docs.ollama.com/faq) documents local-only configuration through
`OLLAMA_NO_CLOUD=1` or `disable_ollama_cloud: true` in its `server.json`, followed
by restarting Ollama and checking its cloud-disabled log. Source checked November
22, 2026. Setting variables in Genesis does not reconfigure an already-running
daemon. The bridge does not attest host-wide offline behavior or runtime honesty.

Choose the exact installed name from `ollama list` and set `GENESIS_MODEL` in the
command environment. Genesis does not select or pull a model. Set
`ASPNETCORE_ENVIRONMENT=Development` or `Test` explicitly. Use `python3` on POSIX,
`python` on Windows, or an operator-selected executable path in `GENESIS_PYTHON`.
Model output never selects executables or subprocess arguments.

```sh
node scripts/genesis-local-propose.mjs --help
```

| Option | Required value |
|---|---|
| `--credentials` | Existing private authority fixture file outside the checkout |
| `--reimbursement-id` | Manager-created pending reimbursement UUID |
| `--max-amount-minor` | Operator-fixed positive integer USD-cent limit, at most 1e12 |
| `--intent-file` | UTF-8 regular file, at most 16,000 bytes / 4,000 characters |
| `--out` | New private proposal file outside checkout; overwrite refused |
| `--ttl-seconds` | Optional 1–600 seconds; default 300 |
| `--url` | Optional literal loopback authority HTTP origin; default 127.0.0.1:5088 |

Private credential reading and proposal output reuse the guarded Python helper,
including native Windows ACL checks. Credentials are never passed to inference.
Successful stdout includes the actual proposal and untrusted recommendation; the
saved proposal file works with the existing separate execute command after human
approval. Abstention creates no proposal file. Errors exit nonzero without echoing
child output or credential paths. There is no automatic staging retry: a lost
response can leave an unapproved proposal, so inspect records before repeating.
Repeated staging commands are not an exactly-once proposal-creation protocol.

## Transport and diagnostics

Only `/api/show` and `/api/chat` at the fixed literal loopback address are used.
Direct HTTP uses an isolated agent, avoiding environment/global-agent proxies,
DNS destination selection and redirects. Metadata/inference deadlines are 5/120
seconds; bodies are bounded to 128 KiB. Generation requests use 4096 context and
768 predicted tokens. These are requested limits, not runtime resource attestation.

The runtime must return the configured model name. Modified time and elapsed
milliseconds are diagnostic only. `verifiedInference: false` avoids treating local
metadata as independent verification. Model tags can change; no weight digest is
pinned. The host and local runtime remain trusted dependencies.

## Tests and evidence

```sh
node --test backend/LocalInference/tests/*.test.mjs
```

Tests use simulated outputs. The transport test owns a loopback HTTP fixture and
proxy and checks that proxy mode sends zero model requests to the proxy. The
connected harness `frontend/tests/genesis-inference-connected.mjs` exercises the
actual Node/Python command, simulated Ollama protocol, real PostgreSQL/backend and
production manager reviewer. It preserves an existing model service by refusing
an occupied port 11434. It checks unapproved staging, separate human approval,
one execution/retry, no allocations on abstention/failure, and stale/offboarded
staging denials. It is not a real-model quality or availability test.

[Recorded validation](../../docs/evidence/local-inference-bridge-20261123.md)
distinguishes current reruns from historical session results.
