package main

import (
	"context"
	"fmt"
	"log"
)

type orphanResult struct {
	Checked  int      `json:"checked"`
	Orphaned int      `json:"orphaned"`
	Pruned   int      `json:"pruned"`
	IDs      []string `json:"pruned_ids"`
	DryRun   bool     `json:"dry_run"`
}

func (s *Server) runOrphanCheck(ctx context.Context, dryRun bool) (orphanResult, error) {
	res := orphanResult{DryRun: dryRun, IDs: []string{}}

	files, err := s.db.ListFiles()
	if err != nil {
		return res, err
	}

	var orphans []FileRecord
	for _, rec := range files {
		if ctx.Err() != nil {
			log.Printf("orphans: check aborted (%v), resuming next run", ctx.Err())
			break
		}
		exists, err := s.storage.Exists(ctx, rec.StoragePath)
		if err != nil {
			log.Printf("orphans: exists %s (%s): %v", rec.ID, rec.StoragePath, err)
			continue
		}
		res.Checked++
		if exists {
			continue
		}
		res.Orphaned++
		orphans = append(orphans, rec)
		res.IDs = append(res.IDs, rec.ID)
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
