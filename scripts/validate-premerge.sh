#!/usr/bin/env bash
# Acing IU Genesis — pre-merge validation (fail-closed)
# Status: Implementation baseline: Pending local validation
# This script does not claim success unless every step exits 0 on your machine.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
COMPOSE_DIR="$ROOT/infrastructure"
ENV_FILE="$COMPOSE_DIR/.env"
CLEANED_UP=0

cleanup() {
  if [ "$CLEANED_UP" -eq 1 ]; then return 0; fi
  CLEANED_UP=1
  if [ -d "$COMPOSE_DIR" ] && [ -f "$ENV_FILE" ]; then
    echo
    echo "=== Cleanup (preserving named volumes) ==="
    ( cd "$COMPOSE_DIR" && docker compose down --remove-orphans ) || true
  fi
}
trap cleanup EXIT

die() { echo "FAIL: $*" >&2; exit 1; }

step() { echo; echo "=== $* ==="; }

# --- Load infrastructure/.env into this shell (do not print values) -----------
load_env_file() {
  local file="$1"
  [ -f "$file" ] || die "Missing $file — copy infrastructure/.env.example and set secrets"

  local -A seen=()
  local required=(
    POSTGRES_USER
    POSTGRES_DB
    POSTGRES_PASSWORD
    IDENTITY_DB_PASSWORD
    DEVICE_TRUST_DB_PASSWORD
    JWT_SIGNING_KEY
    REDIS_PASSWORD
  )

  while IFS= read -r line || [ -n "$line" ]; do
    # trim CR
    line="${line%$'\r'}"
    # blank or comment
    [[ -z "${line//[[:space:]]/}" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue

    if [[ "$line" != *"="* ]]; then
      die "Invalid .env line (no =): ${line:0:40}..."
    fi
    local key="${line%%=*}"
    local val="${line#*=}"
    # trim key whitespace
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"

    if [[ -z "$key" ]]; then
      die "Invalid .env entry with empty key"
    fi
    if [[ -n "${seen[$key]:-}" ]]; then
      die "Duplicate required/env key in .env: $key"
    fi
    seen[$key]=1
    # export without echoing value
    export "$key=$val"
  done < "$file"

  local k
  for k in "${required[@]}"; do
    if [[ -z "${!k+x}" ]]; then
      die "Required variable missing from .env: $k"
    fi
    if [[ -z "${!k}" ]]; then
      die "Required variable is blank in .env: $k"
    fi
  done
  echo "Loaded required variables from infrastructure/.env (values not shown)"
}

wait_for_postgres() {
  local tries=30
  local i
  for i in $(seq 1 "$tries"); do
    if ( cd "$COMPOSE_DIR" && docker compose exec -T postgres \
      pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" ) >/dev/null 2>&1; then
      echo "PostgreSQL is ready"
      return 0
    fi
    sleep 2
  done
  die "PostgreSQL did not become ready within $((tries * 2))s"
}

step "0. Load environment"
load_env_file "$ENV_FILE"

step "1. Tool versions"
dotnet --version
docker --version
docker compose version

step "2-4. Restore, build, test"
dotnet restore backend/AcingIU.sln
dotnet build backend/AcingIU.sln -c Release --no-restore
if ! find tests -name '*.csproj' -print -quit | grep -q .; then
  die "No test projects under tests/"
fi
dotnet test backend/AcingIU.sln -c Release --no-build --verbosity normal

step "5. OpenAPI lint"
SPECS=""
for p in docs/irp/03-openapi/*.yaml irp/03-openapi/*.yaml; do
  [ -f "$p" ] && SPECS="$SPECS $p"
done
[ -n "$SPECS" ] || die "No OpenAPI specs found"
for s in $SPECS; do
  npx --yes @redocly/cli@1.25.15 lint "$s"
done

step "6. Compose config"
( cd "$COMPOSE_DIR" && docker compose config -q )

step "7. PostgreSQL up + readiness"
( cd "$COMPOSE_DIR" && docker compose up -d postgres )
wait_for_postgres

step "8. Migrations (fail-closed)"
( cd "$COMPOSE_DIR" && docker compose run --rm db-migrate )

step "9. Constraint tests"
( cd "$COMPOSE_DIR" && docker compose exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 ) \
  < tests/database/constraint_tests.sql

step "10. Privilege probes"
set +e
( cd "$COMPOSE_DIR" && docker compose exec -T -e PGPASSWORD="$IDENTITY_DB_PASSWORD" postgres \
  psql -U acing_identity -d "$POSTGRES_DB" -c "UPDATE security_audit_logs SET actor='x'" ) >/dev/null 2>&1
rc=$?
set -e
[ "$rc" -ne 0 ] || die "acing_identity was allowed to UPDATE security_audit_logs"

set +e
( cd "$COMPOSE_DIR" && docker compose exec -T -e PGPASSWORD="$DEVICE_TRUST_DB_PASSWORD" postgres \
  psql -U acing_device_trust -d "$POSTGRES_DB" -c "DELETE FROM security_audit_logs" ) >/dev/null 2>&1
rc=$?
set -e
[ "$rc" -ne 0 ] || die "acing_device_trust was allowed to DELETE security_audit_logs"
echo "PASS: runtime roles cannot mutate audit"

step "11. Full stack + smoke"
( cd "$COMPOSE_DIR" && docker compose up -d --build )
wait_for_postgres
# brief settle for APIs
sleep 10
( cd "$COMPOSE_DIR" && ./scripts/smoke-auth.sh )

step "12. Trivy optional"
if command -v trivy >/dev/null 2>&1; then
  docker build -t acing-identity:local backend/Identity/src/AcingIU.Identity.Api
  trivy image --severity CRITICAL,HIGH --exit-code 1 acing-identity:local
else
  echo "Trivy not installed — skip (CI container workflow covers this)"
fi

echo
echo "=== SUMMARY: ALL EXECUTED STEPS PASSED ON THIS MACHINE ==="
# successful path still cleans containers via trap; volumes preserved
exit 0
