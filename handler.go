package main

import (
	"bytes"
	"context"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"mime"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type UploadResponse struct {
	ID             string `json:"id"`
	URL            string `json:"url"`
	Filename       string `json:"filename"`
	Size           int64  `json:"size"`
	MimeType       string `json:"mime_type"`
	DeletionToken  string `json:"deletion_token"`
	CreatedAt      string `json:"created_at"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type Server struct {
	cfg     *Config
	db      *DB
	storage Storage
	views   *template.Template
	rl      *RateLimiter
}

func NewServer(cfg *Config, db *DB, storage Storage) (*Server, error) {
	funcMap := template.FuncMap{
		"hasPrefix":  strings.HasPrefix,
		"formatSize": formatSize,
	}

	views := template.New("").Funcs(funcMap)

	for _, name := range []string{"home", "upload", "view", "upload-form"} {
		content, err := webFS.ReadFile("web/" + name + ".html")
		if err != nil {
			return nil, fmt.Errorf("reading web/%s.html: %w", name, err)
		}
		if _, err := views.New(name).Parse(string(content)); err != nil {
			return nil, fmt.Errorf("parsing %s: %w", name, err)
		}
	}

	return &Server{
		cfg:     cfg,
		db:      db,
		storage: storage,
		views:   views,
		rl:      NewRateLimiter(cfg.RateLimit),
	}, nil
}

func (s *Server) respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (s *Server) respondError(w http.ResponseWriter, status int, msg string) {
	s.respondJSON(w, status, ErrorResponse{Error: msg})
}

func detectContentType(filename string, header []byte) string {
	ct := mime.TypeByExtension(path.Ext(filename))
	if ct != "" {
		return ct
	}
	if len(header) > 512 {
		header = header[:512]
	}
	ct = http.DetectContentType(header)
	return ct
}

func (s *Server) handleUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		s.respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	ip := extractIP(r)
	if !s.rl.Allow(ip) {
		s.respondError(w, http.StatusTooManyRequests, "rate limit exceeded")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, s.cfg.MaxFileSize+1<<20)

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		s.respondError(w, http.StatusBadRequest, "file too large or invalid multipart")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		s.respondError(w, http.StatusBadRequest, "no file provided")
		return
	}
	defer file.Close()

	if header.Size > s.cfg.MaxFileSize {
		s.respondError(w, http.StatusRequestEntityTooLarge,
			fmt.Sprintf("file exceeds maximum size of %d bytes", s.cfg.MaxFileSize))
		return
	}

	headerBuf := make([]byte, 512)
	n, _ := io.ReadFull(file, headerBuf)
	headerBuf = headerBuf[:n]
	reader := io.MultiReader(bytes.NewReader(headerBuf), file)

	mimeType := detectContentType(header.Filename, headerBuf)
	now := time.Now().UTC().Format(time.RFC3339)

	id := GenerateID(10)
	deletionToken := GenerateDeletionToken()
	ext := fileExtension(header.Filename, mimeType)
	key := id + ext

	var storagePath string
	storageBackend := "local"

	if r2s, ok := s.storage.(*R2Storage); ok {
		storageBackend = "r2"
		storagePath = key
		if err := r2s.Save(r.Context(), key, reader, header.Size, mimeType); err != nil {
			log.Printf("r2 upload error: %v", err)
			s.respondError(w, http.StatusInternalServerError, "storage error")
			return
		}
	} else {
		storageBackend = "local"
		storagePath = key
		if err := s.storage.Save(r.Context(), key, reader, header.Size, mimeType); err != nil {
			log.Printf("local storage error: %v", err)
			s.respondError(w, http.StatusInternalServerError, "storage error")
			return
		}
	}

	rec := &FileRecord{
		ID:             id,
		Filename:       header.Filename,
		Size:           header.Size,
		MimeType:       mimeType,
		StorageBackend: storageBackend,
		StoragePath:    storagePath,
		DeletionToken:  deletionToken,
		CreatedAt:      now,
	}

	if header.Size <= 500<<20 && isArchive(header.Filename) {
		entries, fmtName, err := s.readArchiveListing(r.Context(), storagePath)
		if err == nil {
			rec.IsArchive = true
			rec.ArchiveFormat = fmtName
			rec.ArchiveListing = archiveListingJSON(entries)
		}
	}

	if err := s.db.InsertFile(rec); err != nil {
		log.Printf("db insert error: %v", err)
		s.storage.Delete(r.Context(), key)
		s.respondError(w, http.StatusInternalServerError, "database error")
		return
	}

	fileURL := fmt.Sprintf("%s/%s", strings.TrimRight(s.cfg.PublicURL, "/"), id)

	resp := UploadResponse{
		ID:            id,
		URL:           fileURL,
		Filename:      header.Filename,
		Size:          header.Size,
		MimeType:      mimeType,
		DeletionToken: deletionToken,
		CreatedAt:     now,
	}

	s.respondJSON(w, http.StatusOK, resp)
}

func (s *Server) handleDirectInit(w http.ResponseWriter, r *http.Request) {
	r2, ok := s.storage.(*R2Storage)
	if !ok {
		s.respondJSON(w, http.StatusOK, map[string]bool{"direct": false})
		return
	}

	var req struct {
		Filename string `json:"filename"`
		Size     int64  `json:"size"`
		MimeType string `json:"mime_type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	if req.Filename == "" {
		s.respondError(w, http.StatusBadRequest, "filename required")
		return
	}
	if req.Size > s.cfg.MaxFileSize {
		s.respondError(w, http.StatusRequestEntityTooLarge,
			fmt.Sprintf("file exceeds maximum size of %d bytes", s.cfg.MaxFileSize))
		return
	}

	id := GenerateID(10)
	ext := fileExtension(req.Filename, req.MimeType)
	key := id + ext
	uploadURL, err := r2.PresignedPutURL(r.Context(), key, req.MimeType)
	if err != nil {
		log.Printf("presign error: %v", err)
		s.respondError(w, http.StatusInternalServerError, "failed to generate upload URL")
		return
	}

	publicURL := r2.URL(key)

	s.respondJSON(w, http.StatusOK, map[string]any{
		"direct":     true,
		"id":         id,
		"object_key": key,
		"upload_url": uploadURL,
		"public_url": publicURL,
	})
}

