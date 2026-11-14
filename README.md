# Acing IU: Genesis

> **A human-authority platform for AI-assisted actions: explicit permission, independent enforcement, revocation, and verifiable evidence.**

**Security by Foundation. Personal by Choice. Engineered for Trust.**

Created and led by **Micki Hart** · Canonical repository: **AcingTime420/Acing-IU-Genesis**.

## What Genesis is

Genesis is a software research and engineering project built around a practical question: **How can a person use AI assistance while retaining control over what it may do?**

The intended experience lets a person understand a proposed action, authorize a precise scope, withdraw unused permission, and inspect what actually happened. **IU means Interface User**: the person remains central to the interaction and its authority.

For example, an assistant could propose adding exact text to a particular document. The person reviews the destination, text, version and expiry. A separate enforcement service checks permission again before writing. A retry must not write twice, a changed document must require fresh review, and revocation must prevent a later unauthorized write.

This document example is the narrow prototype workflow. Expense approvals, administration and other real-world actions are future applications requiring their own implementation and evidence.

## Current state: development and research

Genesis is **not production-ready**. This repository contains supporting services, simulations, research components and separately reviewed prototype branches. An open pull request is not a feature delivered on `master`, and a passing build is not proof of secure operation.

| Area | What readers should understand |
|---|---|
| Human-authority workflow | Development/Test prototypes are in separate PRs; review their exact revisions and evidence. |
| Web interface | Some surfaces use fixtures. A simulation does not enforce authority against a real system. |
| Identity and DeviceTrust | Source and tests exist; maturity and limits are documented in the capability register. |
| Local AI assistant | Separate prototype in PR #220 uses a local model runtime; model output does not itself authorize actions. This is not a Genesis-trained foundation model. |
| Guardian and Android | Supporting security research, orchestration and scaffolding; not a finished operating system. |
| Acing Vault | Software emulator; not a hardware-isolated keystore. |
| RootMaster and device-changing operations | Unavailable; no verified device executor is claimed. |
| Hardware attestation and certification | Targets; no Knox, Samsung, carrier or CTIA certification is claimed. |

The [capability register](docs/CAPABILITY_REGISTER.md) records the baseline and its dated evidence. It is not a live certification. Newer branch-specific results must be read at their recorded commits; they do not automatically promote baseline capabilities.

## The design commitments

1. **Permission originates with a person.** A model response, confident language or apparent understanding is not authorization.
2. **Authority is narrow.** Bind it to the requester, operation, target, exact approved content, relevant version and expiry.
3. **Enforcement is independent of model output.** Check authorization at the point of execution; do not let the AI grant or expand its own permissions.
4. **Revocation has defined ordering.** Deny unused revoked authority; retain evidence of actions already completed.
5. **Retries and concurrency are explicit.** Prevent duplicate mutations and stale approvals.
6. **Evidence follows the actual outcome.** Record approvals, denials and execution results without exposing secrets. Storage and tamper-resistance guarantees need separate proof.
7. **Uncertainty stays visible.** Label simulations, unavailable services, failed checks and unverified capabilities.

These are engineering requirements. Each needs implementation, adversarial tests and reproducible evidence before an operational claim is justified.

## Start here

| Reader goal | Read next |
|---|---|
| Understand the purpose and review the project | [Public review and implementation guide](docs/PROJECT_GUIDE.md) |
| Understand components and boundaries | [Architecture](ARCHITECTURE.md) |
| Check claims against evidence | [Capability register](docs/CAPABILITY_REGISTER.md) |
| Build or contribute | [Contributing](CONTRIBUTING.md), [backend](backend/README.md), [infrastructure](infrastructure/README.md) |
| Understand risks and data handling | [Threat model](THREAT_MODEL.md), [security](SECURITY.md), [privacy](PRIVACY.md), [data classification](DATA_CLASSIFICATION.md) |
| Understand change and release controls | [Repository governance](docs/governance/REPOSITORY_GOVERNANCE.md), [release process](RELEASE_PROCESS.md), [ADRs](docs/adr/README.md) |

## Implementation and validation

Use `master` as the canonical baseline. For an unmerged prototype, select its exact reviewed branch or commit and follow the instructions supplied there. Do not combine arbitrary PR heads or treat prototype migrations as production initialization.

For the Guardian baseline, documented prerequisites are Git 2.39+, Bash 5+, JDK 17, Kotlin 1.9+ and GNU Make 3.81+. Other components require their own toolchains and configuration.

```bash
git clone https://github.com/AcingTime420/Acing-IU-Genesis.git
cd Acing-IU-Genesis
git rev-parse HEAD
bash scripts/validate-premerge.sh --skip-compose
```

On Windows, clone and inspect the separate PowerShell validator before running it:

```powershell
git clone https://github.com/AcingTime420/Acing-IU-Genesis.git
Set-Location Acing-IU-Genesis
git rev-parse HEAD
Get-Content scripts/validate-premerge.ps1
```

Inspect the selected revision's script and report every skip. The Bash baseline may skip compilation when Kotlin is absent, checks only root-level Compose files, and skips HTTP readiness. Exit 0 means **enabled checks passed**, not that the entire platform was tested. It can create a local `.env` from the example. Never commit real credentials.

The PowerShell validator is a different, broader pipeline: it requires environment configuration and can start containers, apply migrations and run database checks. Do not assume Bash flags apply to it.

Service-specific setup is in the linked backend/infrastructure guides. Review secrets, migrations, exposed ports and disposable test data before starting services. Tests must not target a personal or production database.

## Prototype review map

The following are separate candidates, not merged baseline capabilities. Their PR pages identify current heads, dependencies, setup and limitations.

| Candidate | Review scope |
|---|---|
| [#161](https://github.com/AcingTime420/Acing-IU-Genesis/pull/161) | Mock human-authority UI |
| [#163](https://github.com/AcingTime420/Acing-IU-Genesis/pull/163) | Transactional C#/PostgreSQL authority prototype |
| [#164](https://github.com/AcingTime420/Acing-IU-Genesis/pull/164), [#165](https://github.com/AcingTime420/Acing-IU-Genesis/pull/165) | Local reviewer integration and concurrency work |
| [#222](https://github.com/AcingTime420/Acing-IU-Genesis/pull/222) | Stale first-approval denial |
| [#223](https://github.com/AcingTime420/Acing-IU-Genesis/pull/223) | Connected reviewer validation and dependency reconciliation; review after #222 |
| [#220](https://github.com/AcingTime420/Acing-IU-Genesis/pull/220) | Local AI assistant with separate human review boundaries |
| [#180](https://github.com/AcingTime420/Acing-IU-Genesis/pull/180) | Earlier identity proposal; overlaps these documentation changes and needs reconciliation |

Recorded test results belong to the tested commit and environment. This overview does not claim a fresh rerun of those suites.

## Authorship, permissions and responsible contribution

**Micki Hart is the creator and project lead of Acing IU: Genesis.** This repository is the canonical public development record. Reviewers should retain commit attribution and clearly distinguish original work, contributed changes and third-party dependencies.

**License status: to be determined; contact the maintainer.** This documentation update grants no new license or reuse permission. Public visibility and an invitation to review should not be represented as a transfer of project ownership or a grant of commercial rights. Third-party components retain their own applicable terms.

Do not publish credentials, private device identifiers, signing keys or private operational information. Submit focused changes through reviewed branches. Report vulnerabilities through [SECURITY.md](SECURITY.md), rather than public issues.

The technical controls and provenance described here do not establish legal exclusivity over an idea or prevent someone from copying public material. Formal licensing, contributor terms, trademark decisions and any legal protection require separate decisions.
