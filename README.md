# Acing IU: Genesis

### Security by Foundation. Personal by Choice. Engineered for Trust.

> **A security-first research and engineering platform for device trust, identity, policy governance, Android security architecture, and evidence-driven system design.**

---

## What is Acing IU: Genesis?

**Acing IU: Genesis** is an evolving security engineering and trusted-computing platform focused on building transparent, governed, and testable security systems across application, service, infrastructure, operating-system, and device boundaries.

**IU** stands for **Interface User** — a design philosophy that keeps the person interacting with the system, their authority, their privacy, and the trust state surrounding that interaction central to the architecture.

Genesis draws from Android security architecture, Verified Boot concepts, zero-trust design, identity and access management, policy enforcement, device-trust evaluation, auditable infrastructure, and evidence-driven engineering.

Genesis is **not** represented as a finished operating system, production-certified security product, or verified device-modification platform.

Source code, a user interface, a configuration file, or a successful build does **not** by itself establish that a capability is operational, enforced, production-ready, or verified.

---

## Project Principles

### Security by Foundation

Security requirements belong in architecture, identity, policy, data handling, infrastructure, validation, and release engineering rather than being added as an afterthought.

### Personal by Choice

Genesis is designed around explicit user authority, understandable system state, controlled permissions, privacy-conscious architecture, and transparent boundaries.

### Engineered for Trust

Trust should be earned through reproducible evidence, validation, traceability, and clearly defined authority boundaries.

### Evidence Before Assurance

A capability is not considered verified merely because implementation artifacts exist.

### Fail Closed

Missing, stale, conflicting, or unavailable security state must not silently become authorization.

### Simulation Must Look Like Simulation

Demonstrations, fixtures, prototypes, and simulated workflows must remain clearly distinguishable from operational capabilities.

### Architecture Before Privilege

Privileged or device-changing functionality must not be represented as operational until its authorization model, recovery path, supported-device scope, validation evidence, safety controls, and release requirements are established.

---

## Capability Maturity

The authoritative capability definitions are maintained in [`docs/CAPABILITY_REGISTER.md`](docs/CAPABILITY_REGISTER.md).

| Maturity | Meaning |
|---|---|
| **Implemented** | Source and configuration exist, but current verification evidence is incomplete. |
| **Tested** | Relevant automated tests exist, but the capability has not necessarily completed full validation. |
| **Verified** | Reproducible current validation evidence supports the capability. |
| **Simulator** | A user-interface or workflow representation without proof of end-to-end enforcement. |
| **Target** | Intended capability without sufficient implementation evidence. |
| **External dependency** | Capability depends on a separately operated platform, service, credential, or provider. |

### Current high-level capability snapshot

| Capability area | Current maturity |
|---|---|
| Password registration and authentication | Implemented |
| JWT issuance, refresh, and revocation | Implemented |
| MFA / TOTP | Tested |
| Device trust scoring | Tested |
| Device attestation | Target |
| RBAC and grants | Implemented |
| Policy engine | Implemented |
| Security database schemas | Implemented |
| Containerized platform startup | Implemented |
| Operator web experience | Simulator |
| Android client / provisioning workflow | Simulator |
| Firmware tooling and recovery | Target |
| AI assistance and external APIs | External dependency |
| CI/CD and release provenance | Implemented |

The capability register is the source of truth when this summary and repository evidence differ.

---

## Architecture

Genesis is organized as a multi-layer engineering platform rather than a single application.

```text
Acing IU: Genesis
│
├── Operator Experience
│   └── Next.js / React frontend
│
├── Service Layer
│   ├── Identity
│   ├── Device Trust
│   ├── Shared Kernel
│   └── Policy and security services
│
├── Data & Infrastructure
│   ├── PostgreSQL
│   ├── Redis
│   ├── Docker / Compose
│   └── migration and validation tooling
│
├── Android Research Surface
│   ├── Android application components
│   ├── provisioning workflow research
│   └── simulator-aware device interfaces
│
├── Security & Governance
│   ├── capability truth model
│   ├── threat modeling
│   ├── data classification
│   ├── architecture decisions
│   └── repository governance
│
└── Engineering Assurance
    ├── automated tests
    ├── CI workflows
    ├── security workflows
    ├── evidence records
    └── release controls
```

---

## Repository Layout

