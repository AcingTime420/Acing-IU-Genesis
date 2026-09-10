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
  matches=$(git ls-files -- "$pattern" 2>/dev/null || true)
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

if $SKIP_COMPOSE; then
  skip "Compose skipped via --skip-compose"
elif [[ -f "docker-compose.yml" ]] || [[ -f "compose.yaml" ]]; then
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    echo "    Building Compose services..."
    docker compose build \
      && ok "Compose build succeeded" \
      || fail "Compose build failed"

    echo "    Starting Compose services..."
    docker compose up -d \
      && ok "Compose services started" \
      || fail "Compose up failed"

    sleep 5

    echo "    Stopping Compose services..."
    docker compose down \
      && ok "Compose services stopped cleanly" \
      || fail "Compose down failed"
  else
    skip "docker/compose not available — skipping Compose checks"
  fi
else
  skip "No docker-compose.yml / compose.yaml found — container baseline is planned (see ARCHITECTURE.md)"
fi

# ── 5. Readiness / health checks ──────────────────────────────────────────
step "5/5  Readiness / health checks"
skip "No HTTP endpoints configured yet — health checks are planned (see docs/adr/ADR-001)"

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
