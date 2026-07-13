#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/opt/enterprise-rag}"
ENV_FILE="${ENV_FILE:-${APP_ROOT}/.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-${APP_ROOT}/docker/docker-compose.demo.yml}"
DISK_WARNING_PERCENT="${DISK_WARNING_PERCENT:-75}"
DISK_CRITICAL_PERCENT="${DISK_CRITICAL_PERCENT:-85}"

compose() {
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

curl --fail --silent --show-error http://127.0.0.1/api/health >/dev/null
curl --silent --show-error http://127.0.0.1/api/health/readiness

DISK_PERCENT="$(df -P "${APP_ROOT}" | awk 'NR == 2 { gsub(/%/, "", $5); print $5 }')"

if ((DISK_PERCENT >= DISK_CRITICAL_PERCENT)); then
  echo "CRITICAL: disk usage is ${DISK_PERCENT}%" >&2
  exit 2
fi

if ((DISK_PERCENT >= DISK_WARNING_PERCENT)); then
  echo "WARNING: disk usage is ${DISK_PERCENT}%" >&2
fi

UNHEALTHY="$(compose ps --format json | grep -E 'unhealthy|exited|dead' || true)"

if [[ -n "${UNHEALTHY}" ]]; then
  echo "Unhealthy containers detected:" >&2
  echo "${UNHEALTHY}" >&2
  exit 1
fi

docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'
echo "Server health check passed. Disk usage: ${DISK_PERCENT}%"
