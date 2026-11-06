#!/usr/bin/env bash
# Compile and package desktop Guardian research components only.
# This does not create an OS image or execute packaged boot scripts.
set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$REPO_ROOT/system/security/guardian/build"
OUTPUT_DIR="$REPO_ROOT/out/security/guardian"
ARTIFACTS=(guardian.jar guardian_init.sh iu_security_init iu_auth_service
           acing_vault_init acing_vault_check_tamper)

fail() { printf 'Guardian build failed: %s\n' "$*" >&2; exit 1; }

[[ -f "$BUILD_DIR/Makefile" ]] || fail "Missing $BUILD_DIR/Makefile"
command -v make >/dev/null 2>&1 || fail "GNU Make is required."

printf 'Building Guardian desktop research components...\n'
if ! make -C "$BUILD_DIR"; then
    fail "Compilation or artifact generation failed; outputs were not packaged."
fi

# Verify every expected output before copying any into the package.
for artifact in "${ARTIFACTS[@]}"; do
    [[ -s "$BUILD_DIR/out/$artifact" ]] || fail "Missing or empty output: $artifact"
done

mkdir -p -- "$OUTPUT_DIR"
for artifact in "${ARTIFACTS[@]}"; do
    cp -- "$BUILD_DIR/out/$artifact" "$OUTPUT_DIR/$artifact"
done

printf 'Guardian desktop build completed successfully: %s\n' "$OUTPUT_DIR"
