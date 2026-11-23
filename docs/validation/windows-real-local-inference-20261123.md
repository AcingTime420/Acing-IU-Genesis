# Installed-model authority workflow: Windows, 2026-11-23

Status: **passed for two synthetic records**, with service restoration recorded separately below. This is development evidence, not production certification or independent human review.

Application source: `5821dabd4164040a50c2b9cd0a814a6421bf3da6` (PR #251). The isolated Windows checkout had no tracked modifications. The owner's main checkout was not used for the trial. Test harness: PR #252.

## Actual inference

The installed `qwen2.5:1.5b-instruct-q4_K_M` model ran through Ollama `0.40.15` at the task-owned literal loopback listener. Runtime logs confirmed cloud inference disabled. No model download or external inference provider was used.

| Measurement | Observed value |
| --- | --- |
| Runtime-reported model digest | `65ec06548149b04c096a120e4a6da9d4017ea809c91734ea5631e89f96ddc57b` |
| Stored model size | 986,061,892 bytes |
| Loaded size | 1,173,136,342 bytes |
| GPU allocation | 0 bytes |
| Loaded context | 4,096 tokens |
| First recommendation latency | 20,900 ms |
| Second recommendation latency | 4,156 ms |
| Free physical RAM before model | 3,355 MiB |
| Minimum free physical RAM during guarded trial | 2,257 MiB |
| Free physical RAM after task cleanup | 3,797 MiB |

Metadata is reported by the local runtime, not independent cryptographic model attestation. The provider's `verifiedInference: false` flag was preserved; the experiment does not upgrade its provenance claim.

Both actual model responses recommended `propose`. Only the operator-specified exact reimbursement tuple was staged. Before browser approval, both records remained pending at version 0, with one proposal and no decisions, grants, or execution attempts each.

## Authority and evidence checks

The manager-role actions below were automated Playwright actions using synthetic fixtures. They were not personal approval by Micki Hart and do not constitute independent human review.

| Scenario | Observed result |
| --- | --- |
| $125 supplies reimbursement | Browser manager approval followed by separate agent execution succeeded |
| Same execution and idempotency key retried | Identical receipt; one execution attempt/effect persisted |
| Approved record | Database and refreshed UI: `approved:1` |
| $65 supplies reimbursement | Browser manager approved, then revoked the unused grant |
| Agent execution after revocation | HTTP 403; denied receipt with `grant_revoked` |
| Revoked record | Database and refreshed UI: `pending:0` |
| Audit agreement | Exactly one allowed receipt and one denied receipt matched actual attempts |

Both records had exactly one proposal, decision, grant, and execution attempt at completion. No payment or money transfer occurred.

## Environment and cleanup

The frontend production webpack build passed. A local NTFS junction reused the owner's existing dependency cache only after an exact package-lock hash match; no dependency installation or cache source mutation was requested. The build used one worker and a 768 MiB JavaScript heap limit.

The trial created a new SCRAM-authenticated PostgreSQL cluster and `genesis_authority_test` database under a protected private run directory. Credentials and raw logs stayed there. The model was unloaded before starting the browser. The coordinator stopped its own frontend, backend, model runtime, and PostgreSQL cluster; no cleanup failure was reported.

Docker was temporarily stopped with explicit owner authorization. Restoration is verified separately and must not be inferred from the successful inference result. An earlier preparation attempt timed out while copying dependencies before any model started; its old container snapshot retained only IDs and flags, and one ID subsequently disappeared. That historical discrepancy remains unresolved rather than guessed away.

## Limits

Two successful synthetic examples establish this integration path, not general model reliability, hostile prompt resistance, production readiness, or independent security certification. Existing denial/concurrency tests remain distinct evidence. No application merge or deployment was performed.
