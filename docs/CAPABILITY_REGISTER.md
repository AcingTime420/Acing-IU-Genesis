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
| Password registration and authentication | Tested | `backend/Identity/src/AcingIU.Identity.Api/Controllers/AuthController.cs`; `Services/AuthService.cs`; `Services/PasswordHasher.cs` | `tests/Identity.UnitTests/ResultTests.cs` | Current build and dependency baseline is not yet green. |
| JWT issuance, refresh, and revocation | Implemented | `backend/Identity/src/AcingIU.Identity.Api/Services/TokenService.cs`; `Options/JwtOptions.cs`; `Services/TokenRevocationStore.cs` | No current passing compatibility result recorded | Known vulnerable JWT dependency warning must be remediated in Phase 2. |
| MFA / TOTP enrollment and verification | Tested | `backend/Identity/src/AcingIU.Identity.Api/Services/MfaService.cs`; `MfaSecretProtector.cs`; `Models/MfaModels.cs` | `tests/Identity.UnitTests/TotpMfaServiceTests.cs` | No current clean-clone test evidence. |
| OAuth federation | Target | No authoritative provider integration source established in the baseline inventory | No dedicated integration test discovered | Do not claim SSO or OAuth availability until provider configuration, callback validation, token verification, and tests are added. |
| Device trust scoring | Tested | `backend/DeviceTrust/Controllers/TrustController.cs`; `Services/DeviceTrustService.cs` | `tests/DeviceTrust.UnitTests/TrustScoreEngineTests.cs` | Device attestation enforcement and end-to-end service validation remain unverified. |
| Device attestation | Target | Device-trust schema and service references exist | No attestation-provider integration test discovered | Hardware-backed or platform attestation must not be represented as enforced. |
| RBAC and grants | Implemented | `infrastructure/postgres/init/002_roles_and_grants.sql`; Identity and policy sources | No current end-to-end authorization result recorded | Database grants and application authorization must be reconciled and tested. |
| Policy engine | Implemented | `backend/Security/Services/AcingPolicyEngine.cs`; `Controllers/PolicyController.cs` | No dedicated current policy test discovered | Policy decisions are not yet proven consistent across API and database controls. |
| Immutable audit logging | Implemented | `infrastructure/postgres/init/003_audit_logs_schema.sql`; audit references in database and backend sources | `tests/database/constraint_tests.sql` exists; no recorded current result | Append-only guarantees, retention, access control, and tamper-evidence require validation. |
| Security database schemas | Implemented | `database/migrations/000_security_core.sql`; PostgreSQL initialization scripts `001` through `007` | `tests/database/constraint_tests.sql` | Migrations have not yet been verified from a clean container volume. |
| Containerized platform startup | Implemented | `infrastructure/docker-compose.yml`; service Dockerfiles; PostgreSQL and Redis configuration | `infrastructure/scripts/up.sh`; `migrate.sh`; `smoke-auth.sh` | Health, migrations, and smoke tests are not yet recorded green. |
| Operator web experience | Simulator | `frontend/` source tree and deployment manifests | No authoritative end-to-end workflow test discovered | UI presence is not evidence of backend enforcement or accessible production workflows. |
| Android client / provisioning workflow | Simulator | `app/` project and example Android tests | `ExampleUnitTest.kt`, `ExampleRobolectricTest.kt`, `ExampleInstrumentedTest.kt`, and screenshot test | Current evidence is example/scaffold-level; authorized recovery and device-specific operations are not verified. |
| Firmware tooling and recovery | Target | No authoritative validated firmware-operation implementation was identified in the baseline inventory | No safe-device recovery test discovered | Treat firmware support as unimplemented until authorized, model-specific, recoverable flows are demonstrated. |
| AI assistance and external APIs | External dependency | Repository metadata and documentation reference AI tooling; no governed provider integration was confirmed | No provider contract, secret-isolation, or authorization test discovered | Do not send device data or secrets to external models; Phase 8 must establish explicit provider controls. |
| CI/CD and release provenance | Implemented | `.github/workflows/`, `.circleci/`, deployment documentation | No current full pipeline result recorded | Branch protection, artifact provenance, and release recovery require Phase 10 verification. |

## Baseline Claims Policy

Product, documentation, and user-interface text must use the maturity labels in this register. “Verified,” “secure,” “enforced,” “hardware-backed,” “production-ready,” and similar claims are prohibited unless the related row has current linked validation evidence. Any capability reclassification requires a pull request that updates this file and cites the test, deployment, or external dependency evidence that supports the change.
