package main

import (
	"context"
	"log"
	"time"
)

func retentionCutoff(days int) string {
	if days <= 0 {
		days = 14
	}
	return time.Now().UTC().Add(-time.Duration(days) * 24 * time.Hour).Format(time.RFC3339)
}

func (s *Server) deleteRecord(ctx context.Context, rec FileRecord) error {
	if rec.StoragePath != "" {
		n, err := s.db.CountByStoragePath(rec.StoragePath)
		if err != nil {
			log.Printf("cleanup: refcount %s (%s): %v", rec.ID, rec.StoragePath, err)
		} else if n > 1 {
			log.Printf("cleanup: keeping shared object %s (%d references)", rec.StoragePath, n)
		} else if err := s.storage.Delete(ctx, rec.StoragePath); err != nil {
			log.Printf("cleanup: storage delete %s (%s): %v", rec.ID, rec.StoragePath, err)
		}
	}
	return s.db.DeleteFile(rec.ID)
}

type cleanupResult struct {
	Expired     int   `json:"expired"`
	Aged        int   `json:"aged"`
	Total       int   `json:"total"`
	Freed       int64 `json:"freed_bytes"`
	DedupGroups int   `json:"dedup_groups"`
	Deduped     int   `json:"deduped"`
	DedupFreed  int64 `json:"dedup_freed_bytes"`
}

func (s *Server) runCleanup(ctx context.Context, retentionDays int) (cleanupResult, error) {
	var res cleanupResult

	now := time.Now().UTC().Format(time.RFC3339)
	expired, err := s.db.ListExpired(now)
	if err != nil {
		return res, err
	}
	for _, rec := range expired {
		if err := s.deleteRecord(ctx, rec); err != nil {
			log.Printf("cleanup: db delete %s: %v", rec.ID, err)
			continue
		}
		res.Expired++
		res.Freed += rec.Size
	}

	if retentionDays > 0 {
		cutoff := retentionCutoff(retentionDays)
		old, err := s.db.ListOlderThan(cutoff)
		if err != nil {
			return res, err
		}
		for _, rec := range old {
			if err := s.deleteRecord(ctx, rec); err != nil {
				log.Printf("cleanup: db delete %s: %v", rec.ID, err)
				continue
			}
			res.Aged++
			res.Freed += rec.Size
		}
	}

	res.Total = res.Expired + res.Aged
	if res.Total > 0 {
		log.Printf("cleanup: deleted %d files (%d expired, %d aged), freed %d bytes",
			res.Total, res.Expired, res.Aged, res.Freed)
	}

	dedup, err := s.runDedup(ctx)
	if err != nil {
		log.Printf("cleanup: dedup: %v", err)
		return res, nil
	}
	res.DedupGroups = dedup.Groups
	res.Deduped = dedup.Deduped
	res.DedupFreed = dedup.Freed
	return res, nil
}

func (s *Server) startCleanupLoop(ctx context.Context, retentionDays int, interval time.Duration) {
	if retentionDays <= 0 {
		log.Println("cleanup: retention disabled")
		return
	}
	if interval <= 0 {
		interval = time.Hour
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	select {
	case <-ctx.Done():
		return
	case <-time.After(30 * time.Second):
	}
	if _, err := s.runCleanup(context.Background(), retentionDays); err != nil {
		log.Printf("cleanup: initial run: %v", err)
	}

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if _, err := s.runCleanup(context.Background(), retentionDays); err != nil {
				log.Printf("cleanup: periodic run: %v", err)
			}
		}
	}
}
