package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"
)

func (s *Server) handler() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/upload", s.handleUpload)
	mux.HandleFunc("POST /api/upload/direct", s.handleDirectInit)
	mux.HandleFunc("POST /api/upload/direct/finalize", s.handleDirectFinalize)
	mux.HandleFunc("DELETE /api/media/{id}", s.handleDelete)
	mux.HandleFunc("GET /api/upload/storage/{path...}", s.handleServe)
	mux.HandleFunc("GET /api/stats", s.handleStats)
	mux.HandleFunc("GET /api/cron/cleanup", s.handleCronCleanup)
	mux.HandleFunc("GET /api/archive/{id}", s.handleArchiveList)
	mux.HandleFunc("GET /api/archive/{id}/file", s.handleArchiveFile)
	mux.HandleFunc("POST /api/backfill/archive/{id}", s.handleBackfillArchive)
	mux.HandleFunc("POST /api/backfill/archives", s.handleRescanArchives)

	mux.HandleFunc("GET /api/media/{id}", s.handleView)

	mux.HandleFunc("GET /upload", s.handleUploadPage)
	mux.HandleFunc("GET /", s.handleHomePage)

	mux.HandleFunc("GET /{id}", s.handleView)

	mux.HandleFunc("GET /install", s.handleInstallScript)
	mux.HandleFunc("GET /roadmap", s.handleRoadmapPage)
	mux.HandleFunc("GET /sharex", s.handleShareXConfig)
	mux.HandleFunc("GET /sharex/plain", s.handleShareXPlainConfig)

	fileServer := http.FileServer(http.Dir("./public"))
	mux.Handle("GET /public/", http.StripPrefix("/public/", fileServer))

	return withCORS(withLogging(mux))
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, status: 200}
		next.ServeHTTP(rw, r)
		log.Printf("%s %s %d %s", r.Method, r.URL.Path, rw.status, time.Since(start))
	})
}

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

func RunServer(cfg *Config, db *DB, storage Storage) error {
	srv, err := NewServer(cfg, db, storage)
	if err != nil {
		return err
	}

	handler := srv.handler()
	httpServer := &http.Server{
		Addr:         cfg.Bind,
		Handler:      handler,
		ReadTimeout:  60 * time.Second,
		WriteTimeout: 180 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	adminServer := &http.Server{
		Addr:         cfg.AdminBind,
		Handler:      srv.adminHandler(),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	go srv.startCleanupLoop(ctx, cfg.RetentionDays, time.Hour)

	go func() {
		log.Printf("listening on %s", cfg.Bind)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("server error: %v", err)
		}
	}()

	go func() {
		if cfg.AdminBind == "" {
			return
		}
		log.Printf("admin listening on %s (internal only)", cfg.AdminBind)
		if err := adminServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("admin server error: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_ = adminServer.Shutdown(shutdownCtx)
	return httpServer.Shutdown(shutdownCtx)
}
