#!/bin/sh
set -eu

ACTION=${1:?action required}
OWNER_ID=${2:?owner id required}
HW_1=${3:?first hardware id required}
HW_2=${4:?second hardware id required}
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
PLATFORM_DIR=$(dirname "$SCRIPT_DIR")

COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME:-}
case "$COMPOSE_PROJECT_NAME" in
  acing-iu-smoke-test-*) PROJECT_SUFFIX=${COMPOSE_PROJECT_NAME#acing-iu-smoke-test-} ;;
  *)
    echo "Refusing fixture provisioning outside the isolated smoke-test stack." >&2
    exit 1
    ;;
esac
case "$PROJECT_SUFFIX" in ''|*[!a-zA-Z0-9]*)
  echo "Refusing fixture provisioning outside the isolated smoke-test stack." >&2
  exit 1
  ;;
esac

if [ "${SMOKE_TEST_MODE:-}" != "1" ] ||
   [ "${POSTGRES_DB:-}" != "acing_iu_smoke_test" ] ||
   [ "${POSTGRES_VOLUME_NAME:-}" != "${COMPOSE_PROJECT_NAME}-postgres" ] ||
   [ "${REDIS_VOLUME_NAME:-}" != "${COMPOSE_PROJECT_NAME}-redis" ]; then
  echo "Refusing fixture provisioning outside the isolated smoke-test stack." >&2
  exit 1
fi

case "$ACTION" in
  create)
    SQL="INSERT INTO registered_devices (hw_identifier, soc_model, trust_score, selinux_status, owner_user_id) VALUES (:'hw1', 'SM-S938U', 0, 'Unknown', :'owner'::uuid), (:'hw2', 'SM-S938U', 0, 'Unknown', :'owner'::uuid)"
    ;;
  cleanup)
    SQL="DELETE FROM registered_devices WHERE owner_user_id = :'owner'::uuid AND hw_identifier IN (:'hw1', :'hw2')"
    ;;
  *)
    echo "Action must be create or cleanup." >&2
    exit 2
    ;;
esac

docker compose -p "$COMPOSE_PROJECT_NAME" \
  --project-directory "$PLATFORM_DIR" \
  -f "$PLATFORM_DIR/docker-compose.yml" \
  exec -T \
  -e SMOKE_OWNER_ID="$OWNER_ID" \
  -e SMOKE_HW_1="$HW_1" \
  -e SMOKE_HW_2="$HW_2" \
  -e SMOKE_SQL="$SQL" \
  postgres sh -ec '
    test "$POSTGRES_DB" = "acing_iu_smoke_test"
    test "$SMOKE_PROJECT_NAME" = "$COMPOSE_PROJECT_NAME"
    printf "%s\n" "$SMOKE_SQL" | psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
      -v owner="$SMOKE_OWNER_ID" -v hw1="$SMOKE_HW_1" -v hw2="$SMOKE_HW_2"
  '
