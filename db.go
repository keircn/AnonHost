package main

import (
	"database/sql"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

type FileRecord struct {
	ID             string
	Filename       string
	Size           int64
	MimeType       string
	StorageBackend string
	StoragePath    string
	Width          *int
	Height         *int
	DeletionToken  string
	CreatedAt      string
	ExpiresAt      *string
}

type DB struct {
	db *sql.DB
}

func OpenDB(path string) (*DB, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return nil, err
	}

	db, err := sql.Open("sqlite", path+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	d := &DB{db: db}
	if err := d.migrate(); err != nil {
		return nil, err
	}

	return d, nil
}

func (d *DB) Close() error {
	return d.db.Close()
}

func (d *DB) migrate() error {
	_, err := d.db.Exec(`
		CREATE TABLE IF NOT EXISTS files (
			id TEXT PRIMARY KEY,
			filename TEXT NOT NULL,
			size INTEGER NOT NULL,
			mime_type TEXT NOT NULL,
			storage_backend TEXT NOT NULL,
			storage_path TEXT NOT NULL,
			width INTEGER,
			height INTEGER,
			deletion_token TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			expires_at TEXT
		);
		CREATE INDEX IF NOT EXISTS idx_files_deletion_token ON files(deletion_token);
		CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
	`)
	return err
}

func (d *DB) InsertFile(f *FileRecord) error {
	_, err := d.db.Exec(
		`INSERT INTO files (id, filename, size, mime_type, storage_backend, storage_path, width, height, deletion_token, created_at, expires_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		f.ID, f.Filename, f.Size, f.MimeType, f.StorageBackend, f.StoragePath,
		f.Width, f.Height, f.DeletionToken, f.CreatedAt, f.ExpiresAt,
	)
	return err
}

func (d *DB) GetFile(id string) (*FileRecord, error) {
	row := d.db.QueryRow(
		`SELECT id, filename, size, mime_type, storage_backend, storage_path, width, height, deletion_token, created_at, expires_at
		 FROM files WHERE id = ?`, id,
	)

	f := &FileRecord{}
	var width, height sql.NullInt64
	var expiresAt sql.NullString

	err := row.Scan(&f.ID, &f.Filename, &f.Size, &f.MimeType,
		&f.StorageBackend, &f.StoragePath, &width, &height,
		&f.DeletionToken, &f.CreatedAt, &expiresAt)
	if err != nil {
		return nil, err
	}

	if width.Valid {
		v := int(width.Int64)
		f.Width = &v
	}
	if height.Valid {
		v := int(height.Int64)
		f.Height = &v
	}
	if expiresAt.Valid {
		f.ExpiresAt = &expiresAt.String
	}
	return f, nil
}

func (d *DB) GetFileByDeletionToken(token string) (*FileRecord, error) {
	row := d.db.QueryRow(
		`SELECT id, filename, size, mime_type, storage_backend, storage_path, width, height, deletion_token, created_at, expires_at
		 FROM files WHERE deletion_token = ?`, token,
	)

	f := &FileRecord{}
	var width, height sql.NullInt64
	var expiresAt sql.NullString

	err := row.Scan(&f.ID, &f.Filename, &f.Size, &f.MimeType,
		&f.StorageBackend, &f.StoragePath, &width, &height,
		&f.DeletionToken, &f.CreatedAt, &expiresAt)
	if err != nil {
		return nil, err
	}

	if width.Valid {
		v := int(width.Int64)
		f.Width = &v
	}
	if height.Valid {
		v := int(height.Int64)
		f.Height = &v
	}
	if expiresAt.Valid {
		f.ExpiresAt = &expiresAt.String
	}
	return f, nil
}

func (d *DB) DeleteFile(id string) error {
	_, err := d.db.Exec(`DELETE FROM files WHERE id = ?`, id)
	return err
}

func (d *DB) Count() (int, error) {
	var count int
	err := d.db.QueryRow(`SELECT COUNT(*) FROM files`).Scan(&count)
	return count, err
}

func (d *DB) TotalSize() (int64, error) {
	var total int64
	err := d.db.QueryRow(`SELECT COALESCE(SUM(size), 0) FROM files`).Scan(&total)
	return total, err
}

func (d *DB) CleanupExpired() (int64, error) {
	now := time.Now().UTC().Format(time.RFC3339)
	result, err := d.db.Exec(`DELETE FROM files WHERE expires_at IS NOT NULL AND expires_at <= ?`, now)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}
