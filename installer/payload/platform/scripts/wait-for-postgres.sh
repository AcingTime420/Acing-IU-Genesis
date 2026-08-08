#!/bin/sh
# =============================================================================
# Acing IU — wait-for-postgres.sh
# Blocks until PostgreSQL accepts connections, then runs the remaining command.
# Usage:
#   wait-for-postgres.sh <host> <port> <user> <database> <cmd...>
# =============================================================================

set -e

HOST="${1:-postgres}"
PORT="${2:-5432}"
USER="${3:-acing}"
DB="${4:-acing_iu}"
shift 4 2>/dev/null || true

echo "[wait-for-postgres] Waiting for ${HOST}:${PORT} (db=${DB}, user=${USER})..."

MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if pg_isready -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" > /dev/null 2>&1; then
    echo "[wait-for-postgres] PostgreSQL is ready."
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  echo "[wait-for-postgres] Attempt ${ATTEMPT}/${MAX_ATTEMPTS} — not ready yet..."
  sleep 2
done

if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
  echo "[wait-for-postgres] ERROR: timed out waiting for PostgreSQL" >&2
  exit 1
fi

# Extra second for init scripts that may still be running
sleep 1

if [ "$#" -gt 0 ]; then
  echo "[wait-for-postgres] Executing: $*"
  exec "$@"
fi
