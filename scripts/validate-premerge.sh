#!/usr/bin/env bash
# =============================================================================
# scripts/validate-premerge.sh
#
# Clean-clone reproducibility baseline for Acing IU: Genesis.
# Run this script from the repository root after a fresh checkout to verify
# that the build toolchain, tests, and (optionally) containers work end-to-end.
#
# Exit codes:
#   0 – all enabled checks passed
#   1 – one or more checks failed
#
# Usage:
#   bash scripts/validate-premerge.sh [--skip-build] [--skip-compose]
# =============================================================================

set -euo pipefail

# ── Colour helpers ─────────────────────────────────────────────────────────
BLUE="\033[1;34m"
GREEN="\033[1;32m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
NC="\033[0m"

step()  { echo -e "\n${BLUE}==> $*${NC}"; }
ok()    { echo -e "${GREEN}    ✓ $*${NC}"; }
skip()  { echo -e "${YELLOW}    ~ SKIP: $*${NC}"; }
fail()  { echo -e "${RED}    ✗ FAIL: $*${NC}"; FAILURES=$((FAILURES + 1)); }

FAILURES=0
SKIP_BUILD=false
SKIP_COMPOSE=false

# ── Argument parsing ───────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --skip-build)   SKIP_BUILD=true   ;;
    --skip-compose) SKIP_COMPOSE=true ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [--skip-build] [--skip-compose]"
      exit 1
      ;;
  esac
done

# ── Locate repository root ────────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
step "Repository root: $REPO_ROOT"

# ── 1. No tracked generated artifacts ─────────────────────────────────────
step "1/5  Checking for tracked generated artifacts"

ARTIFACT_PATTERNS=(
  "bin"
  "obj"
  "out"
  "dist"
  "TestResults"
  "coverage"
  "node_modules"
  ".next"
)

ARTIFACT_FOUND=false
for pattern in "${ARTIFACT_PATTERNS[@]}"; do
  escaped="${pattern//./\\.}"
  matches=$(git ls-files | grep -E "(^|/)${escaped}(/|$)" || true)
  if [[ -n "$matches" ]]; then
    echo "    Tracked generated files under '${pattern}/':"
    echo "$matches" | sed 's/^/      /'
    ARTIFACT_FOUND=true
  fi
done

if $ARTIFACT_FOUND; then
  fail "Generated artifacts found in version control. Remove them and update .gitignore."
else
  ok "No tracked generated artifacts detected."
fi

# ── 2. .env baseline ───────────────────────────────────────────────────────
step "2/5  Environment file baseline"

if [[ -f ".env.example" ]]; then
  if [[ ! -f ".env" ]]; then
    cp .env.example .env
    ok "Created .env from .env.example"
  else
    ok ".env already present"
  fi
else
  skip ".env.example not found — skipping env setup"
fi

# ── 3. Build (Kotlin / Make) ───────────────────────────────────────────────
step "3/5  Build"

if $SKIP_BUILD; then
  skip "Build skipped via --skip-build"
elif [[ -f "system/security/guardian/build/Makefile" ]]; then
  if command -v kotlinc >/dev/null 2>&1; then
    (cd system/security/guardian/build && make) \
      && ok "Guardian platform built successfully" \
      || fail "Guardian platform build failed"
  else
    skip "kotlinc not found — skipping Kotlin compilation (install Kotlin to enable)"
  fi
elif [[ -f "build.sh" ]]; then
  if command -v kotlinc >/dev/null 2>&1; then
    bash build.sh \
      && ok "build.sh completed successfully" \
      || fail "build.sh failed"
  else
    skip "kotlinc not found — skipping build.sh (install Kotlin to enable)"
  fi
else
  skip "No recognised build entry point found"
fi

# ── 4. Docker Compose (conditional) ───────────────────────────────────────
step "4/5  Docker Compose"

COMPOSE_STARTED=false
VALIDATION_ENV=""

cleanup_compose() {
  if $COMPOSE_STARTED && [[ -n "$VALIDATION_ENV" ]]; then
    docker compose -f infrastructure/docker-compose.yml --env-file "$VALIDATION_ENV" down >/dev/null 2>&1 || true
  fi
  if [[ -n "$VALIDATION_ENV" && -f "$VALIDATION_ENV" ]]; then
    rm -f "$VALIDATION_ENV"
  fi
}
trap cleanup_compose EXIT

