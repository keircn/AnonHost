FROM node:22-alpine AS base
ENV NODE_OPTIONS=--dns-result-order=ipv4first
WORKDIR /app
RUN npm install -g pnpm@10.8.1 && \
    pnpm config set store-dir ~/.pnpm-store && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000 && \
    pnpm config set network-concurrency 2

FROM base AS deps
COPY pnpm-lock.yaml package.json ./
RUN for i in 1 2 3; do pnpm install --frozen-lockfile && break || sleep 5; done

FROM deps AS builder
ARG DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
ENV DATABASE_URL=${DATABASE_URL}
COPY . .
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/lib/db/schema.ts ./src/lib/db/schema.ts

COPY scripts/migrate.mjs ./scripts/migrate.mjs

RUN mkdir -p /app/uploads

EXPOSE 1984

CMD node scripts/migrate.mjs && pnpm run start
