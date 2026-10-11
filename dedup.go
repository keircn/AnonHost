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

// hashStorageObject streams a stored object and returns its hex SHA-256.
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

// runDedup finds byte-identical plaintext files, deletes the duplicate
// storage objects, and repoints the duplicate IDs at the surviving master
// copy. Every ID keeps its own row (filename, deletion token, expiry), so
// all previously issued URLs and deletion tokens keep working.
//
// Encrypted uploads are excluded: each uses a fresh random salt/IV, so even
// identical plaintexts never share stored bytes.
func (s *Server) runDedup(ctx context.Context) (dedupResult, error) {
	var res dedupResult

	// Backfill hashes for plaintext rows that predate the content_hash column.
	unhashed, err := s.db.ListUnhashedPlaintext()
	if err != nil {
		return res, err
	}
	for _, rec := range unhashed {
		sum, err := s.hashStorageObject(ctx, rec.StoragePath)
		if err != nil {
			// Orphan row (object already gone) or transient backend error:
			// leave the row for the retention/expired passes, don't fail the run.
			log.Printf("dedup: hash %s (%s): %v", rec.ID, rec.StoragePath, err)
			continue
		}
		if err := s.db.UpdateContentHash(rec.ID, sum); err != nil {
			log.Printf("dedup: store hash %s: %v", rec.ID, err)
		}
	}

	hashes, err := s.db.DuplicateHashes()
	if err != nil {
		return res, err
	}

	for _, h := range hashes {
		group, err := s.db.ListByContentHash(h)
		if err != nil {
			log.Printf("dedup: list group %s: %v", h[:12], err)
			continue
		}
		if len(group) < 2 {
			continue
		}
		// Defense in depth: equal hashes imply equal sizes, but verify
		// before merging in case of hash bookkeeping bugs.
		sizes := make(map[int64]bool, len(group))
		for _, rec := range group {
			sizes[rec.Size] = true
		}
		if len(sizes) != 1 {
			log.Printf("dedup: hash %s spans %d sizes, skipping", h[:12], len(sizes))
			continue
		}

		// Oldest upload wins; smallest ID breaks ties deterministically.
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
				continue // already aliased by an earlier run
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
