#!/bin/sh
# Convenience wrapper — run from infrastructure/ or repo root
set -e
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
INFRA_DIR=$(dirname "$SCRIPT_DIR")

cd "$INFRA_DIR"

if [ ! -f .env ]; then
  echo "No .env found — copying .env.example"
  cp .env.example .env
  echo "Edit .env and set real passwords / JWT_SIGNING_KEY before production use."
fi

docker compose up -d --build "$@"
echo ""
echo "Stack starting. Check status with:"
echo "  docker compose -f $INFRA_DIR/docker-compose.yml ps"
echo "  curl -s http://localhost:8080/health/live"
