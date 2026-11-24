#!/usr/bin/env bash
# Build and stage Guardian artifacts. This does not build an operating-system image.
set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd -- "$REPO_ROOT"

BUILD_DIR="system/security/guardian/build"
OUTPUT_DIR="out/security/guardian"
ARTIFACTS=(
  guardian.jar
  guardian_init.sh
  iu_security_init
  iu_auth_service
  acing_vault_init
  acing_vault_check_tamper
)

if [[ ! -f "$BUILD_DIR/Makefile" ]]; then
  printf 'BLOCKED: Guardian Makefile is missing: %s/Makefile\n' "$BUILD_DIR" >&2
  exit 1
fi
if ! command -v make >/dev/null 2>&1; then
  printf 'BLOCKED: GNU Make is required to build Guardian.\n' >&2
  exit 1
fi

# Any Make failure terminates the script before staging or claiming success.
make -C "$BUILD_DIR"

# Validate the complete output set before copying any files into the staging path.
for artifact in "${ARTIFACTS[@]}"; do
  if [[ ! -f "$BUILD_DIR/out/$artifact" ]]; then
    printf 'FAIL: Required Guardian build artifact is missing: %s\n' "$artifact" >&2
    exit 1
  fi
done

mkdir -p -- "$OUTPUT_DIR"
for artifact in "${ARTIFACTS[@]}"; do
  cp -- "$BUILD_DIR/out/$artifact" "$OUTPUT_DIR/"
done

printf 'Guardian artifacts staged in %s.\n' "$OUTPUT_DIR"
