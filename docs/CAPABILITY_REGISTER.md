# Acing IU: Genesis Capability Register

**Status:** Phase 0 baseline inventory
**Recorded:** 2026-08-16
**Evidence standard:** A capability is not production-verified merely because source code, a UI, or a build manifest exists. “Verified” requires the linked automated evidence to pass at a recorded commit.

## Maturity Labels

| Label | Meaning |
|---|---|
| Implemented | Source and configuration exist; the capability has not yet passed the Phase 2 baseline. |
| Tested | Source exists and a relevant automated test is committed; the current test result has not yet been recorded. |
| Verified | Implemented capability with reproducible current validation evidence. |
| Simulator | User-interface or workflow representation without proof of end-to-end enforcement. |
| Target | Intended product capability with no sufficient implementation evidence. |
| External dependency | Capability depends on a separately operated platform, account, credential, or service. |

## Capability Matrix

| Capability | Maturity | Source evidence | Test or validation evidence | Current limitation |
|---|---|---|---|---|
| Password registration and authentication | Implemented | `backend/Identity/src/AcingIU.Identity.Api/Controllers/AuthController.cs`; `backend/Identity/src/AcingIU.Identity.Api/Services/AuthService.cs`; `backend/Identity/src/AcingIU.Identity.Api/Services/PasswordHasher.cs` | No dedicated registration/authentication behavior test identified in this baseline | Shared-kernel tests do not verify registration, authentication, persistence, throttling, or authorization behavior. |
| JWT issuance, refresh, and revocation | Implemented | `backend/Identity/src/AcingIU.Identity.Api/Services/TokenService.cs`; `backend/Identity/src/AcingIU.Identity.Api/Options/JwtOptions.cs`; `backend/Identity/src/AcingIU.Identity.Api/Services/TokenRevocationStore.cs` | No capability-specific current validation evidence linked here | Dependency and end-to-end token lifecycle evidence must be recorded before reclassification. |
| MFA / TOTP enrollment and verification | Tested | `backend/Identity/src/AcingIU.Identity.Api/Services/MfaService.cs`; `backend/Identity/src/AcingIU.Identity.Api/Services/MfaSecretProtector.cs`; `backend/Identity/src/AcingIU.Identity.Api/Models/MfaModels.cs` | `tests/Identity.UnitTests/TotpMfaServiceTests.cs` | TOTP behavior has unit coverage; encrypted secret persistence and end-to-end enrollment remain unverified. |
| OAuth federation | Target | No authoritative provider integration source established in the baseline inventory | No dedicated integration test discovered | Do not claim SSO or OAuth availability until provider configuration, callback validation, token verification, and tests are added. |
| Device trust scoring | Tested | `backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/Services/TrustScoreEngine.cs`; `backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/Controllers/TrustController.cs` | `tests/DeviceTrust.UnitTests/TrustScoreEngineTests.cs` | Unit tests cover scoring rules; device attestation enforcement and end-to-end service validation remain unverified. |
| Device attestation | Target | Device-trust schema and service references exist | No attestation-provider integration test discovered | Hardware-backed or platform attestation must not be represented as enforced. |
| RBAC and grants | Implemented | `infrastructure/postgres/init/002_roles_and_grants.sql`; Identity and policy sources | No current end-to-end authorization result recorded | Database grants and application authorization must be reconciled and tested. |
| Policy engine | Implemented | `backend/Security/Services/AcingPolicyEngine.cs`; `backend/Security/Controllers/PolicyController.cs` | No dedicated current policy test discovered | This project is not included in the current canonical `backend/AcingIU.sln`; policy decisions are not proven consistent across API and database controls. |
| Immutable audit logging | Implemented | `infrastructure/postgres/init/000_security_core.sql`; `infrastructure/postgres/init/002_roles_and_grants.sql`; inserts in the Identity and Device Trust repositories | `tests/database/constraint_tests.sql` exercises `security_audit_logs`; no recorded current result | Application audit events use `security_audit_logs`; append-only guarantees, retention, access control, and tamper-evidence require validation. The separate `audit_logs` schema is not evidence for this capability. |
| Security database schemas | Implemented | `database/migrations/000_security_core.sql`; PostgreSQL initialization scripts `001` through `007` | `tests/database/constraint_tests.sql` | Migrations have not yet been verified from a clean container volume. |
| Containerized platform startup | Implemented | `infrastructure/docker-compose.yml`; service Dockerfiles; PostgreSQL and Redis configuration | `infrastructure/scripts/up.sh`; `migrate.sh`; `smoke-auth.sh` | Health, migrations, and smoke tests are not yet recorded green. |
| Operator web experience | Simulator | `frontend/` source tree and deployment manifests | No authoritative end-to-end workflow test discovered | UI presence is not evidence of backend enforcement or accessible production workflows. |
| Android client / provisioning workflow | Simulator | `app/` project and example Android tests | `ExampleUnitTest.kt`, `ExampleRobolectricTest.kt`, `ExampleInstrumentedTest.kt`, and screenshot test | Current evidence is example/scaffold-level; authorized recovery and device-specific operations are not verified. |
| Firmware tooling and recovery | Target | No authoritative validated firmware-operation implementation was identified in the baseline inventory | No safe-device recovery test discovered | Treat firmware support as unimplemented until authorized, model-specific, recoverable flows are demonstrated. |
| AI assistance and external APIs | External dependency | Repository metadata and documentation reference AI tooling; no governed provider integration was confirmed | No provider contract, secret-isolation, or authorization test discovered | Do not send device data or secrets to external models; Phase 8 must establish explicit provider controls. |
| CI/CD and release provenance | Implemented | `.github/workflows/`; `RELEASE_PROCESS.md`; deployment documentation | Individual workflow evidence exists outside this register; no complete release-provenance record is linked here | Branch protection, artifact provenance, and release recovery require Phase 10 verification. |

## Baseline Claims Policy

Product, documentation, and user-interface text must use the maturity labels in this register. “Verified,” “secure,” “enforced,” “hardware-backed,” “production-ready,” and similar claims are prohibited unless the related row has current linked validation evidence. Any capability reclassification requires a pull request that updates this file and cites the test, deployment, or external dependency evidence that supports the change.
