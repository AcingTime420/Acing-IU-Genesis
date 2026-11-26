#!/usr/bin/env bash
# Verify that the committed Windows-installer platform payload is reproducibly
# derived from canonical repository sources.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAYLOAD="$ROOT/installer/payload/platform"
FAIL=0

error() {
  echo "::error::$*"
  FAIL=1
}

check_file() {
  local label="$1"
  local src="$2"
  local dst="$3"

  if [[ ! -f "$src" ]]; then
    error "$label canonical file missing: $src"
    return
  fi
  if [[ ! -f "$dst" ]]; then
    error "$label payload file missing: $dst"
    return
  fi
  if ! diff -q "$src" "$dst" >/dev/null 2>&1; then
    error "$label payload drift"
    diff -u "$src" "$dst" || true
  fi
}

check_tree() {
  local label="$1"
  local src="$2"
  local dst="$3"

  if [[ ! -d "$src" ]]; then
    error "$label canonical tree missing: $src"
    return
  fi
  if [[ ! -d "$dst" ]]; then
    error "$label payload tree missing: $dst"
    return
  fi

  mapfile -t src_files < <(cd "$src" && find . -type f -printf '%P\n' | sort)
  mapfile -t dst_files < <(cd "$dst" && find . -type f -printf '%P\n' | sort)

  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    error "$label payload missing canonical file: $f"
  done < <(comm -23 <(printf '%s\n' "${src_files[@]}") <(printf '%s\n' "${dst_files[@]}"))

  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    error "$label payload contains extra file: $f"
  done < <(comm -13 <(printf '%s\n' "${src_files[@]}") <(printf '%s\n' "${dst_files[@]}"))

  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    if ! diff -q "$src/$f" "$dst/$f" >/dev/null 2>&1; then
      error "$label payload drift: $f"
      diff -u "$src/$f" "$dst/$f" || true
    fi
  done < <(comm -12 <(printf '%s\n' "${src_files[@]}") <(printf '%s\n' "${dst_files[@]}"))
}

check_tree "Identity" \
  "$ROOT/backend/Identity/src/AcingIU.Identity.Api" \
  "$PAYLOAD/backend/Identity/src/AcingIU.Identity.Api"

check_tree "DeviceTrust" \
  "$ROOT/backend/DeviceTrust/src/AcingIU.DeviceTrust.Api" \
  "$PAYLOAD/backend/DeviceTrust/src/AcingIU.DeviceTrust.Api"

check_tree "SharedKernel" \
  "$ROOT/backend/SharedKernel/src/AcingIU.SharedKernel" \
  "$PAYLOAD/backend/SharedKernel/src/AcingIU.SharedKernel"

check_tree "PostgreSQL" "$ROOT/infrastructure/postgres" "$PAYLOAD/postgres"
check_tree "Redis" "$ROOT/infrastructure/redis" "$PAYLOAD/redis"
check_tree "Nginx" "$ROOT/infrastructure/nginx" "$PAYLOAD/nginx"
check_tree "Infrastructure scripts" "$ROOT/infrastructure/scripts" "$PAYLOAD/scripts"

check_file "Environment template" "$ROOT/.env.example" "$PAYLOAD/.env.example"
check_file "Platform README" "$ROOT/infrastructure/README.md" "$PAYLOAD/README.md"
check_file "Backend documentation" "$ROOT/backend/README.md" "$ROOT/installer/payload/documentation/BACKEND.md"

EXPECTED_COMPOSE="$(mktemp)"
trap 'rm -f "$EXPECTED_COMPOSE"' EXIT
sed -E 's/^([[:space:]]+)context:[[:space:]]+\.\.$/\1context: ./' \
  "$ROOT/infrastructure/docker-compose.yml" > "$EXPECTED_COMPOSE"

if [[ ! -f "$PAYLOAD/docker-compose.yml" ]]; then
  error "Installer payload compose file is missing"
elif ! diff -q "$EXPECTED_COMPOSE" "$PAYLOAD/docker-compose.yml" >/dev/null 2>&1; then
  error "Installer payload docker-compose.yml drifted from canonical transformed compose"
  diff -u "$EXPECTED_COMPOSE" "$PAYLOAD/docker-compose.yml" || true
fi

if [[ "$FAIL" -ne 0 ]]; then
  echo ""
  echo "Installer payload is not reproducibly synchronized with canonical sources."
  echo "Run installer/scripts/prepare-payload.ps1, review the generated payload, and commit it."
  exit 1
fi

echo "Installer payload is synchronized with canonical sources."
