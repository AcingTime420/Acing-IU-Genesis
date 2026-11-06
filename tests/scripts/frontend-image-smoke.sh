#!/usr/bin/env bash
# Validate only the image passed by CI, using a new loopback-only disposable container.
set -euo pipefail
IMAGE="${1:?Pass the built frontend image tag}"
BODY="$(mktemp)"
CONTAINER=""
cleanup() {
  status=$?
  trap - EXIT
  if [[ -n "$CONTAINER" ]] && ! docker stop "$CONTAINER" >/dev/null; then
    echo "::error::Could not stop the frontend test container" >&2
    status=1
  fi
  rm -f "$BODY"
  exit "$status"
}
trap cleanup EXIT
CONTAINER="$(docker run --rm -d -p 127.0.0.1::3000 "$IMAGE")"
PORT="$(docker inspect --format '{{(index (index .NetworkSettings.Ports "3000/tcp") 0).HostPort}}' "$CONTAINER")"
READY=0
for attempt in $(seq 1 30); do
  if curl --silent --show-error --fail --max-time 2 "http://127.0.0.1:$PORT/" -o "$BODY"; then
    READY=1
    break
  fi
  sleep 1
done
[[ "$READY" -eq 1 ]] || { echo "::error::Frontend image did not become ready"; exit 1; }
for route in / /devices; do
  curl --silent --show-error --fail --max-time 5 "http://127.0.0.1:$PORT$route" -o "$BODY"
  grep -Fq '<html' "$BODY"
done
docker exec "$CONTAINER" node --version
docker exec "$CONTAINER" node -e '
for (const name of ["eslint", "typescript"]) {
  try { require.resolve(name); console.error("Unexpected build dependency: " + name); process.exit(1); }
  catch (error) { if (error.code !== "MODULE_NOT_FOUND") throw error; }
}'
echo "Frontend image served both routes without ESLint or TypeScript installed."
