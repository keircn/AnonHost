package main

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path"
	"strings"

	"github.com/bodgit/sevenzip"
)

type FileEntry struct {
	Path string `json:"path"`
	Size int64  `json:"size"`
	Dir  bool   `json:"dir"`
}

type archiveOpener func(r io.ReaderAt, size int64) ([]FileEntry, error)

var archiveFormats = map[string]archiveOpener{
	".zip":    openZip,
	".tar":    openTar,
	".tar.gz": openTarGzip,
	".tgz":    openTarGzip,
	".7z":     open7z,
}

func isArchive(filename string) bool {
	if filename == "" {
		return false
	}
	ext := strings.ToLower(path.Ext(filename))
	if ext == ".gz" || ext == ".bz2" {
		base := strings.TrimSuffix(strings.ToLower(filename), ext)
		inner := path.Ext(base)
		if inner == ".tar" {
			return true
		}
	}
	_, ok := archiveFormats[ext]
	return ok
}

func openZip(r io.ReaderAt, size int64) ([]FileEntry, error) {
	zr, err := zip.NewReader(r, size)
	if err != nil {
		return nil, err
	}
	var entries []FileEntry
	for _, f := range zr.File {
		entries = append(entries, FileEntry{
			Path: f.Name,
			Size: int64(f.UncompressedSize64),
			Dir:  f.FileInfo().IsDir(),
		})
	}
	return entries, nil
}

func openTar(r io.ReaderAt, size int64) ([]FileEntry, error) {
	section := io.NewSectionReader(r, 0, size)
	return readTar(section)
}

func readTar(r io.Reader) ([]FileEntry, error) {
	tr := tar.NewReader(r)
	var entries []FileEntry
	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		entries = append(entries, FileEntry{
			Path: hdr.Name,
			Size: hdr.Size,
			Dir:  hdr.FileInfo().IsDir(),
		})
	}
	return entries, nil
}

func openTarGzip(r io.ReaderAt, size int64) ([]FileEntry, error) {
	section := io.NewSectionReader(r, 0, size)
	gr, err := gzip.NewReader(section)
	if err != nil {
		return nil, err
	}
	defer gr.Close()
	return readTar(gr)
}

func open7z(r io.ReaderAt, size int64) ([]FileEntry, error) {
	sr := io.NewSectionReader(r, 0, size)
	zr, err := sevenzip.NewReader(sr, size)
	if err != nil {
		return nil, err
	}
	var entries []FileEntry
	for _, f := range zr.File {
		entries = append(entries, FileEntry{
			Path: f.Name,
			Size: int64(f.UncompressedSize),
			Dir:  f.FileInfo().IsDir(),
		})
	}
	return entries, nil
}

func sniffArchiveFormat(header []byte) string {
	if len(header) < 2 {
		return ""
	}
	if len(header) >= 6 &&
		header[0] == 0x37 && header[1] == 0x7a &&
		header[2] == 0xbc && header[3] == 0xaf &&
		header[4] == 0x27 && header[5] == 0x1c {
		return ".7z"
	}
	if len(header) >= 4 &&
		header[0] == 'P' && header[1] == 'K' &&
		header[2] == 0x03 && header[3] == 0x04 {
		return ".zip"
	}
	if header[0] == 0x1f && header[1] == 0x8b {
		return ".gz"
	}
	if header[0] == 'B' && header[1] == 'Z' {
		return ".bz2"
	}
	return ""
}

func listArchive(filePath string) ([]FileEntry, string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, "", err
	}
	defer f.Close()

	fi, err := f.Stat()
	if err != nil {
		return nil, "", err
	}

	ext, opener, err := resolveArchiveFormat(f, fi.Size(), filePath)
	if err != nil {
		return nil, "", err
	}

	entries, err := opener(f, fi.Size())
	if err != nil {
		return nil, "", err
	}

	return entries, ext, nil
}

