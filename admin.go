package main

import (
	"net/http"
	"strconv"
	"strings"
	"time"
)

func (s *Server) adminHandler() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /", s.handleAdminPage)
	mux.HandleFunc("GET /api/stats", s.handleAdminStats)
	mux.HandleFunc("GET /api/files", s.handleAdminList)
	mux.HandleFunc("DELETE /api/files/{id}", s.handleAdminDelete)
	mux.HandleFunc("POST /api/cleanup", s.handleAdminCleanup)
	mux.HandleFunc("POST /api/backfill/archive/{id}", s.handleBackfillArchive)
	mux.HandleFunc("POST /api/backfill/archives", s.handleRescanArchives)

	return withLogging(mux)
}

func (s *Server) handleAdminPage(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}
	key := r.URL.Query().Get("key")
	if key == "" {
		if h := r.Header.Get("Authorization"); len(h) > 7 && h[:7] == "Bearer " {
			key = h[7:]
		}
	}
	count, _ := s.db.Count()
	totalSize, _ := s.db.TotalSize()
	cutoff := ""
	if s.cfg.RetentionDays > 0 {
		cutoff = retentionCutoff(s.cfg.RetentionDays)
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	s.views.ExecuteTemplate(w, "admin", map[string]any{
		"AdminKeySet":   s.cfg.AdminKey != "",
		"Key":           key,
		"TotalUploads":  count,
		"TotalSize":     totalSize,
		"TotalHuman":    formatSize(totalSize),
		"RetentionDays": s.cfg.RetentionDays,
		"Cutoff":        cutoff,
		"Now":           time.Now().UTC().Format(time.RFC3339),
	})
}

func (s *Server) handleAdminStats(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}
	count, _ := s.db.Count()
	totalSize, _ := s.db.TotalSize()
	s.respondJSON(w, http.StatusOK, map[string]any{
		"total_uploads":  count,
		"total_size":     totalSize,
		"retention_days": s.cfg.RetentionDays,
		"cutoff":         retentionCutoff(s.cfg.RetentionDays),
		"now":            time.Now().UTC().Format(time.RFC3339),
	})
}

func (s *Server) handleAdminList(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}
	q := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
	limit := 100
	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 500 {
			limit = n
		}
	}
	offset := 0
	if v := r.URL.Query().Get("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			offset = n
		}
	}

	files, err := s.db.ListFiles()
	if err != nil {
		s.respondError(w, http.StatusInternalServerError, "database error")
		return
	}

	type item struct {
		ID          string  `json:"id"`
		Filename    string  `json:"filename"`
		Size        int64   `json:"size"`
		MimeType    string  `json:"mime_type"`
		CreatedAt   string  `json:"created_at"`
		ExpiresAt   *string `json:"expires_at"`
		IsEncrypted bool    `json:"is_encrypted"`
		IsArchive   bool    `json:"is_archive"`
	}

	var filtered []item
	for _, f := range files {
		if q != "" {
			if !strings.Contains(strings.ToLower(f.ID), q) &&
				!strings.Contains(strings.ToLower(f.Filename), q) &&
				!strings.Contains(strings.ToLower(f.MimeType), q) {
				continue
			}
		}
		filtered = append(filtered, item{
			ID: f.ID, Filename: f.Filename, Size: f.Size,
			MimeType: f.MimeType, CreatedAt: f.CreatedAt,
			ExpiresAt: f.ExpiresAt, IsEncrypted: f.IsEncrypted,
			IsArchive: f.IsArchive,
		})
	}
	total := len(filtered)
	if offset > total {
		offset = total
	}
	end := offset + limit
	if end > total {
		end = total
	}

	s.respondJSON(w, http.StatusOK, map[string]any{
		"total":  total,
		"offset": offset,
		"limit":  limit,
		"files":  filtered[offset:end],
	})
}

func (s *Server) handleAdminDelete(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}
	id := r.PathValue("id")
	if id == "" {
		s.respondError(w, http.StatusBadRequest, "missing id")
		return
	}
	rec, err := s.db.GetFile(id)
	if err != nil {
		s.respondError(w, http.StatusNotFound, "file not found")
		return
	}
	if err := s.deleteRecord(r.Context(), *rec); err != nil {
		s.respondError(w, http.StatusInternalServerError, "delete failed")
		return
	}
	s.respondJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

func (s *Server) handleAdminCleanup(w http.ResponseWriter, r *http.Request) {
	if !s.requireAdmin(w, r) {
		return
	}
	if r.Method != "POST" {
		s.respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	res, err := s.runCleanup(r.Context(), s.cfg.RetentionDays)
	if err != nil {
		s.respondError(w, http.StatusInternalServerError, "cleanup failed")
		return
	}
	s.respondJSON(w, http.StatusOK, res)
}
