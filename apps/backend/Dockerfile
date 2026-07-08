FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && corepack prepare pnpm@11.7.0 --activate

WORKDIR /app

FROM base AS builder

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN pnpm install --frozen-lockfile --filter @enterprise-agentic-rag/backend...

COPY apps/backend apps/backend

RUN pnpm --filter @enterprise-agentic-rag/backend build

FROM base AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder --chown=node:node /app /app
COPY --chmod=755 apps/backend/docker-entrypoint.sh /app/apps/backend/docker-entrypoint.sh

USER node

EXPOSE 3000

ENTRYPOINT ["/app/apps/backend/docker-entrypoint.sh"]
CMD ["pnpm", "--filter", "@enterprise-agentic-rag/backend", "start"]
