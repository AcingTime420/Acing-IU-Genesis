#!/usr/bin/env bash
# Exercise the actual Makefile with a compiler that leaves partial output.
# No Kotlin, boot, or device code is executed by this fixture.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fixture="$(mktemp -d)"
trap 'rm -rf -- "$fixture"' EXIT
mkdir -p "$fixture/build" "$fixture/boot" "$fixture/auth" "$fixture/iu_security"
cp "$repo_root/system/security/guardian/build/Makefile" "$fixture/build/Makefile"
for name in guardian_init.sh acing_vault_init acing_vault_check_tamper; do
    printf 'fixture only\n' >"$fixture/boot/$name"
done
printf 'fixture only\n' >"$fixture/auth/iu_auth_service"
printf 'fixture only\n' >"$fixture/iu_security/iu_security_init"
cat >"$fixture/compiler" <<'COMPILER'
#!/usr/bin/env bash
set -euo pipefail
while [[ "$#" -gt 0 ]]; do
    if [[ "$1" == '-d' ]]; then
        shift
        target="$1"
        break
    fi
    shift
done
if [[ ! -f compiler-attempted ]]; then
    touch compiler-attempted
    printf 'partial output\n' >"$target"
    exit 23
fi
printf 'complete output\n' >"$target"
COMPILER
chmod +x "$fixture/compiler"

if make -C "$fixture/build" KOTLINC="$fixture/compiler" >"$fixture/first.log" 2>&1; then
    echo 'FAIL: injected compiler failure unexpectedly succeeded' >&2
    exit 1
fi
if [[ -e "$fixture/build/out/guardian.jar" ]]; then
    echo 'FAIL: failed recipe retained a partial guardian.jar for the next build' >&2
    exit 1
fi
make -C "$fixture/build" KOTLINC="$fixture/compiler" >"$fixture/retry.log" 2>&1
grep -qx 'complete output' "$fixture/build/out/guardian.jar"
echo 'PASS: failed recipe removes its partial JAR and retry invokes the compiler again'
