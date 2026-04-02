package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type writeResult struct {
	UploadedChunks    int  `json:"uploadedChunks"`
	AllChunksUploaded bool `json:"allChunksUploaded"`
}

type assembleResult struct {
	OutputPath string `json:"outputPath"`
	Size       int64  `json:"size"`
}

func main() {
	if len(os.Args) < 2 {
		fail("missing command")
	}

	cmd := os.Args[1]
	switch cmd {
	case "write":
		if err := runWrite(os.Args[2:]); err != nil {
			fail(err.Error())
		}
	case "assemble":
		if err := runAssemble(os.Args[2:]); err != nil {
			fail(err.Error())
		}
	case "cleanup":
		if err := runCleanup(os.Args[2:]); err != nil {
			fail(err.Error())
		}
	default:
		fail("unknown command")
	}
}

func runWrite(args []string) error {
	fs := flag.NewFlagSet("write", flag.ContinueOnError)
	dir := fs.String("dir", "", "chunk directory")
	fileID := fs.String("file-id", "", "file id")
	chunkIndex := fs.Int("chunk-index", -1, "chunk index")
	totalChunks := fs.Int("total-chunks", 0, "total chunks")
	if err := fs.Parse(args); err != nil {
		return err
	}

	if *dir == "" || *fileID == "" || *chunkIndex < 0 || *totalChunks <= 0 {
		return errors.New("invalid write arguments")
	}

	if err := os.MkdirAll(*dir, 0o755); err != nil {
		return err
	}

	targetPath := filepath.Join(*dir, fmt.Sprintf("%s_%d", *fileID, *chunkIndex))
	tmpPath := targetPath + ".tmp"

	tmpFile, err := os.Create(tmpPath)
	if err != nil {
		return err
	}

	written, copyErr := io.Copy(tmpFile, os.Stdin)
	closeErr := tmpFile.Close()
	if copyErr != nil {
		_ = os.Remove(tmpPath)
		return copyErr
	}
	if closeErr != nil {
		_ = os.Remove(tmpPath)
		return closeErr
	}
	if written == 0 {
		_ = os.Remove(tmpPath)
		return errors.New("empty chunk received")
	}

	if err := os.Rename(tmpPath, targetPath); err != nil {
		_ = os.Remove(tmpPath)
		return err
	}

	uploaded := 0
	for i := 0; i < *totalChunks; i++ {
		chunkPath := filepath.Join(*dir, fmt.Sprintf("%s_%d", *fileID, i))
		if _, err := os.Stat(chunkPath); err == nil {
			uploaded++
		}
	}

	return printJSON(writeResult{
		UploadedChunks:    uploaded,
		AllChunksUploaded: uploaded == *totalChunks,
	})
}

func runAssemble(args []string) error {
	fs := flag.NewFlagSet("assemble", flag.ContinueOnError)
	dir := fs.String("dir", "", "chunk directory")
	fileID := fs.String("file-id", "", "file id")
	totalChunks := fs.Int("total-chunks", 0, "total chunks")
	output := fs.String("output", "", "output path")
	if err := fs.Parse(args); err != nil {
		return err
	}

	if *dir == "" || *fileID == "" || *totalChunks <= 0 || *output == "" {
		return errors.New("invalid assemble arguments")
	}

	outputDir := filepath.Dir(*output)
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		return err
	}

	outFile, err := os.Create(*output)
	if err != nil {
		return err
	}
	defer outFile.Close()

	var totalWritten int64
	for i := 0; i < *totalChunks; i++ {
		chunkPath := filepath.Join(*dir, fmt.Sprintf("%s_%d", *fileID, i))
		inFile, err := os.Open(chunkPath)
		if err != nil {
			_ = os.Remove(*output)
			return fmt.Errorf("missing chunk %d", i)
		}

		written, err := io.Copy(outFile, inFile)
		_ = inFile.Close()
		if err != nil {
			_ = os.Remove(*output)
			return err
		}
		totalWritten += written
	}

	return printJSON(assembleResult{OutputPath: *output, Size: totalWritten})
}

func runCleanup(args []string) error {
	fs := flag.NewFlagSet("cleanup", flag.ContinueOnError)
	dir := fs.String("dir", "", "chunk directory")
	fileID := fs.String("file-id", "", "file id")
	totalChunks := fs.Int("total-chunks", 0, "total chunks")
	if err := fs.Parse(args); err != nil {
		return err
	}

	if *dir == "" || *fileID == "" || *totalChunks <= 0 {
		return errors.New("invalid cleanup arguments")
	}

	for i := 0; i < *totalChunks; i++ {
		chunkPath := filepath.Join(*dir, fmt.Sprintf("%s_%d", *fileID, i))
		_ = os.Remove(chunkPath)
	}

	return nil
}

func printJSON(v any) error {
	enc := json.NewEncoder(os.Stdout)
	return enc.Encode(v)
}

func fail(msg string) {
	_, _ = fmt.Fprintln(os.Stderr, msg)
	os.Exit(1)
}
