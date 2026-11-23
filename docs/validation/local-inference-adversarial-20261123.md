# Local inference adversarial boundary corpus

Date: 2026-11-23. Status: **94/94 tests passed on Node v24.22.3**, including 34 new cases in `backend/LocalInference/tests/adversarial.test.mjs`.

Command: `node --test backend/LocalInference/tests/*.test.mjs`.

The new corpus exercises the actual Ollama provider validator and proposal orchestrator together with deliberately simulated model HTTP responses and an instrumented authority client. It performs no real inference, database operation, or payment. The existing transport test separately uses real loopback sockets with simulated output.

| Cases | Count | Assertion |
| --- | --- | --- |
| Hostile intent/category | 16 | Role spoofing, message delimiters, JSON escapes, fake policy, shell instructions, fabricated receipt prose, revocation bypass, and encoded instructions remain user data; only the operator-fixed proposal tuple is staged |
| Invalid model content | 10 | Foreign resource IDs, expanded limits/duration, grants, verification claims, receipts, execution commands, arrays, markup, and terminal controls do not stage proposals |
| Tool-call envelopes | 3 | Empty, null, and populated tool-call fields fail closed despite otherwise valid recommendation content |
| Rejection after inference | 4 | Simulated membership, resource, session, and database failures propagate after one staging attempt, without retry or privileged fallback |
| Hostile abstention | 1 | Abstention does not stage or execute despite hostile text |

The instrumented client exposes forbidden approval, execution, revocation, payment, policy, and evidence-write methods; no new case invoked any of them. Model requests omitted the synthetic private credential and authority identifiers held in context. This does not claim redaction of secrets a user deliberately includes in the intent. The tests also verify fixed system/user message roles and no tool definitions.

Valid-schema hostile rationale is intentionally treated as untrusted text, rather than as an instruction or verified completion claim. A recommendation of `propose` may still stage a human-review request; it never substitutes for authorization. The provider's `verifiedInference: false` classification is preserved.

## Limits

These are deterministic adapter/orchestrator tests. They do not establish that a real model rejects these prompts, that the mock errors reproduce PostgreSQL concurrency semantics, or that arbitrary local code is sandboxed. The actual-model happy-path experiment, backend authorization tests, and independent human security review are separate evidence requirements. No new real-model adversarial run or human certification is claimed.

The existing CI glob already includes the new test file. Application code and Docker services were not changed for this corpus.

A separate AI agent reviewed the new corpus and found no blocking flaw. That review is not independent human review or certification.
