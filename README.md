# AnonHost

`"The free, open source, private image host"`

## Live instance

[Coming soon](https://roxyproxy.de) to a browser near you

## Installation (Docker Compose)

1. Copy env template and fill required values:

```bash
cp .env.example .env
```

Required at minimum:

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your public URL)
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `SMTP_*`

2. Start stack:

```bash
docker compose up -d --build
```

This starts:

- `anonhost-postgres` (Postgres 17)
- `anonhost-app` (Next.js app on internal port `1984`)

By default, app binds to loopback only for safe reverse proxying:

- `127.0.0.1:1984`

You can change bind/port via `.env`:

- `ANONHOST_BIND_IP`
- `ANONHOST_PORT`

## Reverse Proxy (System Caddy)

Example Caddyfile block:

```caddy
anon.example.com {
    reverse_proxy 127.0.0.1:1984
}
```

## Notes

- On container start, app runs `bun run db:migrate` automatically before `bun run start`.
- Uploaded local files are persisted in Docker volume `uploads_data`.
- Postgres data is persisted in Docker volume `postgres_data`.
