# Acing IU: Genesis Capability Register

**Status:** Phase 0 baseline inventory + Phase 4 Task 4.6 claim-surface review
**Recorded:** 2026-08-16
**Last claim-surface update:** 2026-09-13 (issue #63)
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
| RBAC and grants | Implemented | `infrastructure/postgres/init/002_roles_and_grants.sql`; Identity and policy sources | No current end-to-end authorization result recorded | Database grants and application authorization must be reconciled and tested. |
| Policy engine | Implemented | `backend/Security/Services/AcingPolicyEngine.cs`; `backend/Security/Controllers/PolicyController.cs` | No dedicated current policy test discovered | This project is not included in the current canonical `backend/AcingIU.sln`; policy decisions are not proven consistent across API and database controls. |
| Immutable audit logging | Implemented | `infrastructure/postgres/init/000_security_core.sql`; `infrastructure/postgres/init/002_roles_and_grants.sql`; inserts in the Identity and Device Trust repositories | `tests/database/constraint_tests.sql` exercises `security_audit_logs`; no recorded current result | Application audit events use `security_audit_logs`; append-only guarantees, retention, access control, and tamper-evidence require validation. |
| Security database schemas | Implemented | `database/migrations/000_security_core.sql`; PostgreSQL initialization scripts `001` through `007` | `tests/database/constraint_tests.sql` | Migrations have not yet been verified from a clean container volume. |
| Containerized platform startup | Implemented | `infrastructure/docker-compose.yml`; service Dockerfiles; PostgreSQL and Redis configuration | `infrastructure/scripts/up.sh`; `migrate.sh`; `smoke-auth.sh` | Health, migrations, and smoke tests are not yet recorded green. |
| Operator web experience (dashboard, devices, users) | Simulator | `frontend/src/app/page.tsx`; `frontend/src/app/devices/page.tsx`; `frontend/src/app/users/page.tsx` | Fixture banners and claim-surface lint (`scripts/check-claim-surface.sh`) | UI presence is not evidence of backend enforcement. All trust/RF/partition values are fixtures. |
| RootMaster operator surface | Not available | `frontend/src/app/rootmaster/page.tsx` (hard safety gate only) | Claim-surface lint requires “RootMaster unavailable” and rejects flash/Magisk/decompile language | Destructive research UI disabled until Android safety gates and capability evidence exist. |
| Android client / provisioning workflow | Simulator | `app/` project and example Android tests | `ExampleUnitTest.kt`, `ExampleRobolectricTest.kt`, `ExampleInstrumentedTest.kt`, and screenshot test | Current evidence is example/scaffold-level; authorized recovery and device-specific operations are not verified. |
| Firmware tooling and recovery | Target | No authoritative validated firmware-operation implementation was identified | No safe-device recovery test discovered | Treat firmware support as unimplemented until authorized, model-specific, recoverable flows are demonstrated. |
| Samsung Knox product integration | Target | None — design inspiration only in docs | Explicitly disclaimed in `docs/SRS.md`, `docs/Architecture.md` | **Not implemented.** Do not claim Knox certification, Knox Vault hardware, or Knox Attestation API. |
| Carrier / CTIA certification | Target | None | CTIA-style RF values in UI are fixtures only | **Not certified.** Research metrics only. |
| AI assistance and external APIs | External dependency | Repository metadata and documentation reference AI tooling; no governed provider integration was confirmed | No provider contract, secret-isolation, or authorization test discovered | Do not send device data or secrets to external models; Phase 8 must establish explicit provider controls. |
| CI/CD and release provenance | Implemented | `.github/workflows/`; `RELEASE_PROCESS.md`; deployment documentation | Claim-surface lint runs in `ci.yml` repo-integrity job | Branch protection, artifact provenance, and release recovery require Phase 10 verification. |
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
