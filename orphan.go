package main

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"
)

type orphanResult struct {
	Checked  int      `json:"checked"`
	Orphaned int      `json:"orphaned"`
	Pruned   int      `json:"pruned"`
	IDs      []string `json:"pruned_ids"`
	DryRun   bool     `json:"dry_run"`
}

type orphanJobState struct {
	mu       sync.Mutex
	running  bool
	done     bool
	dryRun   bool
	checked  int
	orphaned int
	pruned   int
	ids      []string
	errMsg   string
}

func (s *Server) runOrphanCheck(ctx context.Context, dryRun bool, progress func(checked, orphaned int)) (orphanResult, error) {
	res := orphanResult{DryRun: dryRun, IDs: []string{}}

	files, err := s.db.ListFiles()
	if err != nil {
		return res, err
	}

	const workers = 24
	var mu sync.Mutex
	var orphans []FileRecord
	queue := make(chan FileRecord)
	var wg sync.WaitGroup
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for rec := range queue {
				cctx, cancel := context.WithTimeout(ctx, 30*time.Second)
				exists, err := s.storage.Exists(cctx, rec.StoragePath)
				cancel()
				mu.Lock()
				if err != nil {
					if ctx.Err() == nil {
						log.Printf("orphans: exists %s (%s): %v", rec.ID, rec.StoragePath, err)
					}
				} else {
					res.Checked++
					if !exists {
						res.Orphaned++
						orphans = append(orphans, rec)
						res.IDs = append(res.IDs, rec.ID)
					}
					if progress != nil {
						progress(res.Checked, res.Orphaned)
					}
				}
				mu.Unlock()
			}
		}()
	}

send:
	for _, rec := range files {
		select {
		case <-ctx.Done():
			break send
		case queue <- rec:
		}
	}
	close(queue)
	wg.Wait()
	if ctx.Err() != nil {
		log.Printf("orphans: check aborted (%v), resuming next run", ctx.Err())
	}

	if dryRun {
		return res, nil
	}

	if len(files) >= 10 && len(orphans)*2 > len(files) {
		return res, fmt.Errorf("refusing to prune %d of %d rows", len(orphans), len(files))
	}

	for _, rec := range orphans {
		if err := s.db.DeleteFile(rec.ID); err != nil {
			log.Printf("orphans: delete row %s: %v", rec.ID, err)
			continue
		}
		res.Pruned++
		log.Printf("orphans: pruned %s (%s)", rec.ID, rec.StoragePath)
	}
	return res, nil
}
