#!/usr/bin/env bash
# Fail if installer DeviceTrust runtime sources drift from canonical backend.
# Compares the full runtime tree (not a fixed allowlist).
# Canonical: backend/DeviceTrust/src/AcingIU.DeviceTrust.Api
# Payload:   installer/payload/platform/backend/DeviceTrust/src/AcingIU.DeviceTrust.Api
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CANON="$ROOT/backend/DeviceTrust/src/AcingIU.DeviceTrust.Api"
PAYLOAD="$ROOT/installer/payload/platform/backend/DeviceTrust/src/AcingIU.DeviceTrust.Api"

# Packaging-only artifacts that may differ by design.
EXCLUDE_REGEX='(^|/)?(Dockerfile|\.dockerignore)$'

if [[ ! -d "$CANON" ]]; then
  echo "::error::Missing canonical tree: $CANON"
  exit 1
fi
if [[ ! -d "$PAYLOAD" ]]; then
  echo "::error::Missing payload tree: $PAYLOAD"
  exit 1
fi

list_runtime() {
  local root="$1"
  (cd "$root" && find . -type f | sed 's|^\./||' | grep -Ev "$EXCLUDE_REGEX" | sort)
}

mapfile -t CANON_FILES < <(list_runtime "$CANON")
mapfile -t PAYLOAD_FILES < <(list_runtime "$PAYLOAD")

FAIL=0

# Detect files only on one side
comm -23 <(printf '%s\n' "${CANON_FILES[@]}") <(printf '%s\n' "${PAYLOAD_FILES[@]}") | while read -r f; do
  [[ -z "$f" ]] && continue
  echo "::error::Payload missing runtime file present in canonical: $f"
  FAIL=1
done

comm -13 <(printf '%s\n' "${CANON_FILES[@]}") <(printf '%s\n' "${PAYLOAD_FILES[@]}") | while read -r f; do
  [[ -z "$f" ]] && continue
  echo "::error::Payload has extra runtime file not in canonical: $f"
  FAIL=1
done

# Content comparison for intersection
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if ! diff -q "$CANON/$f" "$PAYLOAD/$f" >/dev/null 2>&1; then
    echo "::error::DeviceTrust payload drift: $f differs from canonical backend"
    diff -u "$CANON/$f" "$PAYLOAD/$f" || true
    FAIL=1
  fi
done < <(comm -12 <(printf '%s\n' "${CANON_FILES[@]}") <(printf '%s\n' "${PAYLOAD_FILES[@]}"))

# Recompute FAIL from any error messages is hard with subshells — use temp flag file
FLAG=$(mktemp)
rm -f "$FLAG"

comm -23 <(printf '%s\n' "${CANON_FILES[@]}") <(printf '%s\n' "${PAYLOAD_FILES[@]}") | while read -r f; do
  [[ -z "$f" ]] && continue
  echo "missing:$f" >> "$FLAG"
  echo "::error::Payload missing runtime file present in canonical: $f"
done

comm -13 <(printf '%s\n' "${CANON_FILES[@]}") <(printf '%s\n' "${PAYLOAD_FILES[@]}") | while read -r f; do
  [[ -z "$f" ]] && continue
  echo "extra:$f" >> "$FLAG"
  echo "::error::Payload has extra runtime file not in canonical: $f"
done

while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if ! diff -q "$CANON/$f" "$PAYLOAD/$f" >/dev/null 2>&1; then
    echo "diff:$f" >> "$FLAG"
    echo "::error::DeviceTrust payload drift: $f differs from canonical backend"
    diff -u "$CANON/$f" "$PAYLOAD/$f" || true
  fi
done < <(comm -12 <(printf '%s\n' "${CANON_FILES[@]}") <(printf '%s\n' "${PAYLOAD_FILES[@]}"))

if [[ -f "$FLAG" ]]; then
  echo ""
  echo "Installer payload must match canonical DeviceTrust runtime sources."
  echo "Sync: rsync -a --delete --exclude Dockerfile --exclude .dockerignore \\"
  echo "  backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/ \\"
  echo "  installer/payload/platform/backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/"
  rm -f "$FLAG"
  exit 1
fi

rm -f "$FLAG"
echo "DeviceTrust payload is in sync with canonical backend (full runtime tree)."
