#!/usr/bin/env bash
# check-claim-surface.sh — Block unsupported security/certification claims (#63)
#
# Scans operator-facing and fixture surfaces for terms that imply live Knox,
# Magisk, certification, or real personal data. Design-doc language is allowed
# only when clearly framed as inspiration / not implemented.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FAIL=0
report() {
  echo "::error file=$1::$2"
  echo "FAIL: $1 — $2"
  FAIL=1
}

# ── 1. Operator-facing frontend: no bare product/cert claims ─────────────
if [[ -d frontend/src ]]; then
  mapfile -t FRONTEND_FILES < <(find frontend/src -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.jsx' -o -name '*.js' \) 2>/dev/null || true)
  for f in "${FRONTEND_FILES[@]:-}"; do
    [[ -z "$f" ]] && continue
    if grep -nE 'SIG-KNOX' "$f" >/dev/null 2>&1; then
      report "$f" "Contains SIG-KNOX identifier (use SIG-FIXTURE-* instead)"
    fi
    if grep -nEi '@(gmail|verizon|yahoo|hotmail|outlook)\.com' "$f" >/dev/null 2>&1; then
      report "$f" "Contains real-looking email domain in fixture data (use @example.invalid)"
    fi
    if grep -nEi 'Knox (certified|attestation|warranty|fuse|vault|matrix)' "$f" >/dev/null 2>&1; then
      while IFS= read -r line; do
        [[ -z "$line" ]] && continue
        if ! echo "$line" | grep -qiE 'fixture|simulator|not (available|certified|operational)|design inspiration|no .+ attestation'; then
          report "$f" "Operator surface uses Knox capability language without fixture disclaimer: ${line:0:120}"
        fi
      done < <(grep -nEi 'Knox (certified|attestation|warranty|fuse|vault|matrix)' "$f" || true)
    fi
  done
fi

# ── 2. RootMaster must remain the safety-gate stub ───────────────────────
RM="frontend/src/app/rootmaster/page.tsx"
if [[ -f "$RM" ]]; then
  if ! grep -q 'RootMaster unavailable' "$RM"; then
    report "$RM" "RootMaster page must keep the hard safety gate (RootMaster unavailable)"
  fi
  if grep -qiE 'Ready to flash|Magisk injection|Decompile bootloader' "$RM"; then
    report "$RM" "RootMaster reintroduced destructive/flash language; keep surface disabled"
  fi
fi

# ── 3. Vault emulator must stay deterministic ────────────────────────────
VAULT="system/security/guardian/core/AcingVaultEmulator.kt"
if [[ -f "$VAULT" ]]; then
  if grep -nE 'Math\.random\(\)' "$VAULT" >/dev/null 2>&1; then
    report "$VAULT" "AcingVaultEmulator must not use Math.random() on initialize (non-deterministic)"
  fi
fi

if [[ "$FAIL" -eq 1 ]]; then
  echo ""
  echo "Claim-surface check failed. See issue #63."
  echo "Operator UI must not present unsupported Knox/certification claims as operational facts."
  exit 1
fi

echo "Claim-surface check passed."
