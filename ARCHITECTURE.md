# Architecture — Acing IU: Genesis

## Purpose and status

Genesis is a human-authority platform for AI-assisted actions. Its target architecture places a person's explicit permission ahead of execution, with independent enforcement, revocation and evidence. Device security supports that purpose.

This is a development/research architecture. The canonical baseline and unmerged prototypes have different capabilities. This document does not claim a finished OS, hardware-backed vault, certified attestation or production enforcement.

## Logical boundaries

| Boundary | Responsibility | Current implementation context |
|---|---|---|
| Human review interface | Explain exact proposed action, scope, current state and outcome | Baseline fixture surfaces; separate mock and local reviewer prototypes |
| Model/requesting agent | Suggest work and submit proposals within permitted interfaces | Separate local-assistant candidate; model output is untrusted |
| Identity/session boundary | Distinguish actors and authenticate requests | Baseline Identity service; prototype-specific session/auth boundaries require reconciliation |
| Authority service | Bind decisions to scope, check expiry/version/revocation and serialize execution | Separate C#/PostgreSQL Development/Test prototype and integration PRs |
| Action executor | Perform only an authorized bounded operation | Prototype document append; no verified device executor |
| Evidence storage | Record decisions, denials and execution consistently | Baseline audit sources and prototype transaction evidence have different guarantees |
| DeviceTrust and Guardian | Supply supporting device/security research signals | Baseline source, tests, emulator and stubs; hardware enforcement unverified |

The model must not own the policy that grants it permission. The interface must not silently substitute a simulation when a real service fails. Successful authentication does not itself authorize an action.

## Canonical source map

| Path | Role |
|---|---|
| `backend/` | Canonical backend implementation root; inspect the solution for included projects |
| `frontend/` | Web interface, including fixture surfaces |
| `app/` | Android client/scaffold |
| `system/security/guardian/` | Kotlin orchestration, boot research scripts, software vault emulator and threat stubs |
| `infrastructure/` | Compose, gateway, database initialization, Redis and service scripts |
| `database/` | Migration sources; reconcile with initialization and installer paths before release |
| `tests/` | Component and database tests; existence does not prove a current passing run |
| `docs/` | Requirements, decisions, evidence and governance |
| `acing-iu/backend/` | Frozen legacy duplicate; not a new development root |
| `installer/payload/platform/backend/` | Generated payload; do not edit independently |

See [repository governance](docs/governance/REPOSITORY_GOVERNANCE.md) for authoritative path and integration controls.

## Execution model to validate

A requester proposes an exact action. The human reviews the scope and state. The service issues narrowly bound authority only after a valid decision. At execution it independently checks actor, target, content, expiry, relevant version and revocation. Mutation, consumption and evidence must be consistent; retries must not duplicate mutation.

Concurrent revocation and execution need defined transactional ordering. Revoking unused authority does not undo a completed write. Rollback or compensating actions need their own explicit design.

These requirements are exercised in limited document prototypes. Their test results are not proof for arbitrary tools, operating-system administration or physical devices.

## Build and deployment boundaries

Guardian uses Kotlin/JDK and Make; its outputs are generated artifacts. The repository also contains .NET services, a web frontend, Android scaffolding and Compose infrastructure. There is no single root validator that proves every component.

The Bash pre-merge script can skip missing Kotlin, recognizes only root-level Compose files, and skips HTTP readiness. The PowerShell validator is a separate broader pipeline that can start services and apply database migrations. Inspect the selected revision and configure a disposable environment before running it.

Use [backend setup](backend/README.md) and [infrastructure setup](infrastructure/README.md) for the baseline. Use the selected PR's documentation for prototypes; do not assume prototype files exist on `master`.

## Evidence and unresolved work

Read [the capability register](docs/CAPABILITY_REGISTER.md) with its recorded dates, and [the project guide](docs/PROJECT_GUIDE.md) for current review order and completion conditions. PRs #222 and #223 describe the stale-approval and connected-reviewer candidates; PR #220 describes a separate local-model experiment. PR #180 contains an overlapping identity proposal that needs reconciliation before integration.

Remaining work includes branch consolidation, independent review, identity/policy integration, persistent operational guarantees, deployment hardening, recovery and model evaluation. Guardian's vault remains a software emulator, threat components include stubs, and hardware attestation and firmware support remain unverified targets.

Security design and reporting: [SECURITY.md](SECURITY.md), [THREAT_MODEL.md](THREAT_MODEL.md). Release authorization: [RELEASE_PROCESS.md](RELEASE_PROCESS.md). Public capability claims require current, scoped evidence; architecture prose is not such evidence.
