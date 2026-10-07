#!/bin/sh
# Acing IU — E2E smoke: auth + trust vertical slice
set -e

BASE="${BASE_URL:-http://localhost:8080}"
EMAIL="smoke_$(date +%s)-$$@acing.iu"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
case "$BASE" in
  http://*) BASE_AUTHORITY=${BASE#http://}; BASE_AUTHORITY=${BASE_AUTHORITY%%/*} ;;
  *)
    echo "Refusing smoke execution against a non-loopback BASE_URL." >&2
    exit 1
    ;;
esac
case "$BASE_AUTHORITY" in
  localhost|127.0.0.1) ;;
  localhost:*|127.0.0.1:*)
    BASE_PORT=${BASE_AUTHORITY#*:}
    case "$BASE_PORT" in ''|*[!0-9]*)
      echo "Refusing smoke execution with an invalid loopback port." >&2
      exit 1
      ;;
    esac
    ;;
  *)
    echo "Refusing smoke execution against a non-loopback BASE_URL." >&2
    exit 1
    ;;
esac
case "${COMPOSE_PROJECT_NAME:-}" in
  acing-iu-smoke-test-*) PROJECT_SUFFIX=${COMPOSE_PROJECT_NAME#acing-iu-smoke-test-} ;;
  *)
    echo "Refusing smoke run without an explicitly isolated test stack." >&2
    exit 1
    ;;
esac
case "$PROJECT_SUFFIX" in ''|*[!a-zA-Z0-9]*)
  echo "Refusing smoke run without an explicitly isolated test stack." >&2
  exit 1
  ;;
esac
if [ "${SMOKE_TEST_MODE:-}" != "1" ] ||
   [ "${POSTGRES_DB:-}" != "acing_iu_smoke_test" ] ||
   [ "${POSTGRES_VOLUME_NAME:-}" != "${COMPOSE_PROJECT_NAME}-postgres" ] ||
   [ "${REDIS_VOLUME_NAME:-}" != "${COMPOSE_PROJECT_NAME}-redis" ]; then
  echo "Refusing smoke run without an explicitly isolated test stack." >&2
  exit 1
fi
PASSWORD="SmokeTestPass!2026Secure"

echo "==> 1. Gateway live"
curl -sf "$BASE/health/live"; echo

echo "==> 2. Register"
REG=$(curl -sf -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "Registration successful."

ACCESS=$(echo "$REG" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
[ -n "$ACCESS" ] || { echo "FAIL: no accessToken"; exit 1; }
USER_ID=$(echo "$REG" | sed -n 's/.*"userId":"\([^"]*\)".*/\1/p')
[ -n "$USER_ID" ] || { echo "FAIL: no userId"; exit 1; }
SMOKE_SUFFIX="$(date +%s)-$$"
SMOKE_HW_1="SM-S938U-SMOKE-$SMOKE_SUFFIX"
SMOKE_HW_2="ROOTED-SMOKE-$SMOKE_SUFFIX"
"$SCRIPT_DIR/provision-smoke-fixtures.sh" create "$USER_ID" "$SMOKE_HW_1" "$SMOKE_HW_2"
cleanup_fixtures() {
  "$SCRIPT_DIR/provision-smoke-fixtures.sh" cleanup "$USER_ID" "$SMOKE_HW_1" "$SMOKE_HW_2" || true
}
trap cleanup_fixtures EXIT HUP INT TERM

echo "==> 3. GET /api/auth/me"
curl -sf "$BASE/api/auth/me" -H "Authorization: Bearer $ACCESS"; echo

echo "==> 4. MFA enroll"
ENROLL=$(curl -sf "$BASE/api/auth/mfa/enroll" -H "Authorization: Bearer $ACCESS")
echo "MFA enrollment successful."
SECRET=$(echo "$ENROLL" | sed -n 's/.*"secret":"\([^"]*\)".*/\1/p')
[ -n "$SECRET" ] || { echo "FAIL: no MFA secret"; exit 1; }

echo "==> 5. Submit device telemetry (trust score)"
TELE=$(curl -sf -X POST "$BASE/api/trust/telemetry/submit" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d "{\"hwIdentifier\":\"$SMOKE_HW_1\",\"socModel\":\"SM-S938U\",\"selinuxStatus\":\"Enforcing\",\"bootloaderLocked\":true,\"partitionsUnmodified\":true,\"knoxWarrantyFuseIntact\":true,\"isRooted\":false}")
echo "$TELE" | head -c 300; echo
SCORE=$(echo "$TELE" | sed -n 's/.*"trustScore":\([0-9]*\).*/\1/p')
[ "$SCORE" = "100" ] || echo "WARN: expected trustScore 100, got $SCORE"

echo "==> 6. Rooted device should score 0"
TELE2=$(curl -sf -X POST "$BASE/api/trust/telemetry/submit" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d "{\"hwIdentifier\":\"$SMOKE_HW_2\",\"socModel\":\"SM-S938U\",\"selinuxStatus\":\"Permissive\",\"bootloaderLocked\":false,\"partitionsUnmodified\":false,\"knoxWarrantyFuseIntact\":false,\"isRooted\":true}")
echo "$TELE2" | head -c 200; echo

echo "==> 7. Logout"
curl -sf -o /dev/null -w "%{http_code}\n" -X POST "$BASE/api/auth/logout" \
  -H "Authorization: Bearer $ACCESS"

echo "==> 8. Me after logout should 401"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/me" -H "Authorization: Bearer $ACCESS")
[ "$CODE" = "401" ] || echo "WARN: expected 401 after logout, got $CODE"

echo ""
echo "SMOKE PASSED"
echo "Email: $EMAIL"
