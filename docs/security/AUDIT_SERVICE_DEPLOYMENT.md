# PostgreSQL-Backed Audit Service Deployment Standard

## Purpose

The Audit API is a **read-only privileged review service** for the canonical `security_audit_logs` PostgreSQL ledger. It does not accept client-originated audit events. Trusted Identity and DeviceTrust write paths remain responsible for generating audit events through the controlled database boundary.

## Required runtime configuration

The service requires the following values from the approved deployment secret manager; they must never be committed to source control.

| Configuration key | Required value | Security rationale |
|---|---|---|
| `ConnectionStrings__AuditDatabase` | PostgreSQL connection string using the `acing_audit_reader` identity | Limits the API to `SELECT` on the audit ledger. |
| `Jwt__Issuer` | Identity service issuer | Rejects tokens issued by another authority. |
| `Jwt__Audience` | Audit API audience | Prevents token replay to an unintended service. |
| `Jwt__SigningKey` | Shared signing secret or validated key-provider material | Validates token integrity. |

The database migration `008_audit_immutable_grants.sql` revokes `UPDATE`, `DELETE`, and `TRUNCATE` from `PUBLIC`, `acing_identity`, and `acing_device_trust`. It grants `INSERT` only to the approved producer roles and `SELECT` only to `acing_audit_reader`.

## Access control

`GET /api/audit` requires a valid bearer token and the `Admin` or `Operator` role. Requests without a token receive `401`; authenticated principals without either privileged role receive `403`. Pagination is bounded to 500 records per request, and the API intentionally exposes no update, deletion, or client-write endpoint.

## Deployment verification

Apply the ordered PostgreSQL initialization scripts before deploying the service. Validate `has_table_privilege` for every relevant role: producers must have `INSERT` and no `UPDATE`/`DELETE`; the reader must have `SELECT` only. Deploy the Audit API with HTTPS, authenticated ingress, and Swagger disabled outside the Development environment. Run `dotnet test AcingIU.sln --no-restore` as the pre-deployment authorization test gate.
