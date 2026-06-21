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

	ext := strings.ToLower(path.Ext(filePath))
	var opener archiveOpener

	if ext == ".gz" || ext == ".bz2" {
		base := strings.TrimSuffix(filePath, ext)
		innerExt := strings.ToLower(path.Ext(base))
		if innerExt == ".tar" {
			if ext == ".gz" {
				opener = openTarGzip
			} else {
				return nil, "", fmt.Errorf("unsupported archive format: %s", ext)
			}
		} else {
			return nil, "", fmt.Errorf("unsupported archive format: %s", ext)
		}
	} else {
		var ok bool
		opener, ok = archiveFormats[ext]
		if !ok {
			return nil, "", fmt.Errorf("unsupported archive format: %s", ext)
		}
	}

	entries, err := opener(f, fi.Size())
	if err != nil {
		return nil, "", err
	}

	return entries, ext, nil
}

func extractFileFromArchive(archivePath, targetPath string) (io.ReadCloser, int64, error) {
	ext := strings.ToLower(path.Ext(archivePath))

	if ext == ".zip" {
		return extractFromZip(archivePath, targetPath)
	}

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

func archiveListingJSON(entries []FileEntry) string {
	data, _ := json.Marshal(entries)
	return string(data)
}
