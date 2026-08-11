# Infrastructure (reference)

**Source of truth for runnable files:** `artifacts/infrastructure/` (or repo `infrastructure/`).

| Component | Spec |
|-----------|------|
| Compose | postgres, redis, gateway, identity, device-trust, db-migrate |
| Nginx | `nginx/conf.d/acing-gateway.conf` routes `/api/auth`, `/api/trust` |
| Postgres init | mirrors IRP `02-database/migrations` |
| Redis | AOF + password from env |
| Scripts | `up.sh`, `smoke-auth.sh`, wait-for-* |

Health model:

- `GET /health/live` — process up  
- `GET /health/ready` — dependencies reachable  
- Compose `depends_on: condition: service_healthy` for postgres/redis  

IRP does not duplicate full YAML; keep a single compose file in infrastructure to avoid drift.
