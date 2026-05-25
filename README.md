# AnonHost

File hosting without the bullshit.

## Official instance

[![AnonHost Badge](./public/brand/badge.png)](https://anonhost.cc)

## Quick start (Docker Compose)

```bash
cp .env.example .env # some are optional, most aren't
docker compose up -d --build
```

Bind/port can be changed via `ANONHOST_BIND_IP` and `ANONHOST_PORT`

You can run it manually but I don't recommend it at all lol

## CLI

```bash
curl https://anonhost.cc/install | bash
```

## Stuff I use

- Next.js 16
- Postgres + Drizzle
- Cloudflare R2
- Tailwind CSS
- NextAuth
