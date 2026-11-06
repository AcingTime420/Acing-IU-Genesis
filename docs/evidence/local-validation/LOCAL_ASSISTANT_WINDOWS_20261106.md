# Local assistant Windows validation — 2026-11-06

Independent execution through the owner's authorized Windows connection.
Source baseline: `a04787925f6bb2a097696edf67e2c23b27f42313` on the
`prototype/local-genesis-assistant` draft branch. A follow-up changes only the
interface connection label after a successful reply and adds this report.

## Environment

- Node.js `v24.18.0`.
- AMD Ryzen 3 5425U, four cores/eight logical processors, 11.3 GiB RAM.
- Integrated Radeon graphics; local inference reported zero GPU allocation.
- Clean detached worktree at `D:\Acing-IU\Genesis-LocalAssistant`.
- Existing primary checkout and its tracked/untracked changes were preserved.

## Executed checks

- 18 local assistant boundary/HTTP/provider-contract tests: pass on Windows.
- Nine existing preview adapter tests: pass on Windows. Node emitted the existing
  module-type inference warning; it did not fail the suite.
- Production browser navigation initially failed because the origin guard
  rejected top-level entry-page visits. Fixed in the baseline SHA above.
  Regression verifies entry-page navigation succeeds while cross-site API
  navigation remains denied. Current GitHub boundary, baseline and integrity
  workflows at that SHA completed successfully.
- Actual Windows browser: stage exact text → explicit approval → execute → retry
  same attempt. Document advanced once to version 1 and retry receipt confirmed
  no repeated append.
- Actual Windows browser: fresh proposal → approval → revocation. Execution
  control disabled; document stayed at version 1. HTTP revocation denial is also
  covered by the test suite.

## Real local inference

- Portable Ollama `v0.40.15`, downloaded from the official GitHub release to D:.
- Release ZIP SHA-256 verified before execution:
  `9ca74a7ab66ec86870b1eecac7df160df08dc4e3a291ab5d2d59bcf9310221c6`.
- Listener: `127.0.0.1:11434`; runtime log confirmed
  `Ollama cloud disabled: true`.
- Model store: `D:\Acing-IU\Models\Ollama`.
- Model: `qwen2.5:1.5b-instruct-q4_K_M`, 986,061,892 downloaded bytes.
- Model digest:
  `65ec06548149b04c096a120e4a6da9d4017ea809c91734ea5631e89f96ddc57b`.
- Runtime process metadata reported 4,096 context, 1,173,136,342 loaded bytes,
  and zero GPU bytes.
- Through the actual Genesis chat UI at `http://127.0.0.1:4318`, requested a short
  explanation of Genesis and whether the model could approve/execute actions.
- Observed reply: “Acing IU: Genesis is a local assistant designed to help humans
  understand, write, and plan. I cannot approve or execute actions myself.”
- Browser showed the reply as untrusted model text. Document remained version 0,
  with no staged proposal or grant. The only new evidence event reported text
  generation without authorization/execution.

The reply demonstrates functioning local inference, not model reliability or
security enforcement by model obedience. Independent application checks and
the absence of tool dispatch remain the demonstrated enforcement mechanism.

## Limits

No paid AI service, API key, cloud inference, Windows service registration,
administrator installation, device operation, or production deployment was used.
The two local listeners were started as session processes and are not configured
to start after reboot. All review data remains temporary browser-session state.
The portable runtime is an existing open-source model host; this is not a GPT
trained from scratch. No hardware immutability, verified human identity, durable
audit integrity, runtime-compromise resistance, or production readiness is proven.
