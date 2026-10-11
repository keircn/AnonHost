package main

import (
	"database/sql"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

type FileRecord struct {
	ID              string
	Filename        string
	Size            int64
	MimeType        string
	StorageBackend  string
	StoragePath     string
	Width           *int
	Height          *int
	DeletionToken   string
	CreatedAt       string
	ExpiresAt       *string
	IsArchive       bool
	ArchiveFormat   string
	ArchiveListing  string
	IsEncrypted     bool
	ContentHash     string
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
			expires_at TEXT,
			is_archive INTEGER NOT NULL DEFAULT 0,
			archive_format TEXT NOT NULL DEFAULT '',
			archive_listing TEXT NOT NULL DEFAULT '',
			is_encrypted INTEGER NOT NULL DEFAULT 0,
			content_hash TEXT NOT NULL DEFAULT ''
		);
		CREATE INDEX IF NOT EXISTS idx_files_deletion_token ON files(deletion_token);
		CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
	`)
	if err != nil {
		return err
	}

	_, err = d.db.Exec(`
		ALTER TABLE files ADD COLUMN is_archive INTEGER NOT NULL DEFAULT 0;
		ALTER TABLE files ADD COLUMN archive_format TEXT NOT NULL DEFAULT '';
		ALTER TABLE files ADD COLUMN archive_listing TEXT NOT NULL DEFAULT '';
	`)
	if err != nil {
		// columns may already exist — ignore
	}
	_, err = d.db.Exec(`ALTER TABLE files ADD COLUMN is_encrypted INTEGER NOT NULL DEFAULT 0`)
	if err != nil {
		// column may already exist — ignore
	}
	_, _ = d.db.Exec(`ALTER TABLE files ADD COLUMN content_hash TEXT NOT NULL DEFAULT ''`)
	_, err = d.db.Exec(`CREATE INDEX IF NOT EXISTS idx_files_content_hash ON files(content_hash)`)
	if err != nil {
		return err
	}
	return nil
}

func (d *DB) InsertFile(f *FileRecord) error {
	_, err := d.db.Exec(
		`INSERT INTO files (id, filename, size, mime_type, storage_backend, storage_path, width, height, deletion_token, created_at, expires_at, is_archive, archive_format, archive_listing, is_encrypted, content_hash)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		f.ID, f.Filename, f.Size, f.MimeType, f.StorageBackend, f.StoragePath,
		f.Width, f.Height, f.DeletionToken, f.CreatedAt, f.ExpiresAt,
		f.IsArchive, f.ArchiveFormat, f.ArchiveListing,
		f.IsEncrypted, f.ContentHash,
	)
	return err
}

func (d *DB) GetFile(id string) (*FileRecord, error) {
	row := d.db.QueryRow(
		`SELECT id, filename, size, mime_type, storage_backend, storage_path, width, height, deletion_token, created_at, expires_at, is_archive, archive_format, archive_listing, is_encrypted, content_hash
		 FROM files WHERE id = ?`, id,
	)

	f := &FileRecord{}
	var width, height sql.NullInt64
	var expiresAt sql.NullString

	err := row.Scan(&f.ID, &f.Filename, &f.Size, &f.MimeType,
		&f.StorageBackend, &f.StoragePath, &width, &height,
		&f.DeletionToken, &f.CreatedAt, &expiresAt,
		&f.IsArchive, &f.ArchiveFormat, &f.ArchiveListing,
		&f.IsEncrypted, &f.ContentHash)
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
		`SELECT id, filename, size, mime_type, storage_backend, storage_path, width, height, deletion_token, created_at, expires_at, is_archive, archive_format, archive_listing, is_encrypted, content_hash
		 FROM files WHERE deletion_token = ?`, token,
	)

	f := &FileRecord{}
	var width, height sql.NullInt64
	var expiresAt sql.NullString

	err := row.Scan(&f.ID, &f.Filename, &f.Size, &f.MimeType,
		&f.StorageBackend, &f.StoragePath, &width, &height,
		&f.DeletionToken, &f.CreatedAt, &expiresAt,
		&f.IsArchive, &f.ArchiveFormat, &f.ArchiveListing,
		&f.IsEncrypted, &f.ContentHash)
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

