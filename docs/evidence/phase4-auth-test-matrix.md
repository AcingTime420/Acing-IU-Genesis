# Authentication & Session Test Matrix — Acing-IU-Genesis (Phase 4, Task 4.3)

**Status:** Partial — coverage map + gaps  
**Version:** 1.0  
**Last updated:** 2026-09-13  
**Tracking:** [#58](https://github.com/AcingTime420/Acing-IU-Genesis/issues/58)  
**Related:** `AuthController`, `TokenService`, `TokenRevocationStore`, `TotpMfaServiceTests`, rate-limit probe on #58

> Task 4.3 requires tests covering successful authentication, replay, expiry, revocation, lockout, recovery, and safe security events. This matrix records what exists vs what is still required.

## 1. Required scenarios

| ID | Scenario | Required result | Evidence today | Status |
|---|---|---|---|---|
| AUTH-01 | Successful login with valid credentials | 200 + access + refresh | Implementation exists; no dedicated integration test recorded | **Gap** |
| AUTH-02 | Successful register | 201 + tokens | Implementation exists | **Gap** |
| AUTH-03 | Failed login (bad password) | 401; no token leak | Implementation exists | **Gap** |
| AUTH-04 | Replay of revoked access token (jti) | 401 | `TokenRevocationStore` exists | **Gap** (store present; test missing) |
| AUTH-05 | Expired access token | 401 | JWT exp claim | **Gap** |
| AUTH-06 | Refresh with valid refresh token | 200 + rotated refresh | `Refresh` endpoint | **Gap** |
| AUTH-07 | Refresh with revoked/stolen refresh | 401; cookie cleared | Logout + refresh path | **Gap** |
| AUTH-08 | Logout invalidates session | Subsequent use of jti fails | `LogoutAsync` | **Gap** |
| AUTH-09 | Rate limit / lockout on login spray | HTTP 429 after window | Runtime probe: 429 on 11th/12th request (#58) | **Partial** |
| AUTH-10 | MFA enroll + verify happy path | 200 | `TotpMfaServiceTests`, `MfaSecretProtectorTests` | **Partial** (unit only) |
| AUTH-11 | MFA verify wrong code | Error status | Unit coverage partial | **Partial** |
| AUTH-12 | Recovery / re-auth after logout | Login works again | Manual expected | **Gap** |
| AUTH-13 | Safe security events (no secret in logs) | Audit/log redaction | Policy in secret register | **Policy only** |

## 2. Existing automated tests

| Test asset | What it covers |
|---|---|
| `tests/Identity.UnitTests/TotpMfaServiceTests.cs` | TOTP generation/validation unit behavior |
| `tests/Identity.UnitTests/MfaSecretProtectorTests.cs` | Encryption/decryption of MFA secrets |
| `tests/Identity.UnitTests/ResultTests.cs` | Shared Result type (not auth flows) |
| Rate-limit probe (documented on #58) | Fixed-window 429 after 10 requests/minute on auth routes |
| `infrastructure/scripts/smoke-auth.sh` | E2E smoke referenced in `tests/e2e/README.md` — run evidence not yet archived in `docs/evidence` |

## 3. Minimum exit bar for Task 4.3

Mark 4.3 **Met** only when:

1. AUTH-01, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-08, AUTH-09 have automated or archived probe evidence linked here.  
2. AUTH-10 remains green in CI.  
3. No test logs print JWT signing keys, passwords, or MFA secrets (AUTH-13).

Until then status remains **Partial**.

## 4. Suggested next implementation order

1. Integration tests against Identity API (TestServer or compose) for AUTH-01–08.  
2. Archive smoke-auth run output under `docs/evidence/`.  
3. Extend rate-limit probe to assert lockout does not permanently ban after window reset (recovery).

## 5. Review history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-13 | Initial matrix from controllers, unit tests, and #58 rate-limit probe |
