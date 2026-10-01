#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok(){ echo -e "${GREEN}    ✓ $*${NC}"; }
skip(){ echo -e "${YELLOW}    ~ SKIP: $*${NC}"; }
fail(){ echo -e "${RED}    ✗ FAIL: $*${NC}"; FAILURES=$((FAILURES+1)); }
step(){ echo ""; echo "=== $* ==="; }

FAILURES=0
SKIP_BUILD=false
SKIP_COMPOSE=false
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    --skip-compose) SKIP_COMPOSE=true ;;
    *) echo "Usage: $0 [--skip-build] [--skip-compose]"; exit 2 ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA_DIR="$REPO_ROOT/infrastructure"
ENV_FILE="$INFRA_DIR/.env"
cd "$REPO_ROOT"

step "1/5 Repository integrity"
tracked=$(git ls-files | grep -E '(^|/)(bin|obj|out|dist|TestResults|coverage|node_modules|\.next)(/|$)' || true)
if [[ -n "$tracked" ]]; then
  echo "$tracked"; fail "Generated artifacts are tracked."
else ok "No tracked generated artifact directories."; fi

step "2/5 Claim and container-reference integrity"
bash scripts/check-claim-surface.sh && ok "Claim-surface lint passed." || fail "Claim-surface lint failed."
bash scripts/validate-container-image-digests.sh && ok "Container image pinning passed." || fail "Container image pinning failed."

step "3/5 Guardian build"
if $SKIP_BUILD; then
  skip "Guardian build skipped."
elif command -v kotlinc >/dev/null 2>&1; then
  if [[ -f build.sh ]]; then bash build.sh && ok "Guardian build passed." || fail "Guardian build failed."
  else fail "build.sh is missing."; fi
else
  skip "kotlinc not installed; CI performs the Guardian build."
fi

step "4/5 Canonical Compose validation"
if $SKIP_COMPOSE; then
  skip "Compose skipped via --skip-compose."
elif ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  skip "Docker Compose is unavailable."
elif [[ ! -f "$ENV_FILE" ]]; then
  fail "Missing infrastructure/.env. Copy infrastructure/.env.example and replace all placeholders."
elif grep -Eq '^[A-Za-z_][A-Za-z0-9_]*=placeholder(_|$)' "$ENV_FILE"; then
  fail "infrastructure/.env still contains placeholder values."
else
  (
    cd "$INFRA_DIR"
    docker compose --env-file .env config -q
    docker compose --env-file .env build identity device-trust
  ) && ok "Canonical Compose config/build passed." || fail "Canonical Compose validation failed."
fi

step "5/5 HTTP readiness"
if $SKIP_COMPOSE; then
  skip "Runtime health checks skipped with Compose."
elif [[ "$FAILURES" -ne 0 ]]; then
  skip "Runtime health checks not attempted after an earlier failure."
elif command -v docker >/dev/null 2>&1 && [[ -f "$ENV_FILE" ]]; then
  (
    cd "$INFRA_DIR"
    docker compose --env-file .env up -d postgres redis identity device-trust gateway
    for i in {1..30}; do
      if curl -fsS http://127.0.0.1:8080/health/live >/dev/null 2>&1; then exit 0; fi
      sleep 2
    done
    exit 1
  ) && ok "Gateway health endpoint became ready." || fail "Gateway health endpoint did not become ready."
  (cd "$INFRA_DIR" && docker compose --env-file .env down --remove-orphans) || true
else
  skip "Runtime health checks unavailable."
fi

echo ""
if [[ "$FAILURES" -eq 0 ]]; then
  echo -e "${GREEN}All enabled checks PASSED.${NC}"; exit 0
fi
echo -e "${RED}$FAILURES check(s) FAILED.${NC}"; exit 1
