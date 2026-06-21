package main

import (
	"os"
	"strconv"
)

type Config struct {
	Bind        string
	PublicURL   string
	DBPath      string
	UploadDir   string
	MaxFileSize int64

	R2AccountID       string
	R2AccessKeyID     string
	R2SecretAccessKey string
	R2BucketName      string
	R2PublicURL       string

	RateLimit int
}

func LoadConfig() *Config {
	cfg := &Config{
		Bind:        getEnv("ANONHOST_BIND", ":1984"),
		PublicURL:   getEnv("ANONHOST_URL", "http://localhost:1984"),
		DBPath:      getEnv("ANONHOST_DB_PATH", "/app/data/anonhost.db"),
		UploadDir:   getEnv("ANONHOST_UPLOAD_DIR", "/app/uploads"),
		MaxFileSize: getEnvInt64("ANONHOST_MAX_FILE_SIZE", 1073741824),
		R2AccountID:       os.Getenv("R2_ACCOUNT_ID"),
		R2AccessKeyID:     os.Getenv("R2_ACCESS_KEY_ID"),
		R2SecretAccessKey: os.Getenv("R2_SECRET_ACCESS_KEY"),
		R2BucketName:      os.Getenv("R2_BUCKET_NAME"),
		R2PublicURL:       os.Getenv("R2_PUBLIC_URL"),
		RateLimit:  getEnvInt("ANONHOST_RATE_LIMIT", 5),
	}
	return cfg
}

func (c *Config) R2Configured() bool {
	return c.R2AccountID != "" && c.R2AccessKeyID != "" &&
		c.R2SecretAccessKey != "" && c.R2BucketName != "" && c.R2PublicURL != ""
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}

func getEnvInt64(key string, fallback int64) int64 {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil {
			return n
		}
	}
	return fallback
}
