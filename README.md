# AnonHost

`"The free, open source, private image host"`

## Live instance

[Roxyproxy](https://anonhost.cc)

## Installation (Docker Compose)

Copy env template and fill required values:

```bash
cp .env.example .env
```

Required at minimum:

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your public URL)
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `SMTP_*`

Start containers:

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
