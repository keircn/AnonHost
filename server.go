package main

import (
	"context"
	"log"
	"net/http"
	"os"
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

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("listening on %s", cfg.Bind)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-quit
	log.Println("shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	return httpServer.Shutdown(ctx)
}
