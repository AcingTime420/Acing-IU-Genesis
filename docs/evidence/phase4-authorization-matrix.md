# Authorization Matrix — Acing-IU-Genesis (Phase 4, Task 4.4)

**Status:** Reviewed baseline (policy + current enforcement gaps documented)  
**Version:** 1.0  
**Last updated:** 2026-09-13  
**Tracking:** [#58](https://github.com/AcingTime420/Acing-IU-Genesis/issues/58) · related [#61](https://github.com/AcingTime420/Acing-IU-Genesis/issues/61)  
**Related:** `docs/evidence/phase4-threat-model.md`, `backend/Identity/.../AuthController.cs`, `backend/DeviceTrust/.../TrustController.cs`

> Server-side authorization is **deny-by-default**. Missing authentication or missing ownership/tenant context must fail closed. This matrix is the Task 4.4 evidence artifact.

## 1. Zero Trust alignment

NIST Zero Trust (SP 800-207) principles mapped to Genesis controls:

| Principle | Meaning | Genesis boundary / control |
|---|---|---|
| **Never trust, always verify** | No implicit trust from network location | TB1–TB5; every sensitive API requires JWT `[Authorize]` except explicit anonymous auth routes |
| **Least privilege** | Minimum rights for the task | Roles `Admin`, `Operator`, `User`; list endpoints restricted to Admin/Operator |
| **Assume breach** | Limit blast radius | Object-level ownership on device resources; short-lived JWT; refresh rotation |
| **Verify explicitly** | Use identity + context | Claims: `sub` / NameIdentifier; roles from token; MFA gates (policy engine target) |
| **Inspect and log** | Audit security decisions | Trust telemetry writes audit events; auth failures should emit safe events |

Trust boundaries (from threat model): **TB1** browser↔gateway, **TB2** gateway↔services, **TB3** services↔DB, **TB4** CI↔repo, **TB5** device↔DeviceTrust, **TB6** vault emulator process.

## 2. Roles (RBAC)

| Role | Intended scope |
|---|---|
| **Anonymous** | Register, login, refresh, logout only |
| **User** | Own profile; own device telemetry submit; own device read (when ownership enforced) |
| **Operator** | User scope + list devices; operational device inventory |
| **Admin** | Operator scope + policy administration (target); full inventory |

Policy engine seed policies use `AllowedRoles = "Admin,Operator"` or `"Admin,Operator,User"` with optional `RequireMfa` (see `AcingPolicyEngine`).

## 3. Endpoint matrix

Legend: **Allow** = authorized success path · **Deny** = must return 401/403 (or safe 404 for anti-enumeration) · **Anon** = intentionally public · **Gap** = policy requires deny/ownership but code path incomplete

### 3.1 Identity (`/api/auth`)

| Operation | Method | Anon | User | Operator | Admin | Enforcement today | Notes |
|---|---|---|---|---|---|---|---|
| Register | POST | Anon | — | — | — | `[AllowAnonymous]` | |
| Login | POST | Anon | — | — | — | `[AllowAnonymous]` + rate limit | Abuse case A1 |
| Refresh | POST | Anon | — | — | — | Cookie or body refresh token | |
| Logout | POST | Anon* | Allow | Allow | Allow | Revokes jti/refresh when present | *works unauthenticated to clear cookie |
| Me (profile) | GET | Deny | Allow (self) | Allow (self) | Allow (self) | `[Authorize]` + `sub` | Object = self only |
| MFA enroll | GET | Deny | Allow (self) | Allow (self) | Allow (self) | `[Authorize]` | |
| MFA verify | POST | Deny | Allow (self) | Allow (self) | Allow (self) | `[Authorize]` | |

### 3.2 DeviceTrust (`/api/trust`)

| Operation | Method | Anon | User | Operator | Admin | Enforcement today | Notes |
|---|---|---|---|---|---|---|---|
| Submit telemetry | POST | Deny | Allow (own hw) | Allow | Allow | `[Authorize]`; passes `owner` from `sub` into upsert | Ownership on write path |
| Get device by hwId | GET | Deny | Allow **only if owner** (policy) | Allow | Allow | `[Authorize]` only; **GetDevice does not filter by caller** | **Gap** vs #61 intent — any authenticated user who knows hwId can read score |
| List devices | GET | Deny | Deny | Allow | Allow | `[Authorize(Roles = "Admin,Operator")]` | Role gate present |

### 3.3 Audit (legacy surface)

| Operation | Method | Policy | Enforcement today |
|---|---|---|---|
| GET /api/audit | GET | Deny all unauthenticated; Admin/Operator only | **Gap** — root `AuditController` has no `[Authorize]` (issue #60 closed for durable path; verify production route uses hardened service only) |
| POST /api/audit | POST | Authenticated service/identity only | Same gap on legacy controller |

### 3.4 Policy engine (target)

| Decision inputs | Enforce |
|---|---|
| User role ∈ AllowedRoles | Deny if not |
| Trust score ≥ MinTrustScore | Deny if below |
| RequireMfa when set | Deny if MFA not satisfied |

Not wired as a global filter on all APIs yet — treat as **target** for high-assurance endpoints.

## 4. Object-level rules (ABAC-style)

| Resource | Attribute check | Deny behavior |
|---|---|---|
| User profile | `resource.userId == token.sub` | 401 invalid sub / 404 not found |
| Device record | `resource.ownerUserId == token.sub` **OR** role ∈ {Admin, Operator} | **403** without confirming existence preferred; or safe 404 |
| Device list | role ∈ {Admin, Operator} | 403 for User |
| Audit query | role ∈ {Admin, Operator} + tenant scope (target) | 401/403 |

## 5. Deny-path test expectations (Task 4.4 evidence)

| Test ID | Scenario | Expected |
|---|---|---|
| AUTHZ-01 | Unauthenticated GET `/api/trust/devices/{hwId}` | 401 |
| AUTHZ-02 | Unauthenticated POST `/api/trust/telemetry/submit` | 401 |
| AUTHZ-03 | User role GET `/api/trust/devices` (list) | 403 |
| AUTHZ-04 | User A GET device owned by User B | 403 or safe 404 |
| AUTHZ-05 | Operator GET list devices | 200 |
| AUTHZ-06 | Authenticated User GET `/api/auth/me` | 200 self only |
| AUTHZ-07 | Cross-user MFA enroll (forged sub) | 401/403 |

**Status:** #61 closed with remediation intent; **GetDevice ownership filter still absent in current `TrustController`** — AUTHZ-04 is the residual gap. Integration tests for AUTHZ-01–07 should be added or linked before claiming full 4.4 closure.

## 6. STRIDE linkage

| Abuse case | STRIDE | Matrix control |
|---|---|---|
| A2 JWT replay | Spoofing | Short TTL + revocation store (auth matrix) |
| A3 Cross-tenant device read | Elevation / Disclosure | AUTHZ-04 object rule |
| A4 Unauth audit | Tampering / Disclosure | Audit row + authorize |
| A9 Missing RBAC | Elevation | Role columns + AUTHZ-03 |

## 7. Residual gaps (honest)

1. **`GetDevice` lacks caller ownership check** — highest priority authz fix.  
2. **Legacy AuditController** unauthenticated — ensure only durable authenticated audit path is exposed in compose.  
3. **Automated deny-path suite** not yet committed as named integration tests.  
4. **Policy engine** not on the global request path for all services.

## 8. Review history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-13 | Initial matrix from live controllers + Zero Trust / STRIDE mapping |
