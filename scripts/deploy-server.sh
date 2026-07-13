#!/usr/bin/env bash
set -Eeuo pipefail

IMAGE_TAG_TO_DEPLOY="${1:?Usage: deploy-server.sh <image-tag>}"
APP_ROOT="${APP_ROOT:-/opt/enterprise-rag}"
ENV_FILE="${ENV_FILE:-${APP_ROOT}/.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-${APP_ROOT}/docker/docker-compose.demo.yml}"
CURRENT_TAG_FILE="${APP_ROOT}/.current-image-tag"
PREVIOUS_TAG=""

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}" >&2
  exit 1
fi

cd "${APP_ROOT}"

if [[ -f "${CURRENT_TAG_FILE}" ]]; then
  PREVIOUS_TAG="$(tr -d '\r\n' < "${CURRENT_TAG_FILE}")"
fi

compose() {
  IMAGE_TAG="$1" docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "${@:2}"
}

wait_for_health() {
  local attempts="${DEPLOY_HEALTH_ATTEMPTS:-36}"
  local interval="${DEPLOY_HEALTH_INTERVAL_SECONDS:-5}"

  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    if curl --fail --silent --show-error http://127.0.0.1/api/health >/dev/null; then
      return 0
    fi

    echo "Waiting for application health (${attempt}/${attempts})..."
    sleep "${interval}"
  done

  return 1
}

echo "Pulling application images for ${IMAGE_TAG_TO_DEPLOY}..."
compose "${IMAGE_TAG_TO_DEPLOY}" pull backend ingestion-worker frontend

echo "Starting application stack..."
compose "${IMAGE_TAG_TO_DEPLOY}" up -d --remove-orphans

if wait_for_health; then
  printf '%s\n' "${IMAGE_TAG_TO_DEPLOY}" > "${CURRENT_TAG_FILE}"
  curl --silent --show-error http://127.0.0.1/api/health/readiness || true
  docker image prune -f >/dev/null
  echo "Deployment ${IMAGE_TAG_TO_DEPLOY} completed."
  exit 0
fi

echo "Health check failed for ${IMAGE_TAG_TO_DEPLOY}." >&2

if [[ -n "${PREVIOUS_TAG}" && "${PREVIOUS_TAG}" != "${IMAGE_TAG_TO_DEPLOY}" ]]; then
  echo "Rolling back to ${PREVIOUS_TAG}..." >&2
  compose "${PREVIOUS_TAG}" pull backend ingestion-worker frontend || true
  compose "${PREVIOUS_TAG}" up -d --remove-orphans

  if wait_for_health; then
    echo "Rollback to ${PREVIOUS_TAG} completed." >&2
  else
    echo "Rollback health check also failed. Inspect docker compose logs." >&2
  fi
fi

exit 1
