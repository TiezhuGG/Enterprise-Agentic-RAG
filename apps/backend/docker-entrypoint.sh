#!/bin/sh
set -eu

if [ "${SKIP_PRISMA_GENERATE:-false}" != "true" ]; then
  pnpm --filter @enterprise-agentic-rag/backend prisma:generate
fi

pnpm --filter @enterprise-agentic-rag/backend prisma:deploy

if [ "${RUN_SEED:-false}" = "true" ]; then
  pnpm --filter @enterprise-agentic-rag/backend prisma:seed
fi

exec "$@"
