#!/usr/bin/env bash
# Fail if installer DeviceTrust security sources drift from canonical backend.
# Canonical: backend/DeviceTrust/src/AcingIU.DeviceTrust.Api
# Payload:   installer/payload/platform/backend/DeviceTrust/src/AcingIU.DeviceTrust.Api
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CANON="$ROOT/backend/DeviceTrust/src/AcingIU.DeviceTrust.Api"
PAYLOAD="$ROOT/installer/payload/platform/backend/DeviceTrust/src/AcingIU.DeviceTrust.Api"

FILES=(
  "Controllers/TrustController.cs"
  "Services/TrustService.cs"
  "Data/DeviceRepository.cs"
  "Models/TrustModels.cs"
  "Program.cs"
)

FAIL=0
for f in "${FILES[@]}"; do
  if [[ ! -f "$CANON/$f" ]]; then
    echo "::error::Missing canonical file: $CANON/$f"
    FAIL=1
    continue
  fi
  if [[ ! -f "$PAYLOAD/$f" ]]; then
    echo "::error::Missing payload file: $PAYLOAD/$f"
    FAIL=1
    continue
  fi
  if ! diff -q "$CANON/$f" "$PAYLOAD/$f" >/dev/null; then
    echo "::error::DeviceTrust payload drift: $f differs from canonical backend"
    diff -u "$CANON/$f" "$PAYLOAD/$f" || true
    FAIL=1
  fi
done

if [[ "$FAIL" -ne 0 ]]; then
  echo ""
  echo "Installer payload must match canonical backend for security-critical DeviceTrust sources."
  echo "Sync with: cp -a backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/{Controllers,Services,Data,Models,Program.cs} \\"
  echo "  installer/payload/platform/backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/ (adjust paths)"
  exit 1
fi

echo "DeviceTrust payload is in sync with canonical backend (security sources)."
