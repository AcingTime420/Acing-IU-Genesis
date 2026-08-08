# Deployment guide — Genesis Foundation v1.0

## Prerequisites

- Docker Engine 24+ / Docker Desktop  
- 4 GB RAM available to Docker  
- Ports free: **8080** (gateway), optional direct 5432/6379 not published in default compose  

## Steps

```bash
git clone <repo> && cd Acing-IU
cp infrastructure/.env.example infrastructure/.env
# set JWT_SIGNING_KEY, POSTGRES_PASSWORD, REDIS_PASSWORD

cd infrastructure
docker compose up -d --build
docker compose ps
curl -s http://localhost:8080/health/live
./scripts/smoke-auth.sh
```

## Windows installer path

1. Build setup via Inno or NSIS (see `installer/README.md`)  
2. Install → Control Center → Start Platform Stack  
3. Token script seeds local JWT if placeholder present  

## Rollback

```bash
docker compose down
# optional data wipe:
docker compose down -v
```

Redeploy previous image tags when registry is introduced (post-Genesis).

## Production checklist

- [ ] Secrets from vault, not `.env` file on disk world-readable  
- [ ] TLS terminator in front of Nginx (not in Genesis compose)  
- [ ] Backups for Postgres volume  
- [ ] Log shipping for JSON container logs  
- [ ] Trivy Critical/High = 0 on release images  
