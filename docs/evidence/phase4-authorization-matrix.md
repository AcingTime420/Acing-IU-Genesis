# Authorization Matrix — Acing-IU-Genesis (Phase 4, Task 4.4)

**Status:** Partial — AUTHZ-04 remediated with automated tests; other deny-path IDs still open  
**Version:** 1.1  
**Last updated:** 2026-09-14  
**Tracking:** [#58](https://github.com/AcingTime420/Acing-IU-Genesis/issues/58) · related [#61](https://github.com/AcingTime420/Acing-IU-Genesis/issues/61)  
**Related:** `docs/evidence/phase4-threat-model.md`, `TrustController`, `TrustService`, `tests/DeviceTrust.UnitTests/DeviceOwnershipAuthorizationTests.cs`

> Server-side authorization is **deny-by-default**. Missing authentication or missing ownership/tenant context must fail closed.

## 1. Zero Trust alignment

| Principle | Genesis control |
|---|---|
| Never trust, always verify | JWT `[Authorize]`; object-level ownership on device read |
| Least privilege | Roles `Admin`, `Operator`, `User` |
| Assume breach | Short-lived JWT; ownership check in service layer |
| Verify explicitly | Caller identity from validated `sub` / NameIdentifier only |
| Inspect and log | `trust.device.access_denied` audit without hwId/tokens |

## 2. Roles (RBAC)

| Role | Scope |
|---|---|
| **Anonymous** | Auth register/login/refresh only |
| **User** | Own profile; own device telemetry; **own device read only** |
| **Operator** | User scope + list devices + read any device by hwId |
| **Admin** | Operator scope + policy administration (target) |

## 3. DeviceTrust GetDevice decision table (AUTHZ-04)

**Non-disclosure convention:** unauthorized cross-owner access and unknown devices both return **HTTP 404** with body detail `Device not registered.` (anti-enumeration). Missing/malformed subject returns **HTTP 401**.

| Caller | Subject claim | Role | Device state | HTTP | Outcome |
|---|---|---|---|---|---|
| None / unauthenticated | — | — | any | **401** | Framework `[Authorize]` |
| Authenticated | missing or non-GUID | any | any | **401** | Fail closed |
| User A | valid A | User | owned by A | **200** | Allowed |
| User A | valid A | User | owned by B | **404** | Denied (same as unknown) |
| User A | valid A | User | unknown hwId | **404** | Not found |
| User A | valid A | User | row exists, `owner_user_id` null | **404** | Denied |
| Admin | valid | Admin | owned by B | **200** | Privileged |
| Operator | valid | Operator | owned by B | **200** | Privileged |

Identity is **never** taken from the request body or query; only from validated JWT claims.

## 4. Endpoint matrix (DeviceTrust excerpt)

| Operation | Anon | User | Operator | Admin | Enforcement |
|---|---|---|---|---|---|
| Submit telemetry | Deny | Allow (owner from `sub`) | Allow | Allow | `[Authorize]` + fail-closed subject |
| Get device by hwId | Deny | **Owner only** | Allow | Allow | `GetDeviceForCallerAsync` + 404 anti-enum |
| List devices | Deny | Deny | Allow | Allow | `[Authorize(Roles = "Admin,Operator")]` |

## 5. Deny-path test expectations

| Test ID | Scenario | Expected | Evidence |
|---|---|---|---|
| AUTHZ-01 | Unauthenticated GET device | 401 | Framework `[Authorize]`; controller without valid principal → 401 in unit tests |
| AUTHZ-02 | Unauthenticated POST telemetry | 401 | Not expanded in this change |
| AUTHZ-03 | User GET list devices | 403 | Not expanded in this change |
| **AUTHZ-04** | User A GET device owned by B | **404** | **`DeviceOwnershipAuthorizationTests` — Passed** |
| AUTHZ-05 | Operator list devices | 200 | Not expanded in this change |
| AUTHZ-06 | User GET `/api/auth/me` | 200 self | Not expanded |
| AUTHZ-07 | Cross-user MFA | 401/403 | Not expanded |

Additional verified cases in `DeviceOwnershipAuthorizationTests`: owner 200; unknown 404; null owner denied; admin/operator privileged; malformed subject 401; repository row alone does not grant access.

**Local test run (2026-09-14):** `dotnet test tests/DeviceTrust.UnitTests -c Release` → **Passed: 20, Failed: 0** (includes prior TrustScoreEngine tests).

## 6. Residual gaps

1. AUTHZ-02, 03, 05–07 still lack dedicated automated evidence in this branch.  
2. Legacy AuditController authorize gap unchanged.  
3. Upsert ON CONFLICT still does not refresh `owner_user_id` on re-telemetry (pre-existing).  
4. Full HTTP pipeline unauthenticated probe not run in CI for this PR (unit-level controller + service coverage only).

## 7. Review history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-13 | Initial matrix |
| 1.1 | 2026-09-14 | AUTHZ-04 implemented + unit tests recorded |