func resolveArchiveFormat(r io.ReaderAt, size int64, filePath string) (string, archiveOpener, error) {
	header := make([]byte, 16)
	if _, err := r.ReadAt(header, 0); err == nil {
		if sniffed := sniffArchiveFormat(header); sniffed != "" {
			switch sniffed {
			case ".7z":
				return ".7z", open7z, nil
			case ".zip":
				return ".zip", openZip, nil
			case ".gz":
				ext := strings.ToLower(path.Ext(filePath))
				if ext == ".tgz" {
					return ".tgz", openTarGzip, nil
				}
				if ext == ".gz" {
					base := strings.TrimSuffix(strings.ToLower(filePath), ".gz")
					if strings.ToLower(path.Ext(base)) == ".tar" {
						return ".tar.gz", openTarGzip, nil
					}
				}
			case ".bz2":
				base := strings.TrimSuffix(strings.ToLower(filePath), ".bz2")
				if strings.ToLower(path.Ext(base)) == ".tar" {
					return "", nil, fmt.Errorf("unsupported archive format: .bz2")
				}
			}
		}
	}

	ext := strings.ToLower(path.Ext(filePath))

	if ext == ".gz" || ext == ".bz2" {
		base := strings.TrimSuffix(filePath, ext)
		innerExt := strings.ToLower(path.Ext(base))
		if innerExt == ".tar" {
			if ext == ".gz" {
				return ".tar.gz", openTarGzip, nil
			}
			return "", nil, fmt.Errorf("unsupported archive format: %s", ext)
		}
		return "", nil, fmt.Errorf("unsupported archive format: %s", ext)
	}

	opener, ok := archiveFormats[ext]
	if !ok {
		return "", nil, fmt.Errorf("unsupported archive format: %s", ext)
	}
	return ext, opener, nil
}

func extractFileFromArchive(archivePath, targetPath string) (io.ReadCloser, int64, error) {
	header := make([]byte, 16)
	if f, err := os.Open(archivePath); err == nil {
		f.Read(header)
		f.Close()
	}

	switch sniffArchiveFormat(header) {
	case ".zip":
		return extractFromZip(archivePath, targetPath)
	case ".7z":
		return extractFrom7z(archivePath, targetPath)
	case ".gz":
		// Fall through to tar/gzip path below
	}

	ext := strings.ToLower(path.Ext(archivePath))

	// tar-based formats
	var tr *tar.Reader
	var closeFn func() error
	var size int64

	f, err := os.Open(archivePath)
	if err != nil {
		return nil, 0, err
	}

	switch {
	case ext == ".tar":
		tr = tar.NewReader(f)
		closeFn = f.Close
	case ext == ".gz" || ext == ".tgz":
		gr, err := gzip.NewReader(f)
		if err != nil {
			f.Close()
			return nil, 0, err
		}
		tr = tar.NewReader(gr)
		closeFn = func() error {
			gr.Close()
			return f.Close()
		}
	default:
		f.Close()
		return nil, 0, fmt.Errorf("unsupported archive format: %s", ext)
	}

	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			closeFn()
			return nil, 0, err
		}
		if hdr.Name == targetPath {
			size = hdr.Size
			rc := &readCloser{
				Reader:  tr,
				closeFn: closeFn,
			}
			return rc, size, nil
		}
	}

	closeFn()
	return nil, 0, os.ErrNotExist
}

type readCloser struct {
	io.Reader
	closeFn func() error
}

func (r *readCloser) Close() error {
	return r.closeFn()
}

func extractFromZip(zipPath, targetPath string) (io.ReadCloser, int64, error) {
	zr, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, 0, err
	}

	for _, f := range zr.File {
		if f.Name == targetPath {
			rc, err := f.Open()
			if err != nil {
				zr.Close()
				return nil, 0, err
			}
			return &zipReadCloser{rc: rc, zr: zr}, int64(f.UncompressedSize64), nil
		}
	}

	zr.Close()
	return nil, 0, os.ErrNotExist
}

type zipReadCloser struct {
	rc io.ReadCloser
	zr *zip.ReadCloser
}

func (z *zipReadCloser) Read(p []byte) (int, error) {
	return z.rc.Read(p)
}

func (z *zipReadCloser) Close() error {
	z.rc.Close()
	return z.zr.Close()
}

func extractFrom7z(archivePath, targetPath string) (io.ReadCloser, int64, error) {
	zr, err := sevenzip.OpenReader(archivePath)
	if err != nil {
		return nil, 0, err
	}

	for _, f := range zr.File {
		if f.Name == targetPath {
			rc, err := f.Open()
			if err != nil {
				zr.Close()
				return nil, 0, err
			}
			return &sevenzipReadCloser{rc: rc, zr: zr}, int64(f.UncompressedSize), nil
		}
	}

	zr.Close()
	return nil, 0, os.ErrNotExist
}

type sevenzipReadCloser struct {
	rc io.ReadCloser
	zr *sevenzip.ReadCloser
}

func (z *sevenzipReadCloser) Read(p []byte) (int, error) {
	return z.rc.Read(p)
}

func (z *sevenzipReadCloser) Close() error {
	z.rc.Close()
	return z.zr.Close()
}

func archiveListingJSON(entries []FileEntry) string {
	data, _ := json.Marshal(entries)
	return string(data)
}
