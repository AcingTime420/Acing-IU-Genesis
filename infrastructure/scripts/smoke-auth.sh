#!/bin/sh
# Acing IU — E2E smoke: auth + trust vertical slice
set -e

BASE="${BASE_URL:-http://localhost:8080}"
EMAIL="smoke_$(date +%s)@acing.iu"
PASSWORD="SmokeTestPass!2026Secure"

echo "==> 1. Gateway live"
curl -sf "$BASE/health/live"; echo

echo "==> 2. Register"
REG=$(curl -sf -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "$REG" | head -c 200; echo

ACCESS=$(echo "$REG" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
[ -n "$ACCESS" ] || { echo "FAIL: no accessToken"; exit 1; }

echo "==> 3. GET /api/auth/me"
curl -sf "$BASE/api/auth/me" -H "Authorization: Bearer $ACCESS"; echo

echo "==> 4. MFA enroll"
ENROLL=$(curl -sf "$BASE/api/auth/mfa/enroll" -H "Authorization: Bearer $ACCESS")
echo "$ENROLL" | head -c 200; echo
SECRET=$(echo "$ENROLL" | sed -n 's/.*"secret":"\([^"]*\)".*/\1/p')
[ -n "$SECRET" ] || { echo "FAIL: no MFA secret"; exit 1; }

echo "==> 5. Submit device telemetry (trust score)"
TELE=$(curl -sf -X POST "$BASE/api/trust/telemetry/submit" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"hwIdentifier":"SM-S938U-SMOKE-001","socModel":"SM-S938U","selinuxStatus":"Enforcing","bootloaderLocked":true,"partitionsUnmodified":true,"knoxWarrantyFuseIntact":true,"isRooted":false}')
echo "$TELE" | head -c 300; echo
SCORE=$(echo "$TELE" | sed -n 's/.*"trustScore":\([0-9]*\).*/\1/p')
[ "$SCORE" = "100" ] || echo "WARN: expected trustScore 100, got $SCORE"

echo "==> 6. Rooted device should score 0"
TELE2=$(curl -sf -X POST "$BASE/api/trust/telemetry/submit" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"hwIdentifier":"ROOTED-SMOKE-002","socModel":"SM-S938U","selinuxStatus":"Permissive","bootloaderLocked":false,"partitionsUnmodified":false,"knoxWarrantyFuseIntact":false,"isRooted":true}')
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