```text
Acing-IU-Genesis/
├── .github/
│   └── workflows/             # CI, security, release, and repository automation
├── app/                       # Android application and provisioning research
├── backend/                   # .NET services and shared platform code
│   └── AcingIU.sln
├── database/                  # Database migrations and database assets
├── docs/
│   ├── adr/                   # Architecture Decision Records
│   ├── evidence/              # Validation and engineering evidence
│   └── governance/            # Repository and stabilization governance
├── frontend/                  # Next.js operator experience
├── infrastructure/            # Container and service infrastructure
├── installer/                 # Installer and packaged platform resources
├── scripts/                   # Validation and engineering automation
├── system/                    # System-level research and platform components
├── tests/                     # Automated tests and validation assets
├── ARCHITECTURE.md
├── CONTRIBUTING.md
├── SECURITY.md
├── THREAT_MODEL.md
└── README.md
```

---

## Backend

The canonical backend solution is:

```text
backend/AcingIU.sln
```

Restore dependencies:

```bash
dotnet restore backend/AcingIU.sln
```

Build:

```bash
dotnet build backend/AcingIU.sln -c Release
```

Run tests:

```bash
dotnet test backend/AcingIU.sln -c Release
```

A successful build demonstrates that the relevant source compiles. It does not by itself reclassify a capability as **Verified**.

---

## Frontend

The operator experience is implemented with Next.js and React.

From the repository root:

```bash
cd frontend
npm install --package-lock=false
npm run lint
npm run build
```

Start the local development server:

```bash
npm run dev
```

The frontend is currently treated as a **Simulator** where displayed security or device state is not backed by verified end-to-end enforcement.

Interface output must not be interpreted as hardware measurement, attestation evidence, certification, compliance evidence, successful device modification, or verified trust state unless the corresponding capability has current validation evidence.

---

## Local Validation

Genesis includes a fail-closed pre-merge validation pipeline.

### Windows / PowerShell

```powershell
pwsh scripts/validate-premerge.ps1
```

The validation pipeline is designed to cover:

- required development tooling
- .NET dependency restore
- Release builds
- automated tests
- OpenAPI validation
- Docker Compose validation
- PostgreSQL readiness
- database migrations
- database constraint testing
- least-privilege checks
- full-stack smoke testing
- optional container vulnerability scanning

Some stages require Docker, configured local environment variables, a valid `infrastructure/.env`, and supporting development tools.

A validation script reporting success is evidence for the exact checks it executed on that revision. It does not automatically establish broader product certification or production readiness.

---

## Android and Device Operations

Genesis includes Android-oriented research, application components, provisioning concepts, and device-security architecture.

Current repository evidence does **not** establish general-purpose device attestation enforcement, validated firmware recovery, production-supported device modification, universal rooting support, verified flashing support, verified bootloader modification, or verified device-changing execution.

Android interfaces, demonstrations, fixtures, and simulated device results must remain clearly labeled according to their actual maturity.

Future device-specific capabilities require documented authorization, supported-device scope, recoverability, validation evidence, audit requirements, and release approval before being represented as operational.

---

## Trust and Security Model

Genesis is being developed around several core trust boundaries:

- **Identity** — establishes who or what is requesting access.
- **Device Trust** — evaluates available device and security signals.
- **Policy** — determines whether a requested operation should be permitted.
- **Evidence** — records what was actually observed, tested, or validated.
- **Governance** — defines who may change security-sensitive behavior and under what conditions.
- **Presentation** — displays state without creating authority merely by displaying it.

A user interface cannot independently authenticate a user, calculate authoritative trust, grant itself privilege, create hardware evidence, turn simulated evidence into verified evidence, or prove successful device modification.

---

## Security Fabric Direction

Genesis is evolving toward a cross-layer security architecture in which identity, device state, policy, evidence, and governance can operate as coordinated parts of a broader trust system.

Research areas include:

- device trust scoring
- Verified Boot and boot-integrity concepts
- hardware-root-of-trust integration
- policy decision systems
- cryptographic identity
- secure storage
- audit evidence
- zero-trust service architecture
- system and application isolation
- Android lifecycle integration
- security-state presentation
- incident-response modeling

Research direction does not imply completed implementation. Each capability remains governed by its recorded maturity and evidence.

---

## AI and External Services

AI-assisted engineering may support architecture research, code review, documentation, testing, debugging, security analysis, evidence analysis, and development workflows.

AI assistance is treated as an **External dependency** until provider governance, authorization, data handling, secret isolation, and validation requirements are established.

