# Phase 2 database remediation — change report

**Status:** Implementation baseline: **Pending validation**  
**ZIP:** Not rebuilt (per request)

## Items 1–16

| # | Requirement | Resolution |
|---|-------------|------------|
| 1 | `citext` before use | `CREATE EXTENSION citext` in `000` before any `CITEXT` column in `001` |
| 2 | Remove ineffective fallback | Fallback `DO $$` block **removed**; citext is mandatory |
| 3 | `replaced_by` type + FK | `BIGINT REFERENCES refresh_tokens(id)`; C# `long?` |
| 4 | Separate credentials | `MIGRATOR_*`, `IDENTITY_*`, `DEVICE_TRUST_*` vs admin `POSTGRES_*` |
| 5 | Least-privilege roles | `002_roles_and_grants.sql` + `003_set_role_passwords.sh` |
| 6 | Audit immutable for runtime | `GRANT INSERT` only; `REVOKE UPDATE, DELETE` on audit for app roles |
| 7 | MFA secret protection | `MFA_SECRET_PROTECTION.md` — plaintext **not** accepted for production |
| 8 | Compose fail closed | `${VAR:?must be set}` for Postgres/Redis/JWT secrets |
| 9 | Bind 127.0.0.1 | Postgres + Redis ports; production note in README |
| 10 | No hardcoded migrate cmd | `db-migrate` uses env + `migrate.sh` |
| 11 | Versioned migrations | `schema_migrations` + `migrate.sh`; init = bootstrap only |
| 12 | `updated_at` handling | `set_updated_at()` triggers on `users`, `registered_devices` |
| 13 | Refresh time + indexes | `CHECK (expires_at > created_at)`; active/expiry indexes |
| 14 | `ip_address INET` | Column type `INET`; insert already casts/`inet`-compatible |
| 15 | Three SQL trees synced | irp / infrastructure/init / installer payload |
| 16 | DB tests | `tests/database/constraint_tests.sql` |

## File-by-file

| File | Change |
|------|--------|
| `irp/02-database/migrations/000_security_core.sql` | Extensions first; `schema_migrations`; audit/policy |
| `irp/02-database/migrations/001_init_identity_schema.sql` | Full identity/devices; `replaced_by` BIGINT FK; INET; triggers; checks |
| `irp/02-database/migrations/002_roles_and_grants.sql` | **New** — roles + grants |
| `irp/02-database/MFA_SECRET_PROTECTION.md` | **New** |
| `irp/02-database/README.md` | Bootstrap vs upgrade, role matrix |
| `infrastructure/postgres/init/*` | Synced SQL + `003_set_role_passwords.sh` |
| `infrastructure/scripts/migrate.sh` | **New** versioned runner |
| `infrastructure/docker-compose.yml` | Fail-closed secrets; localhost binds; runtime DB users; migrate service |
| `infrastructure/.env.example` | All secret slots, no weak defaults presented as production-ready |
| `installer/payload/platform/postgres/init/*` | Synced |
| `backend/.../UserRepository.cs` | `replaced_by` → `long?` |
| `tests/database/constraint_tests.sql` | **New** |

## Deliberately deferred

| Item | Reason |
|------|--------|
| Application-layer MFA encrypt/decrypt in C# | Documented as required before prod; needs KMS design (separate story) |
| Automated CI job executing `constraint_tests.sql` | SQL artifact provided; wire when Postgres service available in CI |
| Runtime privilege test with live `SET ROLE` | Requires running cluster + passwords; SQL file documents intent |
| Renaming `mfa_secret_base32` → ciphertext column | Deferred to encryption story migration `003+` |
| Removing host port publish entirely in compose | Dev ergonomics; documented prod must not expose |

## Validation still required

- Empty-volume `docker compose up` with real secrets in `.env`
- `psql -f tests/database/constraint_tests.sql`
- Confirm `acing_identity` cannot `UPDATE security_audit_logs`
- `dotnet test` / smoke after stack is up  