func (d *DB) ListFiles() ([]FileRecord, error) {
	rows, err := d.db.Query(
		`SELECT id, filename, size, mime_type, storage_backend, storage_path, width, height, deletion_token, created_at, expires_at, is_archive, archive_format, archive_listing, is_encrypted, content_hash
		 FROM files ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []FileRecord
	for rows.Next() {
		var f FileRecord
		var width, height sql.NullInt64
		var expiresAt sql.NullString

		err := rows.Scan(&f.ID, &f.Filename, &f.Size, &f.MimeType,
			&f.StorageBackend, &f.StoragePath, &width, &height,
			&f.DeletionToken, &f.CreatedAt, &expiresAt,
			&f.IsArchive, &f.ArchiveFormat, &f.ArchiveListing,
			&f.IsEncrypted, &f.ContentHash)
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
		files = append(files, f)
	}
	return files, rows.Err()
}

func (d *DB) UpdateArchive(id string, isArchive bool, format, listing string) error {
	_, err := d.db.Exec(
		`UPDATE files SET is_archive = ?, archive_format = ?, archive_listing = ? WHERE id = ?`,
		isArchive, format, listing, id,
	)
	return err
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

func (d *DB) ListExpired(now string) ([]FileRecord, error) {
	return d.listWhere(`expires_at IS NOT NULL AND expires_at <= ?`, now)
}

func (d *DB) ListOlderThan(cutoff string) ([]FileRecord, error) {
	return d.listWhere(`created_at <= ?`, cutoff)
}

func (d *DB) UpdateContentHash(id, hash string) error {
	_, err := d.db.Exec(`UPDATE files SET content_hash = ? WHERE id = ?`, hash, id)
	return err
}

func (d *DB) UpdateStoragePath(id, backend, storagePath string) error {
	_, err := d.db.Exec(`UPDATE files SET storage_backend = ?, storage_path = ? WHERE id = ?`,
		backend, storagePath, id)
	return err
}

func (d *DB) CountByStoragePath(storagePath string) (int, error) {
	var n int
	err := d.db.QueryRow(`SELECT COUNT(*) FROM files WHERE storage_path = ?`, storagePath).Scan(&n)
	return n, err
}

func (d *DB) ListUnhashedPlaintext(limit int) ([]FileRecord, error) {
	query := `SELECT id, filename, size, mime_type, storage_backend, storage_path, width, height, deletion_token, created_at, expires_at, is_archive, archive_format, archive_listing, is_encrypted, content_hash
		 FROM files WHERE is_encrypted = 0 AND (content_hash IS NULL OR content_hash = '')
		 ORDER BY size ASC, created_at ASC`
	var rows *sql.Rows
	var err error
	if limit > 0 {
		query += ` LIMIT ?`
		rows, err = d.db.Query(query, limit)
	} else {
		rows, err = d.db.Query(query)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []FileRecord
	for rows.Next() {
		var f FileRecord
		var width, height sql.NullInt64
		var expiresAt sql.NullString

		if err := rows.Scan(&f.ID, &f.Filename, &f.Size, &f.MimeType,
			&f.StorageBackend, &f.StoragePath, &width, &height,
			&f.DeletionToken, &f.CreatedAt, &expiresAt,
			&f.IsArchive, &f.ArchiveFormat, &f.ArchiveListing,
			&f.IsEncrypted, &f.ContentHash); err != nil {
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
		files = append(files, f)
	}
	return files, rows.Err()
}

func (d *DB) CountUnhashedPlaintext() (int, error) {
	var n int
	err := d.db.QueryRow(`SELECT COUNT(*) FROM files WHERE is_encrypted = 0 AND (content_hash IS NULL OR content_hash = '')`).Scan(&n)
	return n, err
}

func (d *DB) DuplicateHashes() ([]string, error) {
	rows, err := d.db.Query(
		`SELECT content_hash FROM files
		 WHERE content_hash IS NOT NULL AND content_hash != ''
		 GROUP BY content_hash HAVING COUNT(*) > 1`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []string
	for rows.Next() {
		var h string
		if err := rows.Scan(&h); err != nil {
			return nil, err
		}
		out = append(out, h)
	}
	return out, rows.Err()
}

func (d *DB) ListByContentHash(hash string) ([]FileRecord, error) {
	return d.listWhere(`content_hash = ?`, hash)
}

func (d *DB) listWhere(where string, args ...any) ([]FileRecord, error) {
	rows, err := d.db.Query(
		`SELECT id, filename, size, mime_type, storage_backend, storage_path, width, height, deletion_token, created_at, expires_at, is_archive, archive_format, archive_listing, is_encrypted, content_hash
		 FROM files WHERE `+where+` ORDER BY created_at ASC`,
		args...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []FileRecord
	for rows.Next() {
		var f FileRecord
		var width, height sql.NullInt64
		var expiresAt sql.NullString

		err := rows.Scan(&f.ID, &f.Filename, &f.Size, &f.MimeType,
			&f.StorageBackend, &f.StoragePath, &width, &height,
			&f.DeletionToken, &f.CreatedAt, &expiresAt,
			&f.IsArchive, &f.ArchiveFormat, &f.ArchiveListing,
			&f.IsEncrypted, &f.ContentHash)
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
		files = append(files, f)
	}
	return files, rows.Err()
}