Secrets, credentials, private keys, private device information, or other protected data must not be sent to an external AI provider merely because an integration exists.

AI-generated output must be reviewed and validated before it becomes authoritative project evidence.

---

## Engineering Governance

Genesis uses repository governance to keep implementation, claims, and evidence aligned.

Important rules include:

- keep unrelated changes in separate branches and pull requests
- distinguish source existence from verified capability
- preserve simulator and fixture labels
- require evidence for capability promotion
- keep security-sensitive operations fail-closed
- preserve recovery paths
- avoid committing credentials or secrets
- review security-sensitive changes before release
- maintain traceable Architecture Decision Records
- keep repository history understandable and auditable

---

## Documentation

| Document | Purpose |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Platform architecture and component boundaries |
| [`docs/CAPABILITY_REGISTER.md`](docs/CAPABILITY_REGISTER.md) | Authoritative capability maturity and evidence register |
| [`docs/adr/`](docs/adr/README.md) | Architecture Decision Records |
| [`docs/evidence/`](docs/evidence/) | Validation and engineering evidence |
| [`docs/governance/`](docs/governance/) | Repository and engineering governance |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Development and contribution workflow |
| [`SECURITY.md`](SECURITY.md) | Security policy and vulnerability reporting |
| [`THREAT_MODEL.md`](THREAT_MODEL.md) | Threat model and attack-surface analysis |
| [`DATA_CLASSIFICATION.md`](DATA_CLASSIFICATION.md) | Data sensitivity and handling requirements |
| [`PRIVACY.md`](PRIVACY.md) | Privacy commitments |
| [`RELEASE_PROCESS.md`](RELEASE_PROCESS.md) | Release engineering process |
| [`DEPRECATION_POLICY.md`](DEPRECATION_POLICY.md) | Deprecation lifecycle |

---

## Repository Governance

The canonical source repository is:

```text
AcingTime420/Acing-IU-Genesis
```

Routine implementation must follow the repository's branch, review, validation, evidence, and recovery controls.

The public logical identifier for the maintainer's Windows worktree is:

```text
canonical-windows-worktree
```

Machine-specific workstation locations remain private.

See [`docs/governance/REPOSITORY_GOVERNANCE.md`](docs/governance/REPOSITORY_GOVERNANCE.md).

---

## Development Workflow

A typical contribution should follow this pattern:

```text
master
   │
   └── scoped feature / fix / documentation branch
                │
                ├── implement or document
                ├── inspect changes
                ├── validate
                ├── commit
                ├── push
                └── pull request
```

Avoid placing unrelated changes into an existing pull request.

---

## Contributing

Before submitting changes:

1. Work from an appropriately scoped branch.
2. Keep unrelated changes out of the same pull request.
3. Review the files you changed.
4. Run applicable validation and tests.
5. Do not promote capability maturity without evidence.
6. Keep Simulator, Target, Tested, Implemented, and Verified states truthful.
7. Review security-sensitive changes carefully.
8. Never commit credentials, secrets, private keys, or production tokens.
9. Document important architectural decisions.
10. Preserve repository recovery and governance controls.

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

Security issues should follow [`SECURITY.md`](SECURITY.md) rather than being disclosed through an ordinary public issue.

---

## Project Status

**Acing IU: Genesis is under active research and development.**

The repository contains a mixture of implemented capabilities, tested capabilities, simulator surfaces, target capabilities, external dependencies, research architecture, governance controls, and validation infrastructure.

That distinction is deliberate.

Genesis measures progress by what can be demonstrated, tested, reproduced, and supported by evidence — not by what a screen, prototype, source file, or roadmap merely suggests.

---

## Vision

Genesis is being built toward a platform where security is not a collection of disconnected features.

The long-term goal is a system in which:

```text
Identity
   +
Device Trust
   +
Policy
   +
Evidence
   +
Governance
   +
User Authority
   =
A Trustworthy Computing Environment
```

The architecture is expected to evolve as implementation evidence, testing, hardware capabilities, Android platform constraints, and security research advance.

The governing principle remains constant:

**Claims follow evidence. Authority follows policy. Trust must be earned.**

---

## License

License terms have not yet been finalized.

See the project maintainer before redistributing or relying on the repository under assumptions about licensing.

---

# Acing IU: Genesis

### Security by Foundation. Personal by Choice. Engineered for Trust.
