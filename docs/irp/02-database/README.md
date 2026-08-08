# Database — Genesis Phase 2

**Implementation baseline: Pending validation**

## Bootstrap vs upgrade

| Mechanism | When | Location |
|-----------|------|----------|
| **Bootstrap** | Empty Postgres volume only | `infrastructure/postgres/init/000–003` via `/docker-entrypoint-initdb.d` |
| **Upgrade** | Existing volume | `infrastructure/scripts/migrate.sh` + `schema_migrations` ledger |

Init scripts are **not** the long-term upgrade mechanism. New versions add `NNN_*.sql` and record rows in `schema_migrations`.

## Migration files (keep three trees in sync)

1. `irp/02-database/migrations/`
2. `infrastructure/postgres/init/`
3. `installer/payload/platform/postgres/init/`

| File | Purpose |
|------|---------|
| `000_security_core.sql` | pgcrypto, **citext first**, ledger, audit, policy |
| `001_init_identity_schema.sql` | users, roles, refresh_tokens, devices, triggers |
| `002_roles_and_grants.sql` | least-privilege roles |
| `003_set_role_passwords.sh` | passwords + CONNECT (init only) |

## Roles

| Role | Use |
|------|-----|
| `acing_admin` / `POSTGRES_USER` | Bootstrap superuser (compose) |
| `acing_migrator` | DDL migrations |
| `acing_identity` | Identity API DML; **INSERT-only** on `security_audit_logs` |
| `acing_device_trust` | Device Trust DML; **INSERT-only** on audit |

## Production networking

Do **not** publish Postgres or Redis host ports. Compose binds `127.0.0.1` for development only.

## MFA

See [MFA_SECRET_PROTECTION.md](./MFA_SECRET_PROTECTION.md).
