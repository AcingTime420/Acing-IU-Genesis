#!/usr/bin/env bash
# Exercise the real entry point in disposable fixtures without Kotlin or devices.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fixture_root="$(mktemp -d)"
trap 'rm -rf -- "$fixture_root"' EXIT
artifacts=(guardian.jar guardian_init.sh iu_security_init iu_auth_service acing_vault_init acing_vault_check_tamper)

prepare() {
    fixture="$fixture_root/$1"
    mkdir -p "$fixture"
    cp "$repo_root/build.sh" "$fixture/build.sh"
}

expect_failure() {
    local status=0
    (cd "$fixture" && bash build.sh) >"$fixture/output.log" 2>&1 || status=$?
    if [[ "$status" -eq 0 ]] || grep -q 'build process completed' "$fixture/output.log"; then
        cat "$fixture/output.log"
        echo "FAIL: $1 reported success" >&2
        exit 1
    fi
    echo "PASS: $1 fails without success output (exit $status)"
}

prepare missing-build-directory
expect_failure missing-build-directory

prepare failed-make
mkdir -p "$fixture/system/security/guardian/build"
printf 'all:\n\t@exit 7\n' >"$fixture/system/security/guardian/build/Makefile"
expect_failure failed-make

prepare missing-artifact
mkdir -p "$fixture/system/security/guardian/build"
printf 'all:\n\t@mkdir -p out\n' >"$fixture/system/security/guardian/build/Makefile"
expect_failure missing-artifact

prepare blocked-destination
mkdir -p "$fixture/system/security/guardian/build/out" "$fixture/out/security"
printf 'all:\n\t@true\n' >"$fixture/system/security/guardian/build/Makefile"
for artifact in "${artifacts[@]}"; do
    printf 'fixture: %s\n' "$artifact" >"$fixture/system/security/guardian/build/out/$artifact"
done
# A file where the script destination must be a directory makes mkdir fail.
printf 'blocked\n' >"$fixture/out/security/guardian"
expect_failure blocked-destination

prepare success
mkdir -p "$fixture/system/security/guardian/build/out"
printf 'all:\n\t@true\n' >"$fixture/system/security/guardian/build/Makefile"
for artifact in "${artifacts[@]}"; do
    printf 'fixture: %s\n' "$artifact" >"$fixture/system/security/guardian/build/out/$artifact"
done
(cd "$fixture_root" && bash "$fixture/build.sh") >"$fixture/output.log" 2>&1
for artifact in "${artifacts[@]}"; do
    cmp "$fixture/system/security/guardian/build/out/$artifact" "$fixture/out/security/guardian/$artifact"
done
grep -q 'build process completed' "$fixture/output.log"
echo 'PASS: success stages all six artifacts when invoked outside the checkout'
