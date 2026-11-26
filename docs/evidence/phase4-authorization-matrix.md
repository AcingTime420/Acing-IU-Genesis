# Authorization Matrix — Acing-IU-Genesis (Phase 4, Task 4.4)

**Status:** Partial — AUTHZ-04 + atomic telemetry ownership  
**Version:** 1.4  
**Last updated:** 2026-09-14  
**Tracking:** PR #107

## Enrollment policy (security decision)

`POST /api/trust/telemetry/submit` **does not register** devices.

| Situation | Behavior |
|---|---|
| Unknown hwId | **404** — fail closed; no first-writer ownership |
| Cross-owner update | **404** |
| Owner / Admin / Operator on enrolled device | **200** after atomic UPDATE |

**Authorized enrollment** (assign `owner_user_id` for a new hwId) is a **separate future workflow** and is out of scope for this PR. Until that API exists, devices must be provisioned by controlled ops/DB paths only.

This intentionally avoids registration enumeration and TOCTOU races on concurrent first-insert.

## Atomic telemetry mutation

Ownership is enforced in the same PostgreSQL `UPDATE ... WHERE hw_identifier = @hw AND (privileged OR owner_user_id = @caller)` statement. Success path commits mutation and `trust.telemetry.submit` audit in **one transaction**; audit failure rolls back the mutation.

## Denial audit attribution

| Path | Event type | resource_accessed |
|---|---|---|
| GET device denied | `trust.device.access_denied` | `/api/trust/devices` |
| POST telemetry denied | `trust.telemetry.access_denied` | `/api/trust/telemetry/submit` |

Denial audits are best-effort (must not change 404). Success audits are mandatory.

## Installer payload

Full recursive runtime tree sync via `scripts/check-devicetrust-payload-sync.sh` (excludes only Dockerfile / .dockerignore).

## Review history

| Version | Date | Change |
|---|---|---|
| 1.4 | 2026-09-14 | Atomic UPDATE; fail-closed enrollment; txn success audit |