func (s *Server) handleDirectFinalize(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID        string `json:"id"`
		ObjectKey string `json:"object_key"`
		Filename  string `json:"filename"`
		Size      int64  `json:"size"`
		MimeType  string `json:"mime_type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	if req.ID == "" || req.ObjectKey == "" || req.Filename == "" {
		s.respondError(w, http.StatusBadRequest, "missing required fields")
		return
	}

	r2, ok := s.storage.(*R2Storage)
	if !ok {
		s.respondError(w, http.StatusInternalServerError, "direct upload not available")
		return
	}

	exists, err := r2.VerifyObject(r.Context(), req.ObjectKey)
	if err != nil {
		log.Printf("verify object error: %v", err)
		s.respondError(w, http.StatusInternalServerError, "verification failed")
		return
	}
	if !exists {
		s.respondError(w, http.StatusNotFound, "file not found in storage")
		return
	}

	ip := extractIP(r)
	s.rl.Allow(ip)

	now := time.Now().UTC().Format(time.RFC3339)
	deletionToken := GenerateDeletionToken()

	rec := &FileRecord{
		ID:             req.ID,
		Filename:       req.Filename,
		Size:           req.Size,
		MimeType:       req.MimeType,
		StorageBackend: "r2",
		StoragePath:    req.ObjectKey,
		DeletionToken:  deletionToken,
		CreatedAt:      now,
	}

	if err := s.db.InsertFile(rec); err != nil {
		log.Printf("db insert error: %v", err)
		r2.Delete(r.Context(), req.ObjectKey)
		s.respondError(w, http.StatusInternalServerError, "database error")
		return
	}

	if req.Size <= 500<<20 && isArchive(req.Filename) {
		entries, fmtName, err := s.readArchiveListing(r.Context(), req.ObjectKey)
		if err == nil {
			rec.IsArchive = true
			rec.ArchiveFormat = fmtName
			rec.ArchiveListing = archiveListingJSON(entries)
			s.db.UpdateArchive(req.ID, true, fmtName, rec.ArchiveListing)
		}
	}

	fileURL := fmt.Sprintf("%s/%s", strings.TrimRight(s.cfg.PublicURL, "/"), req.ID)

	resp := UploadResponse{
		ID:            req.ID,
		URL:           fileURL,
		Filename:      req.Filename,
		Size:          req.Size,
		MimeType:      req.MimeType,
		DeletionToken: deletionToken,
		CreatedAt:     now,
	}

	s.respondJSON(w, http.StatusOK, resp)
}

func (s *Server) handleView(w http.ResponseWriter, r *http.Request) {
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

	if rec.ExpiresAt != nil {
		expires, err := time.Parse(time.RFC3339, *rec.ExpiresAt)
		if err == nil && time.Now().UTC().After(expires) {
			s.storage.Delete(r.Context(), rec.StoragePath)
			s.db.DeleteFile(rec.ID)
			s.respondError(w, http.StatusNotFound, "file has expired")
			return
		}
	}

	fileURL := s.storage.URL(rec.StoragePath)
	isImage := strings.HasPrefix(rec.MimeType, "image/")
	isVideo := strings.HasPrefix(rec.MimeType, "video/")
	isAudio := strings.HasPrefix(rec.MimeType, "audio/")

	playableVideo := isVideo && isPlayableVideo(rec.MimeType)
	playableAudio := isAudio && isPlayableAudio(rec.MimeType)
	isArch := rec.IsArchive
	var listing []FileEntry
	if isArch && rec.ArchiveListing != "" {
		json.Unmarshal([]byte(rec.ArchiveListing), &listing)
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	s.views.ExecuteTemplate(w, "view", map[string]any{
		"ID":                  rec.ID,
		"Filename":            rec.Filename,
		"Size":                rec.Size,
		"MimeType":            rec.MimeType,
		"FileURL":             fileURL,
		"IsImage":             isImage,
		"IsVideo":             playableVideo,
		"IsAudio":             playableAudio,
		"IsUnplayable":        (isVideo || isAudio) && !playableVideo && !playableAudio,
		"IsArchive":           isArch,
		"ArchiveFormat":       rec.ArchiveFormat,
		"ArchiveListing":      listing,
		"ArchiveListingJSON":  template.JS(rec.ArchiveListing),
		"Width":               rec.Width,
		"Height":              rec.Height,
		"BaseURL":             strings.TrimRight(s.cfg.PublicURL, "/"),
	})
}

func (s *Server) handleArchiveList(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	rec, err := s.db.GetFile(id)
	if err != nil {
		s.respondError(w, http.StatusNotFound, "file not found")
		return
	}
	if !rec.IsArchive || rec.ArchiveListing == "" {
		s.respondError(w, http.StatusNotFound, "not an archive")
		return
	}
	var entries []FileEntry
	if err := json.Unmarshal([]byte(rec.ArchiveListing), &entries); err != nil {
		s.respondError(w, http.StatusInternalServerError, "invalid listing")
		return
	}
	s.respondJSON(w, http.StatusOK, map[string]any{
		"format": rec.ArchiveFormat,
		"files":  entries,
	})
}

func (s *Server) handleArchiveFile(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	target := r.URL.Query().Get("path")
	if target == "" {
		s.respondError(w, http.StatusBadRequest, "missing path")
		return
	}

	rec, err := s.db.GetFile(id)
	if err != nil {
		s.respondError(w, http.StatusNotFound, "file not found")
		return
	}
	if !rec.IsArchive {
		s.respondError(w, http.StatusNotFound, "not an archive")
		return
	}

	// verify target path exists in listing
	var entries []FileEntry
	if err := json.Unmarshal([]byte(rec.ArchiveListing), &entries); err != nil {
		s.respondError(w, http.StatusInternalServerError, "invalid listing")
		return
	}
	found := false
	for _, e := range entries {
		if e.Path == target && !e.Dir {
			found = true
			break
		}
	}
	if !found {
		s.respondError(w, http.StatusNotFound, "file not found in archive")
		return
	}

	var archivePath string
	var cleanup func()

	if ls, ok := s.storage.(*LocalStorage); ok {
		archivePath = filepath.Join(ls.baseDir, rec.StoragePath)
	} else if _, ok := s.storage.(*R2Storage); ok {
		// download to temp file
		tmp, err := os.CreateTemp("", "anonhost-archive-*")
		if err != nil {
			s.respondError(w, http.StatusInternalServerError, "temp file error")
			return
		}
		cleanup = func() { os.Remove(tmp.Name()) }
		defer tmp.Close()

		rc, _, err := s.storage.GetWithSize(r.Context(), rec.StoragePath)
		if err != nil {
			s.respondError(w, http.StatusNotFound, "storage error")
			return
		}
		if _, err := io.Copy(tmp, rc); err != nil {
			rc.Close()
			s.respondError(w, http.StatusInternalServerError, "download error")
			return
		}
		rc.Close()
		archivePath = tmp.Name()
	} else {
		s.respondError(w, http.StatusInternalServerError, "unknown storage backend")
		return
	}

	rc, size, err := extractFileFromArchive(archivePath, target)
	if err != nil {
		if cleanup != nil {
			cleanup()
		}
		s.respondError(w, http.StatusNotFound, "extraction failed")
		return
	}

	filename := path.Base(target)
	ct := mime.TypeByExtension(path.Ext(filename))
	if ct == "" {
		ct = "application/octet-stream"
	}

	w.Header().Set("Content-Type", ct)
	w.Header().Set("Content-Length", strconv.FormatInt(size, 10))
	w.Header().Set("Content-Disposition", fmt.Sprintf(`inline; filename="%s"`, filename))
	io.Copy(w, rc)
	rc.Close()
	if cleanup != nil {
		cleanup()
	}
}

func (s *Server) handleServe(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("path")
	if key == "" {
		s.respondError(w, http.StatusBadRequest, "missing path")
		return
	}

	if err := validatePath(key); err != nil {
		s.respondError(w, http.StatusBadRequest, "invalid path")
		return
	}

	file, size, err := s.storage.GetWithSize(r.Context(), key)
	if err != nil {
		s.respondError(w, http.StatusNotFound, "file not found")
		return
	}
	defer file.Close()

	ct := mime.TypeByExtension(path.Ext(key))
	if ct == "" {
		ct = "application/octet-stream"
	}

	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	w.Header().Set("X-Content-Type-Options", "nosniff")

	rangeHeader := r.Header.Get("Range")
	if rangeHeader == "" {
		w.Header().Set("Content-Type", ct)
		w.Header().Set("Content-Length", strconv.FormatInt(size, 10))
		io.CopyN(w, file, size)
		return
	}

	start, end, ok := parseRange(rangeHeader, size)
	if !ok {
		w.Header().Set("Content-Type", ct)
		w.WriteHeader(http.StatusRequestedRangeNotSatisfiable)
		fmt.Fprintf(w, "invalid range")
		return
	}

	seeker, ok := file.(io.ReadSeeker)
	if !ok {
		w.Header().Set("Content-Type", ct)
		w.WriteHeader(http.StatusOK)
		io.CopyN(w, file, size)
		return
	}

	if _, err := seeker.Seek(start, io.SeekStart); err != nil {
		w.Header().Set("Content-Type", ct)
		http.Error(w, "seek error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", ct)
	w.Header().Set("Content-Length", strconv.FormatInt(end-start+1, 10))
	w.Header().Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, size))
	w.WriteHeader(http.StatusPartialContent)
	io.CopyN(w, seeker, end-start+1)
}

func parseRange(r string, size int64) (start, end int64, ok bool) {
	if !strings.HasPrefix(r, "bytes=") {
		return 0, 0, false
	}
	r = strings.TrimPrefix(r, "bytes=")
	parts := strings.SplitN(r, "-", 2)
	if len(parts) != 2 {
		return 0, 0, false
	}
	if parts[0] == "" {
		suffix, err := strconv.ParseInt(parts[1], 10, 64)
		if err != nil || suffix <= 0 {
			return 0, 0, false
		}
		start = size - suffix
		if start < 0 {
			start = 0
		}
		end = size - 1
		return start, end, true
	}
	start, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil || start < 0 || start >= size {
		return 0, 0, false
	}
	if parts[1] == "" {
		end = size - 1
	} else {
		end, err = strconv.ParseInt(parts[1], 10, 64)
		if err != nil || end < start || end >= size {
			return 0, 0, false
		}
	}
	return start, end, true
}

func (s *Server) handleDelete(w http.ResponseWriter, r *http.Request) {
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

	token := r.URL.Query().Get("token")
	if token == "" {
		s.respondError(w, http.StatusBadRequest, "deletion token required")
		return
	}

	if subtle.ConstantTimeCompare([]byte(token), []byte(rec.DeletionToken)) != 1 {
		s.respondError(w, http.StatusForbidden, "invalid deletion token")
		return
	}

	s.storage.Delete(r.Context(), rec.StoragePath)
	s.db.DeleteFile(id)

	s.respondJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

func (s *Server) handleStats(w http.ResponseWriter, r *http.Request) {
	count, _ := s.db.Count()
	totalSize, _ := s.db.TotalSize()

	s.respondJSON(w, http.StatusOK, map[string]any{
		"total_uploads":  count,
		"total_size":     totalSize,
	})
}

func (s *Server) handleHomePage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	count, _ := s.db.Count()
	totalSize, _ := s.db.TotalSize()
	s.views.ExecuteTemplate(w, "home", map[string]any{
		"BaseURL":          strings.TrimRight(s.cfg.PublicURL, "/"),
		"MaxFileSizeHuman": formatSize(s.cfg.MaxFileSize),
		"TotalUploads":     count,
		"TotalSize":        totalSize,
		"TotalSizeHuman":   formatSize(totalSize),
	})
}

func (s *Server) handleUploadPage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	count, _ := s.db.Count()
	totalSize, _ := s.db.TotalSize()
	s.views.ExecuteTemplate(w, "upload", map[string]any{
		"MaxFileSize":      s.cfg.MaxFileSize,
		"MaxFileSizeHuman": formatSize(s.cfg.MaxFileSize),
		"BaseURL":          strings.TrimRight(s.cfg.PublicURL, "/"),
		"TotalUploads":     count,
		"TotalSize":        totalSize,
		"TotalSizeHuman":   formatSize(totalSize),
	})
}

func (s *Server) handleInstallScript(w http.ResponseWriter, r *http.Request) {
	script := fmt.Sprintf(`#!/bin/bash
set -e
API_URL="%s"
`, strings.TrimRight(s.cfg.PublicURL, "/"))

	script += `
VERSION="2.0.0"

if command -v tput >/dev/null 2>&1 && tty -s; then
    RED=$(tput setaf 1); GREEN=$(tput setaf 2); BLUE=$(tput setaf 4)
    YELLOW=$(tput setaf 3); BOLD=$(tput bold); NC=$(tput sgr0)
else
    RED=""; GREEN=""; BLUE=""; YELLOW=""; BOLD=""; NC=""
fi

print_error() { printf "%sError:%s %s\n" "${RED}" "${NC}" "$1" >&2; }
print_success() { printf "%sSuccess:%s %s\n" "${GREEN}" "${NC}" "$1"; }

check_deps() {
    local missing=()
    command -v curl >/dev/null 2>&1 || missing+=("curl")
    command -v jq >/dev/null 2>&1 || missing+=("jq")
    if ((${#missing[@]} > 0)); then
        print_error "Missing dependencies: ${missing[*]}"; exit 1
    fi
}

upload_file() {
    local file="$1"
    if [[ ! -f "$file" ]]; then print_error "File not found: $file"; return 1; fi

    echo "Uploading $(basename "$file")..."

    local resp=$(curl -sf -w "\n%{http_code}" -X POST "$API_URL/api/upload" \
        -F "file=@$file")
    local code=$(tail -n1 <<< "$resp")
    local body=$(sed '$ d' <<< "$resp")

    if [[ "$code" != "200" ]]; then
        print_error "Upload failed (HTTP $code)"
        jq -r '.error // "unknown error"' <<< "$body" 2>/dev/null || true
        return 1
    fi

    local url=$(jq -r '.url // "N/A"' <<< "$body")
    local id=$(jq -r '.id // "N/A"' <<< "$body")
    local token=$(jq -r '.deletion_token // ""' <<< "$body")

    printf "%s\n" "$url" | { command -v wl-copy >/dev/null 2>&1 && wl-copy || command -v xclip >/dev/null 2>&1 && xclip -selection clipboard || cat; } 2>/dev/null
    print_success "Uploaded: $url"
    echo "ID: $id"
    [[ -n "$token" ]] && echo "Delete token: $token"
    echo "Delete URL: $API_URL/api/media/$id?token=$token"
}

delete_file() {
    local id="$1"; local token="$2"
    if [[ -z "$id" || -z "$token" ]]; then
        print_error "Usage: $SCRIPT_NAME delete <id> <token>"; exit 1
    fi
    curl -sf -X DELETE "$API_URL/api/media/$id?token=$token" | jq . || print_error "Delete failed"
}

usage() {
    echo "AnonHost CLI v$VERSION"
    echo "Usage: $SCRIPT_NAME <command> [options]"
    echo ""
    echo "Commands:"
    echo "  upload <file>             Upload a file"
    echo "  delete <id> <token>       Delete a file by ID and deletion token"
    echo "  help                      Show this help"
    echo ""
    echo "Environment:"
    echo "  API_URL                   API base URL (default: $API_URL)"
}

main() {
    check_deps
    local cmd="${1:-help}"; shift || true
    case "$cmd" in
        upload) upload_file "$@" ;;
        delete) delete_file "$@" ;;
        help|--help|-h) usage ;;
        *) print_error "Unknown command: $cmd"; usage; exit 1 ;;
    esac
}

