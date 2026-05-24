FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && pnpm config set store-dir ~/.pnpm-store

FROM base AS deps
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

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

RUN mkdir -p /app/uploads

EXPOSE 1984

CMD ["pnpm", "run", "start"]
