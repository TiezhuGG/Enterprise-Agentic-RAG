#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/opt/enterprise-rag}"
ENV_FILE="${ENV_FILE:-${APP_ROOT}/.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-${APP_ROOT}/docker/docker-compose.demo.yml}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/enterprise-rag-backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
INCLUDE_NEO4J=false

if [[ "${1:-}" == "--include-neo4j" ]]; then
  INCLUDE_NEO4J=true
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}" >&2
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="${BACKUP_ROOT}/${TIMESTAMP}"
mkdir -p "${TARGET}/minio"

compose() {
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

echo "Backing up PostgreSQL..."
compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "${TARGET}/postgres.sql.gz"

echo "Mirroring MinIO bucket..."
docker run --rm \
  --network enterprise-rag-demo-app \
  --env MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY}" \
  --env MINIO_SECRET_KEY="${MINIO_SECRET_KEY}" \
  --env MINIO_BUCKET="${MINIO_BUCKET}" \
  --volume "${TARGET}/minio:/backup" \
  --entrypoint /bin/sh \
  minio/mc:latest \
  -c 'mc alias set local http://minio:9000 "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null && mc mirror --overwrite "local/$MINIO_BUCKET" /backup'

if [[ "${INCLUDE_NEO4J}" == "true" ]]; then
  echo "Creating a cold Neo4j volume backup..."
  compose stop neo4j
  trap 'compose start neo4j >/dev/null 2>&1 || true' EXIT
  docker run --rm \
    --volume enterprise-rag-demo-neo4j:/data:ro \
    --volume "${TARGET}:/backup" \
    alpine:3.20 \
    tar -czf /backup/neo4j-data.tar.gz -C /data .
  compose start neo4j
  trap - EXIT
fi

find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime "+${RETENTION_DAYS}" -exec rm -rf -- {} +
echo "Backup completed: ${TARGET}"
