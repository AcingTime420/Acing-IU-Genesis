# Environment matrix

| Variable | Dev default | Staging | Production | Notes |
|----------|-------------|---------|------------|-------|
| `POSTGRES_USER` | acing | acing | managed | |
| `POSTGRES_PASSWORD` | *local only* | secret store | secret store | Never commit |
| `POSTGRES_DB` | acing_iu | acing_iu | acing_iu | |
| `REDIS_PASSWORD` | *local only* | secret store | secret store | |
| `JWT_ISSUER` | acing-iu | acing-iu | acing-iu | Must match all services |
| `JWT_AUDIENCE` | acing-iu-api | acing-iu-api | acing-iu-api | |
| `JWT_SIGNING_KEY` | ≥32 chars | ≥48 random | HSM/KMS-backed | Symmetric HS256 Genesis |
| `ASPNETCORE_ENVIRONMENT` | Development | Staging | Production | |

## Service binding (Compose)

| Service | Env key | Example |
|---------|---------|---------|
| identity | `ConnectionStrings__Default` | Host=postgres;... |
| identity | `Redis__Connection` | redis:6379,password=... |
| identity | `Jwt__SigningKey` | from JWT_SIGNING_KEY |
| device-trust | `ConnectionStrings__Default` | same DB |
| device-trust | `Jwt__*` | same issuer/audience/key |

## Secrets policy

1. `.env` is gitignored  
2. Only `.env.example` with placeholders in repo  
3. Installer `generate-token.ps1` may rewrite `CHANGE_ME_*` on first local install  
4. CI uses GitHub Secrets / OIDC — never plaintext in logs  
