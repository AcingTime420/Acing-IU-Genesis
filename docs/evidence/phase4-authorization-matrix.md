# Authorization Matrix — Acing-IU-Genesis (Phase 4, Task 4.4)

**Status:** Partial — AUTHZ-04 read + telemetry ownership remediated  
**Version:** 1.3  
**Last updated:** 2026-09-14  
**Tracking:** PR #107

## Hardware identifier lookup

Exact ordinal / SQL equality only. **No normalization.**

## GetDevice decision table

| Caller | Subject | Role | Device | HTTP |
|---|---|---|---|---|
| Unauthenticated | — | — | any | 401 |
| Authenticated | missing/non-GUID | any | any | 401 |
| User A | valid A | User | owned by A | 200 |
| User A | valid A | User | owned by B | 404 |
| User A | valid A | User | unknown | 404 |
| Admin/Operator | valid | Admin/Operator | any existing | 200 |

## Telemetry submit decision table

| Caller | Device state | HTTP | Notes |
|---|---|---|---|
| User A | new hwId | 200 | Owner set to A |
| User A | owned by A | 200 | Owner preserved |
| User A | owned by B | 404 | Anti-enum; no score update |
| User A | null owner (legacy) | 404 | Fail-closed; no silent claim |
| Admin/Operator | owned by other / null | 200 | Telemetry update; **owner not reassigned** |

Ownership reassignment is a **future explicit workflow**, not ordinary telemetry.

## Audit-failure residual risk

Denial audits are best-effort (`TryWriteAuditAsync`). If audit storage fails, HTTP still returns the same 404 as unknown-device. **Operators must alert on `security_audit_logs` write failures / DB health** so denials are not silently unlogged.

## Installer payload

Canonical security sources under `backend/DeviceTrust/...` must match `installer/payload/platform/backend/DeviceTrust/...`. CI: `scripts/check-devicetrust-payload-sync.sh`.

## Review history

| Version | Date | Change |
|---|---|---|
| 1.3 | 2026-09-14 | Telemetry ownership; audit isolation; threshold; payload sync |
