FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && corepack prepare pnpm@11.7.0 --activate

WORKDIR /app

FROM base AS builder

ARG APP_ENV=production
ARG NEXT_STANDALONE=true
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

ENV APP_ENV=$APP_ENV
ENV NEXT_STANDALONE=$NEXT_STANDALONE
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json

RUN pnpm install --frozen-lockfile --filter @enterprise-agentic-rag/frontend...

COPY apps/frontend apps/frontend

RUN pnpm --filter @enterprise-agentic-rag/frontend build

FROM node:22-slim AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

WORKDIR /app

COPY --from=builder --chown=node:node /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER node

EXPOSE 3001

CMD ["node", "apps/frontend/server.js"]
