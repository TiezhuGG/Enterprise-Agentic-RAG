#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/opt/enterprise-rag}"
ENV_FILE="${ENV_FILE:-${APP_ROOT}/.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-${APP_ROOT}/docker/docker-compose.demo.yml}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
RUN_SEED=false
RUN_DEMO=false

for argument in "$@"; do
  case "${argument}" in
    --seed) RUN_SEED=true ;;
    --demo) RUN_DEMO=true ;;
    *) echo "Unknown option: ${argument}" >&2; exit 1 ;;
  esac
done

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy .env.demo.example to .env.production first." >&2
  exit 1
fi

cd "${APP_ROOT}"

compose() {
  IMAGE_TAG="${IMAGE_TAG}" docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

wait_for_ollama() {
  local attempts="${OLLAMA_START_ATTEMPTS:-24}"
  local interval="${OLLAMA_START_INTERVAL_SECONDS:-5}"

  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    if compose exec -T ollama ollama list >/dev/null 2>&1; then
      return 0
    fi

    echo "Waiting for Ollama (${attempt}/${attempts})..."
    sleep "${interval}"
  done

  return 1
}

compose pull
compose up -d postgres redis elasticsearch minio neo4j ollama

if ! wait_for_ollama; then
  echo "Ollama did not become ready. Inspect the Ollama container logs." >&2
  exit 1
fi

echo "Pulling the 768-dimensional embedding model..."
compose exec -T ollama ollama pull nomic-embed-text

compose up -d --remove-orphans

if [[ "${RUN_SEED}" == "true" ]]; then
  compose exec -T backend pnpm --filter @enterprise-agentic-rag/backend prisma:seed
fi

if [[ "${RUN_DEMO}" == "true" ]]; then
  compose exec -T backend pnpm --filter @enterprise-agentic-rag/backend demo:seed --no-graph
fi

printf '%s\n' "${IMAGE_TAG}" > "${APP_ROOT}/.current-image-tag"
curl --fail --retry 24 --retry-delay 5 --retry-connrefused http://127.0.0.1/api/health
curl --silent --show-error http://127.0.0.1/api/health/readiness || true

echo "Initial deployment completed."
