# Acing IU: Genesis Capability Register

**Status:** Phase 0 baseline inventory + Phase 4 claim-surface review + canonical stabilization reconciliation
**Recorded:** 2026-08-16
**Last claim-surface update:** 2026-10-02 (PR #131 stabilization)
**Current stabilization evidence:** PR #131 head `bdc19517370c8d4dfae146f05cd7d94299cb4e8e` passed Repository Integrity, Clean-Clone Baseline, Security and Dependency Review, SBOM, Database, and Containers workflows. This evidence applies only to the scopes those workflows actually test.
**Evidence standard:** A capability is not production-verified merely because source code, a UI, or a build manifest exists. “Verified” requires the linked automated evidence to pass at a recorded commit.

## Maturity Labels

| Label | Meaning |
|---|---|
| Implemented | Source and configuration exist; the capability has not yet passed the Phase 2 baseline. |
| Tested | Source exists and a relevant automated test is committed; the current test result has not yet been recorded. |
| Verified | Implemented capability with reproducible current validation evidence. |
| Simulator | User-interface or workflow representation without proof of end-to-end enforcement. |
| Target | Intended product capability with no sufficient implementation evidence. |
| Not available | Explicitly disabled or withheld from operators until safety gates pass. |
| External dependency | Capability depends on a separately operated platform, account, credential, or service. |

## Capability Matrix

| Capability | Maturity | Source evidence | Test or validation evidence | Current limitation |
|---|---|---|---|---|
| Password registration and authentication | Implemented | `backend/Identity/src/AcingIU.Identity.Api/Controllers/AuthController.cs`; `backend/Identity/src/AcingIU.Identity.Api/Services/AuthService.cs`; `backend/Identity/src/AcingIU.Identity.Api/Services/PasswordHasher.cs` | No dedicated registration/authentication behavior test identified in this baseline | Shared-kernel tests do not verify registration, authentication, persistence, throttling, or authorization behavior. |
| JWT issuance, refresh, and revocation | Implemented | `backend/Identity/src/AcingIU.Identity.Api/Services/TokenService.cs`; `backend/Identity/src/AcingIU.Identity.Api/Options/JwtOptions.cs`; `backend/Identity/src/AcingIU.Identity.Api/Services/TokenRevocationStore.cs` | No capability-specific current validation evidence linked here | Dependency and end-to-end token lifecycle evidence must be recorded before reclassification. |
| MFA / TOTP enrollment and verification | Tested | `backend/Identity/src/AcingIU.Identity.Api/Services/MfaService.cs`; `backend/Identity/src/AcingIU.Identity.Api/Services/MfaSecretProtector.cs`; `backend/Identity/src/AcingIU.Identity.Api/Models/MfaModels.cs` | `tests/Identity.UnitTests/TotpMfaServiceTests.cs` | TOTP behavior has unit coverage; encrypted secret persistence and end-to-end enrollment remain unverified. |
| OAuth federation | Target | No authoritative provider integration source established in the baseline inventory | No dedicated integration test discovered | Do not claim SSO or OAuth availability until provider configuration, callback validation, token verification, and tests are added. |
| Device trust scoring | Tested | `backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/Services/TrustScoreEngine.cs`; `backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/Controllers/TrustController.cs` | `tests/DeviceTrust.UnitTests/TrustScoreEngineTests.cs` | Unit tests cover scoring rules; device attestation enforcement and end-to-end service validation remain unverified. |
| Device attestation (hardware-backed) | Target | Software emulator only: `system/security/guardian/core/AcingVaultEmulator.kt`; DeviceTrust schema fields | No attestation-provider integration test; emulator is non-cryptographic | **Must not** be represented as Knox, Samsung, or carrier-certified attestation. UI fixtures must use Simulator labeling. |
| Acing Vault (software emulator) | Simulator | `system/security/guardian/core/AcingVaultEmulator.kt` | Deterministic init (no `Math.random`); claim-surface lint rejects non-determinism | Pure in-process map; not hardware-isolated. |
| RBAC and grants | Implemented | `infrastructure/postgres/init/002_roles_and_grants.sql`; object-level DeviceTrust ownership enforcement in `backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/` | `tests/DeviceTrust.UnitTests/DeviceOwnershipAuthorizationTests.cs`; `tests/DeviceTrust.PostgresIntegrationTests/TelemetryOwnershipPostgresIntegrationTests.cs`; PR #131 Clean-Clone Baseline passed at the recorded stabilization commit | DeviceTrust ownership authorization is covered; broader platform-wide RBAC/policy enforcement is not yet established as a single canonical Policy service. |
| Policy engine | Target | No canonical Policy service is present in `backend/AcingIU.sln`; the former shallow `backend/Security/` implementation was removed during PR #131 canonical reconciliation | No dedicated canonical Policy-service test exists | Narrow authorization boundaries exist in current services, but Genesis must not claim a central operational Policy engine until one canonical implementation and its tests are added. |
| Immutable audit logging | Verified | `infrastructure/postgres/init/001_core_schema.sql`; `infrastructure/postgres/init/002_roles_and_grants.sql`; `infrastructure/postgres/init/008_audit_immutable_grants.sql`; inserts in the Identity and Device Trust repositories | `tests/database/constraint_tests.sql` plus Database workflow privilege probes passed at PR #131 head `bdc19517370c8d4dfae146f05cd7d94299cb4e8e` | Verified scope is runtime-role append-only database access: producers may INSERT but cannot UPDATE/DELETE. This is not a claim of cryptographic tamper-evidence, retention enforcement, or an operational audit-query service. |
| Security database schemas | Verified | Canonical PostgreSQL initialization scripts under `infrastructure/postgres/init/` through migration `008` | `tests/database/constraint_tests.sql`; Database workflow applies migrations in order and passed at PR #131 head `bdc19517370c8d4dfae146f05cd7d94299cb4e8e` | Verified for the CI PostgreSQL bootstrap/constraint/privilege-probe scope; production migration, backup, restore, and rollback procedures remain separate release-readiness work. |
| Containerized platform startup | Implemented | `infrastructure/docker-compose.yml`; canonical Identity and DeviceTrust Dockerfiles; PostgreSQL and Redis configuration | PR #131 Containers workflow builds and Trivy-scans both service images; `scripts/validate-premerge.sh` contains optional Compose startup and liveness checks | CI currently runs `validate-premerge.sh --skip-compose`; therefore full Compose startup/liveness is not yet promoted to Verified even though the service images build and pass the current HIGH/CRITICAL container gate. |
| Operator web experience (dashboard, devices, users) | Simulator | `frontend/src/app/page.tsx`; `frontend/src/app/devices/page.tsx`; `frontend/src/app/users/page.tsx` | Fixture banners and claim-surface lint (`scripts/check-claim-surface.sh`) | UI presence is not evidence of backend enforcement. All trust/RF/partition values are fixtures. |
| RootMaster operator surface | Not available | `frontend/src/app/rootmaster/page.tsx` (hard safety gate only) | Claim-surface lint requires “RootMaster unavailable” and rejects flash/Magisk/decompile language | Destructive research UI disabled until Android safety gates and capability evidence exist. |
| Android client / provisioning workflow | Simulator | `app/` project and example Android tests | `ExampleUnitTest.kt`, `ExampleRobolectricTest.kt`, `ExampleInstrumentedTest.kt`, and screenshot test | Current evidence is example/scaffold-level; authorized recovery and device-specific operations are not verified. |
| Firmware tooling and recovery | Target | No authoritative validated firmware-operation implementation was identified | No safe-device recovery test discovered | Treat firmware support as unimplemented until authorized, model-specific, recoverable flows are demonstrated. |
| Samsung Knox product integration | Target | None — design inspiration only in docs | Explicitly disclaimed in `docs/SRS.md`, `docs/Architecture.md` | **Not implemented.** Do not claim Knox certification, Knox Vault hardware, or Knox Attestation API. |
| Carrier / CTIA certification | Target | None | CTIA-style RF values in UI are fixtures only | **Not certified.** Research metrics only. |
| AI assistance and external APIs | External dependency | Repository metadata and documentation reference AI tooling; no governed provider integration was confirmed | No provider contract, secret-isolation, or authorization test discovered | Do not send device data or secrets to external models; Phase 8 must establish explicit provider controls. |
| CI/CD and release provenance | Implemented | `.github/workflows/`; `RELEASE_PROCESS.md`; deployment documentation | PR #131 current workflows pass Repository Integrity, Clean-Clone Baseline, Security and Dependency Review, SBOM, Database, and Containers; installer provenance and claim-surface checks run in CI | Green PR validation is not equivalent to protected production release provenance; branch protection, signed/reproducible release artifacts, deployment evidence, and release recovery remain Phase 10 work. |
| Claim-surface regression guard | Implemented | `scripts/check-claim-surface.sh`; `.github/workflows/ci.yml` | Local run 2026-09-13: pass | Blocks SIG-KNOX IDs, real email domains in fixtures, bare Knox capability language in operator UI, RootMaster re-enable of destructive terms, vault non-determinism. |

## Claim-to-evidence map (issue #63)

Every public or operator-facing claim about device/security posture must match a row below. If maturity is **Target**, **Simulator**, or **Not available**, UI and docs must not present it as live, certified, or enforced.

| Claim (examples of prohibited operational wording) | Allowed public wording | Maturity | Evidence |
|---|---|---|---|
| “Samsung Knox attestation / certification” | Design inspiration only; not integrated | Target | `docs/SRS.md` disclaimer; no vendor SDK |
| “Knox Vault / hardware fuse / register mapping” | Software emulator / fixture flag only | Simulator / Target | `AcingVaultEmulator.kt`; devices page `warrantyFlag` fixture |
| “CTIA certified” / “fully certified baseband” | Fixture RF values; not certification | Target | Dashboard and devices fixture labels |
| “SIG-KNOX-* credentials” | `SIG-FIXTURE-*` only | Simulator | `frontend/src/app/users/page.tsx` |
| Root / unlock / flash / Magisk / decompile actions | Surface unavailable | Not available | RootMaster hard gate page |
| Live device quarantine / policy enforcement from UI | Local fixture state only | Simulator | Devices page toasts state “No device operation occurred” |
| Hardware-backed attestation in production | Not available | Target | No provider integration test |

## Baseline Claims Policy

Product, documentation, and user-interface text must use the maturity labels in this register. “Verified,” “secure,” “enforced,” “hardware-backed,” “production-ready,” “Knox certified,” and similar claims are prohibited unless the related row has current linked validation evidence.

Any capability reclassification requires a pull request that updates this file and cites the test, deployment, or external dependency evidence that supports the change.

Operator-facing regressions are additionally blocked by `scripts/check-claim-surface.sh` on every CI push/PR.
