<p align="center">
  <img src="./public/anonhost.svg" width="120" alt="AnonHost">
</p>

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
- Automatic retention: files older than 14 days (`ANONHOST_RETENTION_DAYS`) are wiped (storage object + DB row) by an hourly background job; `expires_at` files are wiped too
- Deduplication: each cleanup ends with a content-hash pass over plaintext files. Byte-identical uploads share one master copy (duplicate objects deleted, duplicate IDs repointed, all URLs/deletion tokens keep working); deletes are refcount-aware so shared bytes survive until the last ID is gone. Hash backfill is budgeted per run (`ANONHOST_DEDUP_MAX_FILES`/`ANONHOST_DEDUP_MAX_BYTES`, smallest first) and runs on a client-disconnect-proof context, converging over successive runs
- Orphan prune (manual only, `POST /api/orphans` on the admin port, `?dry_run=1` to preview): drops DB rows whose storage objects are gone, e.g. after manual R2 deletes. Only 404-class misses are pruned, transient errors are skipped, and runs aborting when over half the rows look orphaned
- Internal admin portal on a separate bind (`ANONHOST_ADMIN_BIND`, default `127.0.0.1:1985`): stats, search, delete, manual cleanup, archive rescan. Protect with `ANONHOST_ADMIN_KEY` and keep it off the public interface.

## CLI

```bash
curl https://anonhost.cc/install | bash
anonhost.sh upload image.png
anonhost.sh upload secret.txt --encrypt   # encrypted; key is appended to the URL fragment
```

## Roadmap

See [roadmap](https://anonhost.cc/roadmap) for planned improvements.

## License

MIT