main "$@"
`

	w.Header().Set("Content-Type", "text/x-shellscript; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="anonhost.sh"`)
	w.Write([]byte(script))
}

func (s *Server) handleCronCleanup(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		s.respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	count, err := s.db.CleanupExpired()
	if err != nil {
		log.Printf("cleanup error: %v", err)
		s.respondError(w, http.StatusInternalServerError, "cleanup failed")
		return
	}

	s.respondJSON(w, http.StatusOK, map[string]any{
		"deleted": count,
	})
}

func (s *Server) readArchiveListing(ctx context.Context, storagePath string) ([]FileEntry, string, error) {
	tmp, err := os.CreateTemp("", "anonhost-archive-*")
	if err != nil {
		return nil, "", err
	}
	defer os.Remove(tmp.Name())
	defer tmp.Close()

	rc, _, err := s.storage.GetWithSize(ctx, storagePath)
	if err != nil {
		return nil, "", err
	}
	defer rc.Close()

	if _, err := io.Copy(tmp, rc); err != nil {
		return nil, "", err
	}
	tmp.Close()

	return listArchive(tmp.Name())
}

func formatSize(b int64) string {
	if b >= 1073741824 {
		return fmt.Sprintf("%.1fGB", float64(b)/1073741824)
	}
	if b >= 1048576 {
		return fmt.Sprintf("%.1fMB", float64(b)/1048576)
	}
	if b >= 1024 {
		return fmt.Sprintf("%.1fKB", float64(b)/1024)
	}
	return fmt.Sprintf("%dB", b)
}

func extractIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	addr := r.RemoteAddr
	if idx := strings.LastIndex(addr, ":"); idx != -1 {
		return addr[:idx]
	}
	return addr
}

type RateLimiter struct {
	limit    int
	window   time.Duration
	requests map[string]*rateEntry
}

type rateEntry struct {
	count    int
	resetAt  time.Time
}

func NewRateLimiter(limit int) *RateLimiter {
	rl := &RateLimiter{
		limit:    limit,
		window:   time.Minute,
		requests: make(map[string]*rateEntry),
	}
	go rl.cleanup()
	return rl
}

func (rl *RateLimiter) Allow(key string) bool {
	rl.cleanup()
	now := time.Now()

	entry, ok := rl.requests[key]
	if !ok || now.After(entry.resetAt) {
		rl.requests[key] = &rateEntry{count: 1, resetAt: now.Add(rl.window)}
		return true
	}

	if entry.count >= rl.limit {
		return false
	}

	entry.count++
	return true
}

func (rl *RateLimiter) cleanup() {
	now := time.Now()
	for k, v := range rl.requests {
		if now.After(v.resetAt) {
			delete(rl.requests, k)
		}
	}
}

func isPlayableVideo(mimeType string) bool {
	switch mimeType {
	case "video/mp4", "video/webm", "video/ogg":
		return true
	}
	return false
}

func isPlayableAudio(mimeType string) bool {
	switch mimeType {
	case "audio/mpeg", "audio/ogg", "audio/wav", "audio/wave", "audio/flac", "audio/aac", "audio/mp4":
		return true
	}
	return false
}
