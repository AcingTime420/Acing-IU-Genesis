#!/bin/bash
# Runs once on empty data volume after 000-002 SQL.
# Sets login passwords and CONNECT grants for least-privilege roles.
set -euo pipefail

: "${POSTGRES_USER:?}"
: "${POSTGRES_DB:?}"
: "${MIGRATOR_DB_PASSWORD:?MIGRATOR_DB_PASSWORD must be set}"
: "${IDENTITY_DB_PASSWORD:?IDENTITY_DB_PASSWORD must be set}"
: "${DEVICE_TRUST_DB_PASSWORD:?DEVICE_TRUST_DB_PASSWORD must be set}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
ALTER ROLE acing_migrator WITH LOGIN PASSWORD '${MIGRATOR_DB_PASSWORD}';
ALTER ROLE acing_identity WITH LOGIN PASSWORD '${IDENTITY_DB_PASSWORD}';
ALTER ROLE acing_device_trust WITH LOGIN PASSWORD '${DEVICE_TRUST_DB_PASSWORD}';

GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO acing_migrator, acing_identity, acing_device_trust;
EOSQL

echo "Role passwords and CONNECT grants applied."
