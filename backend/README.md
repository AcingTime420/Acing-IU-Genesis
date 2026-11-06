# Acing IU — Backend

## Services

| Service | Port | Sprint | Description |
|---------|------|--------|-------------|
| **Identity** | 8080 | S2 | Register, login, refresh, logout, MFA TOTP, profile |
| **Device Trust** | 8081 | S3 | Telemetry submit, trust score, device registry |
| **SharedKernel** | — | — | Result monad, RFC 9457 problem details |
| **AI Gateway foundation** | — | Phase 8 | Provider-neutral advisory boundary and scoped delegated-action approval; no provider adapter or HTTP service |

## Identity API

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/auth/register` | Public | Argon2id, issues tokens + HttpOnly refresh cookie |
| POST | `/api/auth/login` | Public | Same |
| POST | `/api/auth/refresh` | Public | Body or `acing_refresh` cookie; rotation + reuse detection |
| POST | `/api/auth/logout` | Optional JWT | Blacklists access jti in Redis; burns refresh family |
| GET | `/api/auth/me` | Bearer | Profile |
| GET | `/api/auth/mfa/enroll` | Bearer | Returns Base32 secret + otpauth URI |
| POST | `/api/auth/mfa/verify` | Bearer | Enables MFA after valid TOTP |
| GET | `/health/live` · `/health/ready` | Public | |

## Device Trust API

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/trust/telemetry/submit` | Bearer | Compute + persist trust score |
| GET | `/api/trust/devices/{hwId}` | Bearer | Lookup |
| GET | `/api/trust/devices` | Admin/Operator | List |
| GET | `/health/live` · `/health/ready` | Public | |

### Trust score weights (Master Plan)

| Signal | Points |
|--------|--------|
| SELinux Enforcing | +40 |
| Locked bootloader | +30 |
| Unmodified partitions | +20 |
| Knox fuse intact | +10 |
| Rooted | score forced to 0 |

Threshold default: **80** (from `policy_configurations`).

## Run full stack

```bash
cd infrastructure
cp .env.example .env   # JWT_SIGNING_KEY ≥ 32 chars
docker compose up -d --build
./scripts/smoke-auth.sh
```

## Solution layout

```
backend/
├── AcingIU.sln
├── AiGateway/src/AcingIU.AiGateway/
├── SharedKernel/src/AcingIU.SharedKernel/
├── Identity/src/AcingIU.Identity.Api/
└── DeviceTrust/src/AcingIU.DeviceTrust.Api/
```

## Governed AI boundary

`AcingIU.AiGateway` implements the provider-neutral foundation required by
ADR-007. It denies disabled providers, unlisted use cases, excessive output
limits, and data above each provider policy's permitted classification before an
adapter is invoked. Provider output is advisory only.

Consequential execution uses a separate `DelegatedActionCoordinator`. An
approval must be granted, unexpired, and match the exact proposal, action, and
resource, including the action-payload digest. Approval evidence is opaque and
must be validated by a trusted verifier; callers cannot authorize execution by
constructing a granted data object. The action committer contract requires the mutation and its success
audit to commit atomically and requires idempotency by proposal identifier.
Audit events intentionally exclude prompts, outputs, raw action
arguments, credentials, and exception messages.

No OpenAI or xAI adapter, API endpoint, provider credential, persistence layer,
or production provider call is part of this foundation.
