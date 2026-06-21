package main

import (
	"log"
	"os"
)

func main() {
	cfg := LoadConfig()

	db, err := OpenDB(cfg.DBPath)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer db.Close()

	var storage Storage
	if cfg.R2Configured() {
		r2, err := NewR2Storage(cfg)
		if err != nil {
			log.Fatalf("r2 storage: %v", err)
		}
		storage = r2
		log.Println("using R2 storage")
	} else {
		storage = NewLocalStorage(cfg.UploadDir, cfg.PublicURL)
		log.Println("using local storage")
	}

	if err := RunServer(cfg, db, storage); err != nil {
		log.Fatal(err)
		os.Exit(1)
	}
}
