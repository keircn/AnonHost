FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN npm install

FROM deps AS builder
ARG DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
ENV DATABASE_URL=${DATABASE_URL}
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/lib/db ./src/lib/db
COPY --from=builder /app/src/lib/install.sh ./src/lib/install.sh

RUN mkdir -p /app/uploads

EXPOSE 1984

CMD ["npm", "run", "start"]
