# Acing IU — Infrastructure (S1 + S2 Identity)

Platform foundation stack: **PostgreSQL 16**, **Redis 7**, **Nginx API Gateway**, and the **Identity API**.

## Quick start

```bash
cd infrastructure
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SIGNING_KEY (≥ 32 chars)

docker compose up -d --build
docker compose ps
docker compose logs -f identity gateway

# End-to-end vertical slice
./scripts/smoke-auth.sh
```

### Verify

```bash
# Gateway live
curl -s http://localhost:8080/health/live

# Register → profile (or use smoke-auth.sh)
curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@acing.iu","password":"DevPassword!2026Secure"}'

# Trust / Firmware still return 503 (services not deployed)
curl -s http://localhost:8080/api/trust/telemetry/submit
curl -s http://localhost:8080/api/firmware/search
```

## Layout

```
infrastructure/
├── docker-compose.yml
├── .env.example
├── README.md
├── nginx/
│   ├── nginx.conf
│   └── conf.d/acing-gateway.conf
├── redis/redis.conf
├── postgres/init/
│   ├── 000_security_core.sql
│   └── 001_init_identity_schema.sql
└── scripts/
    ├── wait-for-postgres.sh
    ├── wait-for-redis.sh
    ├── up.sh
    └── smoke-auth.sh
```

Identity service source: `../backend/Identity/src/AcingIU.Identity.Api`

## Task mapping (Master Implementation Plan)

| Task | Status | Location |
|------|--------|----------|
| 1.1 Docker Compose stack | Done | `docker-compose.yml` |
| 1.2 Postgres health / init | Done | `postgres/init/*` |
| 1.3 Redis JWT revocation cache | Done | `redis/redis.conf` + Identity store |
| 1.4 Gateway reverse proxy | Done | `nginx/` |
| 1.5 Structured JSON logs | Done | Nginx + Identity JSON console |
| 2.1 Register / Login | Done | Identity AuthController |
| 2.2 Refresh token rotation | Done | Family rotation + reuse detection |
| 2.4 Protected route | Done | `GET /api/auth/me` |

## Redis key conventions (JWT revocation)

| Purpose | Key pattern | TTL |
|---------|-------------|-----|
| Revoked access token (jti) | `revoked:access:{jti}` | remaining token lifetime |
| Revoked refresh family | `revoked:family:{familyId}` | family lifetime |

## Observability

- Containers log to stdout/stderr (Docker `json-file`, size-capped).
- Nginx emits structured JSON access logs (FluentBit → Loki ready).
- Proxied requests carry `X-Request-Id` / `X-Correlation-Id`.
- Identity writes structured audit rows to `security_audit_logs`.

## Tear down

```bash
docker compose down        # keep volumes
docker compose down -v     # wipe postgres + redis data
```
