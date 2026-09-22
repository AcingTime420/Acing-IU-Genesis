# AUTHZ-04 Real PostgreSQL Concurrency Evidence (PR #117)

Scope: `DeviceRepository.TryAuthorizedTelemetryUpdateWithAuditAsync` in `backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/Data/DeviceRepository.cs`.

## Why this PR exists

PR #107 closes AUTHZ-04 ownership logic in production code but originally lacked executable proof under real PostgreSQL multi-connection concurrency. This PR adds that missing evidence only.

## Stacking relationship

- Base implementation PR: #107 (`fix/authz-04-device-ownership`)
- Evidence PR: #117 (`copilot/authz-04-validate-postgres-concurrency`)

## Real PostgreSQL architecture

- New suite: `tests/DeviceTrust.PostgresIntegrationTests`
- Database: PostgreSQL 16 with canonical migrations from `infrastructure/postgres/init/*.sql`
- Runtime boundary: each operation uses `DeviceRepository` through `IDbConnectionFactory` opening fresh `NpgsqlConnection`

## Independent-connection concurrency proof

Deterministic database-level coordination is used:

1. Test transaction acquires `LOCK TABLE registered_devices IN ACCESS EXCLUSIVE MODE`
2. Two independent repository operations start with distinct `ApplicationName`
3. Tests poll `pg_stat_activity` until both `UPDATE registered_devices` sessions are lock-blocked concurrently
4. Assertions verify distinct backend PIDs for each operation
5. Barrier is released and results are asserted

This proves overlap at the PostgreSQL boundary without arbitrary sleeps.

## Scenario coverage

- **Scenario A**: owner vs. non-owner concurrent submit on enrolled device; owner succeeds, non-owner rejected, owner preserved, exactly one success telemetry audit.
- **Scenario B**: unknown hardware race by two non-privileged callers; both rejected, zero rows created, zero success telemetry audits.
- **Scenario C**: privileged update on enrolled device; succeeds without ownership reassignment; success audit committed.
- **Scenario D**: forced success-audit failure via test-only DB trigger; telemetry mutation rolls back, owner unchanged, no partial success audit.

## CI integration

`.github/workflows/ci.yml` backend job now:

- provisions PostgreSQL service,
- waits for readiness with `pg_isready`,
- executes `DeviceTrust.PostgresIntegrationTests` as a required step.

## Exact integration test command

```bash
dotnet test tests/DeviceTrust.PostgresIntegrationTests/DeviceTrust.PostgresIntegrationTests.csproj -c Release --verbosity normal
```

## Local test totals observed

- `DeviceTrust.PostgresIntegrationTests`: 4 passed, 0 failed
- `DeviceTrust.UnitTests`: 35 passed, 0 failed

## Audit rollback evidence

Scenario D enforces audit insert failure after telemetry UPDATE path entry and verifies no committed telemetry change survives, proving transaction rollback behavior.

## Known limitation

Evidence focuses strictly on AUTHZ-04 telemetry/update ownership and rollback semantics; it does not introduce enrollment or unrelated DeviceTrust capabilities.
