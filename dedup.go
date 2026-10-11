package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"log"
	"sort"
)

type dedupResult struct {
	Groups  int   `json:"groups"`
	Deduped int   `json:"deduped"`
	Freed   int64 `json:"freed_bytes"`
}

func (s *Server) hashStorageObject(ctx context.Context, storagePath string) (string, error) {
	rc, _, err := s.storage.GetWithSize(ctx, storagePath)
	if err != nil {
		return "", err
	}
	defer rc.Close()
	h := sha256.New()
	if _, err := io.Copy(h, rc); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

func (s *Server) runDedup(ctx context.Context) (dedupResult, error) {
	var res dedupResult

	maxFiles := s.cfg.DedupMaxFiles
	maxBytes := s.cfg.DedupMaxBytes

	unhashed, err := s.db.ListUnhashedPlaintext(maxFiles)
	if err != nil {
		return res, err
	}
	var hashedBytes int64
	hashed := 0
	for _, rec := range unhashed {
		if ctx.Err() != nil {
			log.Printf("dedup: backfill aborted (%v), resuming next run", ctx.Err())
			break
		}
		if maxBytes > 0 && hashedBytes >= maxBytes {
			break
		}
		sum, err := s.hashStorageObject(ctx, rec.StoragePath)
		if err != nil {
			if ctx.Err() != nil {
				log.Printf("dedup: backfill aborted (%v), resuming next run", ctx.Err())
				break
			}
			log.Printf("dedup: hash %s (%s): %v", rec.ID, rec.StoragePath, err)
			continue
		}
		if err := s.db.UpdateContentHash(rec.ID, sum); err != nil {
			log.Printf("dedup: store hash %s: %v", rec.ID, err)
			continue
		}
		hashed++
		hashedBytes += rec.Size
	}
	if remaining, err := s.db.CountUnhashedPlaintext(); err == nil && (hashed > 0 || remaining > 0) {
		log.Printf("dedup: backfill hashed %d file(s) (%d bytes), %d remaining",
			hashed, hashedBytes, remaining)
	}

	hashes, err := s.db.DuplicateHashes()
	if err != nil {
		return res, err
	}

	for _, h := range hashes {
		if ctx.Err() != nil {
			log.Printf("dedup: merge aborted (%v), resuming next run", ctx.Err())
			break
		}
		group, err := s.db.ListByContentHash(h)
		if err != nil {
			log.Printf("dedup: list group %s: %v", h[:12], err)
			continue
		}
		if len(group) < 2 {
			continue
		}
		sizes := make(map[int64]bool, len(group))
		for _, rec := range group {
			sizes[rec.Size] = true
		}
		if len(sizes) != 1 {
			log.Printf("dedup: hash %s spans %d sizes, skipping", h[:12], len(sizes))
			continue
		}

		sort.Slice(group, func(i, j int) bool {
			if group[i].CreatedAt != group[j].CreatedAt {
				return group[i].CreatedAt < group[j].CreatedAt
			}
			return group[i].ID < group[j].ID
		})
		master := group[0]

		merged := false
		for _, dup := range group[1:] {
			if dup.StoragePath == master.StoragePath {
				continue
			}
			if err := s.storage.Delete(ctx, dup.StoragePath); err != nil {
				log.Printf("dedup: delete object %s (%s): %v", dup.ID, dup.StoragePath, err)
				continue
			}
			if err := s.db.UpdateStoragePath(dup.ID, master.StorageBackend, master.StoragePath); err != nil {
				log.Printf("dedup: repoint %s at %s: %v", dup.ID, master.ID, err)
				continue
			}
			res.Deduped++
			res.Freed += dup.Size
			merged = true
			log.Printf("dedup: %s now aliases master %s (hash %s)", dup.ID, master.ID, h[:12])
		}
		if merged {
			res.Groups++
		}
	}

	if res.Deduped > 0 {
		log.Printf("dedup: merged %d duplicate(s) in %d group(s), freed %d bytes",
			res.Deduped, res.Groups, res.Freed)
	}
	return res, nil
}
