<p align="center">
  <img src="./public/anonhost.svg" width="80" alt="AnonHost">
  <br>
  <b>AnonHost</b>
</p>

<p align="center">
  <a href="https://anonhost.cc"><img src="./public/badge.png" alt="AnonHost"></a>
</p>

---

## Quick start

We use docker. You can run it without but it's not recommended.

```bash
cp .env.example .env # and fill them in obviously
docker compose up -d --build
```

## Stack

- Go
- SQLite
- Cloudflare R2 (optional)
- Docker

## Features

- Anonymous uploads
- No persisted IP logging
- File deletion via cryptographic tokens
- Optional file expiration
- Direct-to-R2 uploads via presigned URLs (faster uploads through the webui)
- Archive previews with tree navigation
- CLI tool
- ShareX support

## CLI

```bash
curl https://anonhost.cc/install | bash
anonhost.sh upload image.png
```

## Roadmap

See [roadmap](https://anonhost.cc/roadmap) for planned improvements.

## License

MIT
