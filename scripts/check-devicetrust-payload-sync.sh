#!/usr/bin/env bash
# Compare every DeviceTrust source/project file; generated build output is not source.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CANON="$ROOT/backend/DeviceTrust/src/AcingIU.DeviceTrust.Api"
PAYLOAD="$ROOT/installer/payload/platform/backend/DeviceTrust/src/AcingIU.DeviceTrust.Api"
for tree in "$CANON" "$PAYLOAD"; do
  [[ -d "$tree" ]] || { echo "::error::Missing DeviceTrust tree: $tree"; exit 1; }
done
WORK="$(mktemp -d)"
trap 'rm -f "$WORK/canonical" "$WORK/payload"; rmdir "$WORK"' EXIT
list_sources() {
  (cd "$1"
   links=$(find . -type d \( -name bin -o -name obj \) -prune -o -type l -print)
   [[ -z "$links" ]] || { echo "::error::Symlink in DeviceTrust source tree" >&2; exit 1; }
   find . -type d \( -name bin -o -name obj \) -prune -o \
     -type f ! -name Dockerfile ! -name .dockerignore -print | sed 's|^\./||' | sort)
}
list_sources "$CANON" > "$WORK/canonical"
list_sources "$PAYLOAD" > "$WORK/payload"
FAIL=0
while IFS= read -r file; do
  [[ -n "$file" ]] || continue
  echo "::error::Payload missing source: $file"
  FAIL=1
done < <(comm -23 "$WORK/canonical" "$WORK/payload")
while IFS= read -r file; do
  [[ -n "$file" ]] || continue
  echo "::error::Payload has extra source: $file"
  FAIL=1
done < <(comm -13 "$WORK/canonical" "$WORK/payload")
while IFS= read -r file; do
  [[ -n "$file" ]] || continue
  if ! cmp -s "$CANON/$file" "$PAYLOAD/$file"; then
    echo "::error::DeviceTrust source drift: $file"
    FAIL=1
  fi
done < <(comm -12 "$WORK/canonical" "$WORK/payload")
[[ "$FAIL" -eq 0 ]] || exit 1
echo "DeviceTrust payload sources match canonical backend."
