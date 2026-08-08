#!/bin/sh
# =============================================================================
# Acing IU — wait-for-redis.sh
# Blocks until Redis answers PING, then runs the remaining command.
# Usage:
#   wait-for-redis.sh <host> <port> <password> <cmd...>
# =============================================================================

set -e

HOST="${1:-redis}"
PORT="${2:-6379}"
PASSWORD="${3:-}"
shift 3 2>/dev/null || true

echo "[wait-for-redis] Waiting for ${HOST}:${PORT}..."

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if [ -n "$PASSWORD" ]; then
    RESULT=$(redis-cli -h "$HOST" -p "$PORT" -a "$PASSWORD" ping 2>/dev/null || true)
  else
    RESULT=$(redis-cli -h "$HOST" -p "$PORT" ping 2>/dev/null || true)
  fi

  if [ "$RESULT" = "PONG" ]; then
    echo "[wait-for-redis] Redis is ready."
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  echo "[wait-for-redis] Attempt ${ATTEMPT}/${MAX_ATTEMPTS} — not ready yet..."
  sleep 2
done

if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
  echo "[wait-for-redis] ERROR: timed out waiting for Redis" >&2
  exit 1
fi

if [ "$#" -gt 0 ]; then
  echo "[wait-for-redis] Executing: $*"
  exec "$@"
fi
