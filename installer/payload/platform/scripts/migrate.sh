#!/bin/sh
# Versioned migration runner for non-empty databases.
# Bootstrap of empty volumes still uses docker-entrypoint-initdb.d (000-003).
# This script applies any files in /migrations whose version is not in schema_migrations.
#
# Usage (compose db-migrate service):
#   migrate.sh
set -eu

HOST="${PGHOST:-postgres}"
PORT="${PGPORT:-5432}"
USER="${MIGRATOR_DB_USER:-acing_migrator}"
DB="${POSTGRES_DB:?POSTGRES_DB must be set}"
export PGPASSWORD="${MIGRATOR_DB_PASSWORD:?MIGRATOR_DB_PASSWORD must be set}"

MIGDIR="${MIGRATIONS_DIR:-/migrations}"

echo "Waiting for Postgres at ${HOST}:${PORT}..."
until pg_isready -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" >/dev/null 2>&1; do
  sleep 1
done

apply() {
  version="$1"
  file="$2"
  exists=$(psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -Atc \
    "SELECT 1 FROM schema_migrations WHERE version = '${version}'" || echo "")
  if [ "$exists" = "1" ]; then
    echo "skip $version ($file)"
    return 0
  fi
  echo "apply $version ($file)"
  psql -v ON_ERROR_STOP=1 -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -f "$file"
}

# Apply in lexical order; filenames must start with NNN_
for f in $(ls "$MIGDIR"/*.sql 2>/dev/null | sort); do
  base=$(basename "$f")
  version=$(echo "$base" | sed -n 's/^\([0-9][0-9]*\).*/\1/p')
  if [ -z "$version" ]; then
    echo "skip unrecognized $base"
    continue
  fi
  apply "$version" "$f"
done

echo "Migrations complete."
psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -c "SELECT version, description, applied_at FROM schema_migrations ORDER BY version;"
