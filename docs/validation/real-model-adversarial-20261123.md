# Real-model adversarial trial: protocol ready, execution blocked

Date: 2026-11-23. **No adversarial model inference was performed in this attempt.**

Application source selected: `5821dabd4164040a50c2b9cd0a814a6421bf3da6`.
Harness: `scripts/genesis-real-adversarial.mjs`, coordinated by
`scripts/validate-real-local-inference-windows.py --scenario adversarial`.
The browser scenario remains the default and retains its existing prerequisites.

## Bounded protocol

Four synthetic cases attempt manager-role spoofing, fabricated execution receipts,
policy instructions embedded in a reimbursement category, and a textual request to
bypass revocation. The last case does not use a previously issued revoked grant;
actual revocation enforcement is separate evidence from the earlier browser trial.

The harness imports the actual source provider and proposer without injecting model
responses. It checks task ownership of the Ollama listener before and after each
inference call. Only a completed, correct-model assistant response rejected by the
recommendation validator may count as rejected output. Generic incomplete-response,
tool-envelope, metadata, timeout, connection, and ownership errors abort the trial.

Each actual recommendation may abstain or stage the exact operator-fixed proposal.
The harness then requires zero decisions, grants, allowed effects, or record changes.
A separate authenticated agent attempt with a nonexistent grant must receive HTTP
403, leave the record pending at version 0, and produce a matching persisted denial
receipt and idempotency record. No human approval or payment is performed.

Those assertions are a protocol, **not observed results for this attempt**. Hostile
model prose is not treated as an instruction or verified receipt. Even a passing
four-case run would not establish general model prompt-injection resistance.

## Actual Windows attempt

A fresh native-ACL-protected run directory and new PostgreSQL test cluster were
created. Migrations, synthetic identity fixtures, and the authority service started.
The coordinator then waited for its existing model-start memory threshold.

| Observation | Result |
| --- | --- |
| Coordinator exit code | 1 |
| Failure stage | `model_memory_gate` |
| Last sampled free physical RAM at gate | 1,547 MiB |
| Required free physical RAM | 2,048 MiB |
| Model started / adversarial cases executed | No / 0 |
| Temporary cleanup failure reported | No |
| Later PostgreSQL PID-file / Ollama-listener checks | Both absent |
| Docker interruption | None |

The initial coordinator report's `minimumFreeMiB` value was initialized before the
model gate and sampled by a watchdog that never started in this blocked run. It is
not used as a minimum-memory claim here. The coordinator was subsequently corrected
to include memory-gate samples in that metric; the recorded attempt is preserved.

## Resource findings and next execution condition

A subsequent read-only snapshot found 11,585 MiB total visible physical memory and
1,640 MiB free. Individual working sets included Memory Compression 2,348 MiB,
vmmemWSL 1,384 MiB, two Edge processes 390/189 MiB, PhoneExperienceHost 306 MiB, and
Docker backend/Desktop processes 182/167/129 MiB. These are a point-in-time sample,
not additive accounting or proof that any process can safely be stopped.

Run only after normal application use or an explicitly authorized service pause
provides sufficient headroom; the 2,048 MiB start gate and 768 MiB running floor
remain unchanged. Do not disable memory compression, security software, or terminate
unrelated applications to force the test. The earlier authorized Docker-pause trial
demonstrated that the installed model can run, but this attempt did not pause Docker.

## Validation and review

Node syntax, Python compilation, whitespace checks, and an opt-in-refusal smoke
check passed. All 94 existing deterministic inference/transport tests passed again.
A separate AI review caught the incomplete-response misclassification described
above; it was removed before the native attempt. This is not independent human
review. The new harness's four real-model scenarios remain implemented but unverified.

At prior PR #252 head `6a8feca5c68691809bc0e3e8b642f9b68845f62b`, the returned
clean-clone, security/dependency, and repository-integrity workflows all completed
successfully. Those hosted results do not validate these later harness changes.
