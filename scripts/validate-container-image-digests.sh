#!/usr/bin/env bash
set -euo pipefail

readonly dockerfiles=(
  "backend/Identity/src/AcingIU.Identity.Api/Dockerfile"
  "backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/Dockerfile"
  "backend/Gateway/Dockerfile"
)
readonly compose_files=(
  "infrastructure/docker-compose.yml"
  "acing-iu/infrastructure/docker-compose.yml"
)
readonly external_images=(
  "postgres"
  "redis"
  "nginx"
)
readonly digest_pattern='@sha256:[a-f0-9]{64}($|[[:space:]])'

failures=0

for dockerfile in "${dockerfiles[@]}"; do
  if [[ ! -f "$dockerfile" ]]; then
    echo "::error title=Missing Dockerfile::$dockerfile is required for image-integrity validation."
    failures=1
    continue
  fi

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    image=$(awk '{print $2}' <<<"$line")
    if [[ "$image" == */* ]] && ! grep -Eq "$digest_pattern" <<<"$image"; then
      echo "::error title=Mutable Dockerfile base image::$dockerfile contains an unpinned external FROM reference: $line"
      failures=1
    fi
  done < <(grep -E '^[[:space:]]*FROM[[:space:]]+' "$dockerfile" || true)
done

for compose_file in "${compose_files[@]}"; do
  if [[ ! -f "$compose_file" ]]; then
    echo "::error title=Missing Compose manifest::$compose_file is required for image-integrity validation."
    failures=1
    continue
  fi

  while IFS= read -r line; do
    image=$(sed -E 's/^[[:space:]]*image:[[:space:]]*//' <<<"$line" | tr -d '"' | tr -d "'")
    [[ -z "$image" ]] && continue

    for repository in "${external_images[@]}"; do
      if [[ "$image" == "$repository":* || "$image" == "$repository"@* ]]; then
        if ! grep -Eq "$digest_pattern" <<<"$image"; then
          echo "::error title=Mutable Compose base image::$compose_file contains an unpinned $repository reference: $image"
          failures=1
        fi
      fi
    done
  done < <(grep -E '^[[:space:]]*image:[[:space:]]+' "$compose_file" || true)
done

if [[ "$failures" -ne 0 ]]; then
  exit 1
fi

echo "Container base-image integrity validation passed."
