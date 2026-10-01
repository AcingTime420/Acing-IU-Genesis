#!/bin/sh
# Start the canonical local development stack.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
INFRA_DIR=$(dirname "$SCRIPT_DIR")
ENV_FILE="$INFRA_DIR/.env"
ENV_EXAMPLE="$INFRA_DIR/.env.example"

cd "$INFRA_DIR"

if [ ! -f "$ENV_EXAMPLE" ]; then
  echo "ERROR: missing $ENV_EXAMPLE"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "Created infrastructure/.env from infrastructure/.env.example."
  echo "Configure every placeholder value, then run this command again."
  exit 1
fi

if grep -Eq '^[A-Za-z_][A-Za-z0-9_]*=placeholder(_|$)' "$ENV_FILE"; then
  echo "ERROR: infrastructure/.env still contains placeholder values."
  echo "Replace placeholders with development-only secrets before starting the stack."
  exit 1
fi

docker compose --env-file "$ENV_FILE" -f "$INFRA_DIR/docker-compose.yml" config -q
docker compose --env-file "$ENV_FILE" -f "$INFRA_DIR/docker-compose.yml" up -d --build "$@"

echo ""
echo "Stack starting. Check status with:"
echo "  docker compose --env-file $ENV_FILE -f $INFRA_DIR/docker-compose.yml ps"
echo "  curl -fsS http://localhost:8080/health/live"