if $SKIP_COMPOSE; then
  skip "Compose skipped via --skip-compose"
elif [[ -f "infrastructure/docker-compose.yml" ]]; then
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    if ! command -v openssl >/dev/null 2>&1; then
      fail "openssl is required to generate disposable validation secrets"
    else
      VALIDATION_ENV="$(mktemp)"
      cat > "$VALIDATION_ENV" <<EOF
ASPNETCORE_ENVIRONMENT=Development
POSTGRES_DB=acing_iu
POSTGRES_USER=acing_admin
POSTGRES_PASSWORD=$(openssl rand -hex 24)
MIGRATOR_DB_USER=acing_migrator
MIGRATOR_DB_PASSWORD=$(openssl rand -hex 24)
IDENTITY_DB_USER=acing_identity
IDENTITY_DB_PASSWORD=$(openssl rand -hex 24)
DEVICE_TRUST_DB_USER=acing_device_trust
DEVICE_TRUST_DB_PASSWORD=$(openssl rand -hex 24)
REDIS_PASSWORD=$(openssl rand -hex 24)
JWT_ISSUER=acing-iu-validation
JWT_AUDIENCE=acing-iu-validation-api
JWT_SIGNING_KEY=$(openssl rand -hex 32)
MFA_SECRET_PROTECTION_ACTIVE_KEY_ID=mfa-v1
MFA_SECRET_PROTECTION_KEY_MFA_V1=$(openssl rand -base64 32 | tr -d "\n")
GATEWAY_PORT=8080
POSTGRES_PORT=5433
REDIS_PORT=6379
EOF

      echo "    Building Compose services..."
      if docker compose -f infrastructure/docker-compose.yml --env-file "$VALIDATION_ENV" build; then
        ok "Compose build succeeded"
      else
        fail "Compose build failed"
      fi

      echo "    Starting Compose services..."
      if docker compose -f infrastructure/docker-compose.yml --env-file "$VALIDATION_ENV" up -d; then
        COMPOSE_STARTED=true
        ok "Compose services started"
      else
        fail "Compose up failed"
      fi
    fi
  else
    skip "docker/compose not available — skipping Compose checks"
  fi
else
  fail "Canonical infrastructure/docker-compose.yml is missing"
fi

# ── 5. Readiness / health checks ──────────────────────────────────────────
step "5/5  Readiness / health checks"
if $SKIP_COMPOSE; then
  skip "Health checks skipped with Compose"
elif ! $COMPOSE_STARTED; then
  skip "Compose stack was not started — health checks unavailable"
elif command -v curl >/dev/null 2>&1; then
  HEALTHY=false
  for _ in $(seq 1 60); do
    if curl --fail --silent --show-error "http://127.0.0.1:8080/health/live" >/dev/null 2>&1; then
      HEALTHY=true
      break
    fi
    sleep 2
  done

  if $HEALTHY; then
    ok "Gateway liveness endpoint responded"
  else
    docker compose -f infrastructure/docker-compose.yml --env-file "$VALIDATION_ENV" ps || true
    docker compose -f infrastructure/docker-compose.yml --env-file "$VALIDATION_ENV" logs --no-color || true
    fail "Gateway liveness endpoint did not become healthy"
  fi
else
  skip "curl not available — health endpoint probe skipped"
fi

if $COMPOSE_STARTED; then
  echo "    Stopping Compose services..."
  if docker compose -f infrastructure/docker-compose.yml --env-file "$VALIDATION_ENV" down; then
    COMPOSE_STARTED=false
    ok "Compose services stopped cleanly"
  else
    fail "Compose down failed"
  fi
fi

# ── Summary ───────────────────────────────────────────────────────────────
echo ""
if [[ "$FAILURES" -eq 0 ]]; then
  echo -e "${GREEN}==============================================
  All enabled checks PASSED.
==============================================
${NC}"
  exit 0
else
  echo -e "${RED}==============================================
  $FAILURES check(s) FAILED. Review output above.
==============================================
${NC}"
  exit 1
fi
