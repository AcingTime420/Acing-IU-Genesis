# Authorization Matrix — Acing-IU-Genesis (Phase 4, Task 4.4)

**Status:** Partial — AUTHZ-04 remediated with unit + WebApplicationFactory tests  
**Version:** 1.2  
**Last updated:** 2026-09-14  
**Tracking:** [#58](https://github.com/AcingTime420/Acing-IU-Genesis/issues/58) · PR #107  
**Related:** `TrustController`, `TrustService`, `DeviceOwnershipAuthorizationTests`, `DeviceTrustAuthzIntegrationTests`

> Server-side authorization is **deny-by-default**.

## Hardware identifier lookup contract

`DeviceRepository.GetByHwIdAsync` and the test fake use **exact ordinal** equality on `hw_identifier` (`WHERE hw_identifier = @hw` / `StringComparison.Ordinal`).  
**No normalization** (no trim, lowercasing, or canonicalization) is applied. Callers must supply the same string that was stored at registration/telemetry time. Introducing normalization would be a data-contract change and is **out of scope** for AUTHZ-04.

## DeviceTrust GetDevice decision table (AUTHZ-04)

**Non-disclosure:** cross-owner and unknown → **HTTP 404** `Device not registered.`  
Missing/malformed subject → **HTTP 401**.

| Caller | Subject | Role | Device | HTTP | Evidence |
|---|---|---|---|---|---|
| Unauthenticated | — | — | any | **401** | Integration: middleware |
| Authenticated | missing / non-GUID | any | any | **401** | Integration + controller |
| User A | valid A | User | owned by A | **200** | Integration |
| User A | valid A | User | owned by B | **404** | Integration |
| User A | valid A | User | unknown | **404** (same body) | Integration |
| User | valid | User | list `/devices` | **403** | Integration |
| Admin | valid | Admin | owned by other | **200** | Integration |
| Operator | valid | Operator | owned by other | **200** | Integration |

## SubmitTelemetry subject fail-closed (retained)

**Choice:** retain fail-closed subject on `POST /api/trust/telemetry/submit` (option A).

| Prior behavior | New behavior | Compatibility |
|---|---|---|
| `[Authorize]` only; missing/unparseable `sub` passed `ownerUserId = null` into upsert | Explicit **401** `Invalid token subject.` if `sub` missing or non-GUID | Breaking for tokens that authenticate but lack a GUID `sub` — such tokens already could not establish ownership; null-owner rows are denied on read |

Evidence: controller unit tests + integration `SubmitTelemetry_without_token_returns_401` / `SubmitTelemetry_with_valid_subject_returns_200`.

## Deny-path test IDs

| ID | Scenario | Status |
|---|---|---|
| AUTHZ-01 | Unauthenticated GET device | **Met** (WebApplicationFactory) |
| AUTHZ-04 | Cross-owner GET | **Met** |
| AUTHZ-03 | User list devices | **Met** (403) |
| AUTHZ-02 | Unauthenticated POST telemetry | **Met** |
| AUTHZ-05–07 | Other surfaces | Still open outside DeviceTrust GetDevice |

## Residual gaps

1. Legacy AuditController authorize gap unchanged.  
2. Upsert ON CONFLICT still does not refresh `owner_user_id` (pre-existing).  
3. Full PostgreSQL-backed integration not required for AUTHZ-04 unit/factory suite.

## Review history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-13 | Initial matrix |
| 1.1 | 2026-09-14 | AUTHZ-04 service implementation |
| 1.2 | 2026-09-14 | Fake repo exact match; WebApplicationFactory; SubmitTelemetry docs |
