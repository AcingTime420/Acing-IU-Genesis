# End-to-end tests

Primary E2E smoke for Genesis is the shell script:

```bash
infrastructure/scripts/smoke-auth.sh
```

Requires a disposable local Compose stack (`infrastructure/docker-compose.yml`).
This smoke registers a fresh user and provisions two test-only device rows
through the PostgreSQL admin connection. It refuses to seed unless all isolated
test markers are set and the target URL is loopback; telemetry itself never
enrolls unknown devices.

Start the isolated stack from `infrastructure/` with test-only credentials in
the environment (do not reuse normal deployment volumes):

```bash
SMOKE_TEST_MODE=1 \
POSTGRES_DB=acing_iu_smoke_test \
COMPOSE_PROJECT_NAME=acing-iu-smoke-test-local \
POSTGRES_VOLUME_NAME=acing-iu-smoke-test-local-postgres \
REDIS_VOLUME_NAME=acing-iu-smoke-test-local-redis \
POSTGRES_CONTAINER_NAME=acing-iu-smoke-test-local-postgres \
REDIS_CONTAINER_NAME=acing-iu-smoke-test-local-redis \
GATEWAY_CONTAINER_NAME=acing-iu-smoke-test-local-gateway \
IDENTITY_CONTAINER_NAME=acing-iu-smoke-test-local-identity \
DEVICE_TRUST_CONTAINER_NAME=acing-iu-smoke-test-local-device-trust \
MIGRATOR_CONTAINER_NAME=acing-iu-smoke-test-local-migrator \
POSTGRES_PORT=55432 GATEWAY_PORT=18080 \
docker compose up -d --build

SMOKE_TEST_MODE=1 \
POSTGRES_DB=acing_iu_smoke_test \
COMPOSE_PROJECT_NAME=acing-iu-smoke-test-local \
POSTGRES_VOLUME_NAME=acing-iu-smoke-test-local-postgres \
REDIS_VOLUME_NAME=acing-iu-smoke-test-local-redis \
POSTGRES_CONTAINER_NAME=acing-iu-smoke-test-local-postgres \
REDIS_CONTAINER_NAME=acing-iu-smoke-test-local-redis \
GATEWAY_CONTAINER_NAME=acing-iu-smoke-test-local-gateway \
IDENTITY_CONTAINER_NAME=acing-iu-smoke-test-local-identity \
DEVICE_TRUST_CONTAINER_NAME=acing-iu-smoke-test-local-device-trust \
MIGRATOR_CONTAINER_NAME=acing-iu-smoke-test-local-migrator \
BASE_URL=http://localhost:18080 \
./scripts/smoke-auth.sh

COMPOSE_PROJECT_NAME=acing-iu-smoke-test-local \
POSTGRES_VOLUME_NAME=acing-iu-smoke-test-local-postgres \
REDIS_VOLUME_NAME=acing-iu-smoke-test-local-redis \
docker compose -p acing-iu-smoke-test-local down -v
```
