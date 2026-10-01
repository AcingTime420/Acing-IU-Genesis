# PostgreSQL-Backed Audit Service Deployment Standard

The canonical Audit API is a **read-only privileged review service** for the `security_audit_logs` ledger. It accepts no client-originated audit writes.

Required configuration: `ConnectionStrings__AuditDatabase` using `acing_audit_reader`, plus `Jwt__Issuer`, `Jwt__Audience`, and a `Jwt__SigningKey` of at least 32 characters.

Clean bootstrap injects `AUDIT_DB_PASSWORD` through `003_set_role_passwords.sh`. Existing databases upgraded to migration 008 must set/rotate the audit-reader password through the approved secret-management procedure before deployment.

`GET /api/audit` requires role `Admin` or `Operator`. The API exposes no client write/update/delete endpoint. Producer services retain INSERT-only rights. This service is not production-verified until deployment, database privilege probes, and end-to-end query evidence are recorded against a commit.
