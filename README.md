# Acing IU: Genesis — Human Authority for the Age of Artificial Intelligence

**Security by Foundation. Personal by Choice. Engineered for Trust.**

Human-authority platform for AI-assisted actions, combining explicit permission, independent enforcement, revocation, and verifiable evidence.

Acing IU: Genesis is an emerging human-authority platform designed to keep people in control of AI-assisted operations. It enables explicit authorization, narrowly scoped permissions, independent policy enforcement, revocation, and reviewable evidence. Its supporting security architecture incorporates identity, device trust, and governed administrative workflows. Genesis remains under active development, with experimental and planned capabilities clearly distinguished from validated functionality.

**IU means Interface User. The human remains the source of delegated authority.**
AI agents may propose actions, but cannot grant themselves permission. Enforcement must be independent, and consequential decisions and outcomes must be reviewable. This describes the product direction; it is not a claim that the complete lifecycle is operational in this checkout.

## Development status

Genesis is in development. Source code, mock interfaces, and passing compilation alone do not establish security guarantees or production readiness. See the [capability register](docs/CAPABILITY_REGISTER.md) for implementation locations, evidence, limitations, and acceptance criteria.

| Area | Current evidence and limits |
|---|---|
| Human authorization → independent enforcement → agent action → recorded outcome | Target architecture; end-to-end behavior not verified in this checkout. Remote prototype PRs #161–167 remain open drafts and require review before integration. |
| Identity, sessions, and DeviceTrust | Canonical backend source and unit tests exist; current runtime validation is required. Documented ownership and audit gaps remain release blockers. |
| Operator frontend | Simulator surfaces; fixture data does not prove live device operations, backend enforcement, or connectivity. |
| Android security and Guardian | Supporting research and experimental components; not a finished operating system or a hardware-attestation guarantee. |
| Acing Vault | Software emulator; not hardware-isolated key storage. |
| Live AI provider integration | Not verified; provider output is advisory and cannot become an authority source. |

Genesis does not claim Samsung Knox certification, carrier certification, independently certified security, or tamper-proof audit storage. Device-changing and RootMaster operations remain unavailable pending their safety gates.

## Development and validation

Use the canonical `backend/` implementation. The duplicate `acing-iu/backend/` is frozen; installer payloads are derived, not independent development roots. Follow [repository governance](docs/governance/REPOSITORY_GOVERNANCE.md) and [CONTRIBUTING.md](CONTRIBUTING.md). The canonical default branch is `master`.

The CI workflow uses .NET 8 and Node.js 22. With these tools and dependency registry access available:

```bash
# From the repository root
dotnet restore backend/AcingIU.sln
dotnet build backend/AcingIU.sln --configuration Release --no-restore
dotnet test backend/AcingIU.sln --configuration Release --no-build

cd frontend
npm ci
npm run lint
npx --no-install tsc --noEmit
npm run build
cd ..
```

These are development commands, not recorded passing results. The frontend currently declares no test script; `npm test --if-present` is not test evidence.

```bash
# Static claim guard; does not validate authorization or runtime behavior
bash scripts/check-claim-surface.sh
```

The legacy `scripts/validate-premerge.sh` may exit zero while skipping compilation and service checks. Read its skip output; do not use that result alone as readiness evidence. The Guardian build entry point references a missing `system/security/guardian/build/` directory in the inspected baseline. A fail-fast wrapper fix alone does not restore that build. Review the current Guardian remediation before using its documented build commands.

For PostgreSQL, Redis, Identity, and DeviceTrust service setup, see [backend documentation](backend/README.md) and [infrastructure documentation](infrastructure/README.md). Compose startup requires local development credentials and isolated resources; never reuse production credentials or delete persistent state to make tests pass. Repository infrastructure is development configuration, not deployment authorization.

## Supporting Android and security research

Android security, Guardian orchestration, device trust, policy experiments, and vault emulation support the authority platform's research. Preserve their evidence and limitations:

- [Guardian sources](system/security/guardian/): identity/trust foundations, service orchestration, threat-engine stubs, boot scripts, and software vault emulation.
- [Android safety decision](docs/adr/ADR-006-android-and-firmware-safety.md): gates for firmware and device-changing work.
- [DeviceTrust backend](backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/): trust scoring and device APIs; scores are not hardware attestation.

## Architecture and governance

The target lifecycle is **Human → Authorization → Independent Enforcement → Agent Action → Recorded Outcome**. Identity, policy, device trust, secure storage, monitoring, and audit support this lifecycle; they do not grant agents human authority.

See [ARCHITECTURE.md](ARCHITECTURE.md), [SECURITY.md](SECURITY.md), [THREAT_MODEL.md](THREAT_MODEL.md), [architecture decisions](docs/adr/README.md), and [validation evidence](docs/evidence/repository-integrity-baseline.md). Historical evidence describes its recorded revision, not necessarily today's state.

Releases require the evidence and review in [RELEASE_PROCESS.md](RELEASE_PROCESS.md). Security reports follow [SECURITY.md](SECURITY.md); do not publish suspected vulnerabilities in public issues.

---

## License

*License to be determined — see project maintainer.*

## Repository Governance

The canonical source repository is AcingTime420/Acing-IU-Genesis. The public logical identifier for the maintainer's Windows worktree is `canonical-windows-worktree`; its machine-specific location remains private. Repository controls, authorized recovery paths, and the archive-only legacy remote policy are defined in [docs/governance/REPOSITORY_GOVERNANCE.md](docs/governance/REPOSITORY_GOVERNANCE.md).
