package main

import (
	"context"
	"fmt"
	"io"
	"mime"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Storage interface {
	Save(ctx context.Context, key string, file io.Reader, size int64, contentType string) error
	Get(ctx context.Context, key string) (io.ReadCloser, error)
	Delete(ctx context.Context, key string) error
	URL(key string) string
}

type LocalStorage struct {
	baseDir   string
	publicURL string
}

func NewLocalStorage(baseDir, publicURL string) *LocalStorage {
	os.MkdirAll(baseDir, 0755)
	return &LocalStorage{baseDir: baseDir, publicURL: strings.TrimRight(publicURL, "/")}
}

func (s *LocalStorage) Save(_ context.Context, key string, file io.Reader, _ int64, _ string) error {
	fullPath := filepath.Join(s.baseDir, key)
	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return err
	}
	f, err := os.Create(fullPath)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = io.Copy(f, file)
	return err
}

func (s *LocalStorage) Get(_ context.Context, key string) (io.ReadCloser, error) {
	return os.Open(filepath.Join(s.baseDir, key))
}

func (s *LocalStorage) Delete(_ context.Context, key string) error {
	return os.Remove(filepath.Join(s.baseDir, key))
}

func (s *LocalStorage) URL(key string) string {
	return fmt.Sprintf("%s/api/upload/storage/%s", s.publicURL, key)
}

type R2Storage struct {
	client    *s3.Client
	bucket    string
	publicURL string
}

func NewR2Storage(cfg *Config) (*R2Storage, error) {
	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.R2AccountID)

	awsCfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithRegion("auto"),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			cfg.R2AccessKeyID, cfg.R2SecretAccessKey, "",
		)),
	)
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.UsePathStyle = true
	})

	return &R2Storage{
		client:    client,
		bucket:    cfg.R2BucketName,
		publicURL: strings.TrimRight(cfg.R2PublicURL, "/"),
	}, nil
}

func (s *R2Storage) Save(ctx context.Context, key string, file io.Reader, size int64, contentType string) error {
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		Body:        file,
		ContentType: aws.String(contentType),
	})
	return err
}

func (s *R2Storage) Get(ctx context.Context, key string) (io.ReadCloser, error) {
	out, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}
	return out.Body, nil
}

func (s *R2Storage) Delete(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	return err
}

func (s *R2Storage) PresignedPutURL(ctx context.Context, key, contentType string) (string, error) {
	presignClient := s3.NewPresignClient(s.client)
	req, err := presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = 15 * time.Minute
	})
	if err != nil {
		return "", err
	}
	return req.URL, nil
}

func (s *R2Storage) VerifyObject(ctx context.Context, key string) (bool, error) {
	_, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return false, nil
	}
	return true, nil
}

func (s *R2Storage) URL(key string) string {
	return fmt.Sprintf("%s/%s", s.publicURL, key)
}

func fileExtension(filename, mimeType string) string {
	ext := path.Ext(filename)
	if ext != "" {
		return ext
	}
	exts, _ := mime.ExtensionsByType(mimeType)
	if len(exts) > 0 {
		return exts[0]
	}
	return ""
}

func storageKey(id, filename, mimeType string) string {
	return id + fileExtension(filename, mimeType)
}

func validatePath(key string) error {
	decoded, err := url.QueryUnescape(key)
	if err != nil {
		return err
	}
	clean := path.Clean(decoded)
	if strings.Contains(clean, "..") || strings.HasPrefix(clean, "/") || strings.HasPrefix(clean, "~") {
		return fmt.Errorf("invalid path")
	}
	return nil
}
