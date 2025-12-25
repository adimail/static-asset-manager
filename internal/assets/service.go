package assets

import (
	"context"
	"fmt"
	"io"
	"log"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, asset *Asset) error
	List(ctx context.Context) ([]*Asset, error)
	Delete(ctx context.Context, id string) error
	Get(ctx context.Context, id string) (*Asset, error)
}

type FileStorage interface {
	Write(path string, data io.Reader) error
	Delete(path string) error
}

type Service struct {
	repo      Repository
	storage   FileStorage
	validator *Validator
	assetsDir string
}

func NewService(repo Repository, storage FileStorage, validator *Validator, assetsDir string) *Service {
	return &Service{
		repo:      repo,
		storage:   storage,
		validator: validator,
		assetsDir: assetsDir,
	}
}

func (s *Service) Upload(ctx context.Context, req UploadRequest) (*Asset, error) {
	if err := s.validator.Validate(req); err != nil {
		return nil, err
	}

	id := uuid.New().String()
	ext := strings.ToLower(filepath.Ext(req.Filename))
	fileType := s.determineFileType(ext)

	relativePath := filepath.Join(string(fileType), id+ext)
	storagePath := filepath.Join(s.assetsDir, relativePath)

	if err := s.storage.Write(storagePath, req.File); err != nil {
		return nil, fmt.Errorf("failed to write file: %w", err)
	}

	asset := &Asset{
		ID:               id,
		OriginalFilename: req.Filename,
		FileType:         fileType,
		Extension:        ext,
		FileSizeBytes:    req.Size,
		StoragePath:      storagePath,
		CreatedAt:        time.Now(),
	}

	if err := s.repo.Create(ctx, asset); err != nil {
		s.storage.Delete(storagePath)
		return nil, fmt.Errorf("failed to save metadata: %w", err)
	}

	return asset, nil
}

func (s *Service) List(ctx context.Context) ([]*Asset, error) {
	return s.repo.List(ctx)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	asset, err := s.repo.Get(ctx, id)
	if err != nil {
		return err
	}

	if err := s.storage.Delete(asset.StoragePath); err != nil {
		log.Printf("failed to delete file from storage: %s, error: %v", asset.StoragePath, err)
	}

	return s.repo.Delete(ctx, id)
}

func (s *Service) Get(ctx context.Context, id string) (*Asset, error) {
	return s.repo.Get(ctx, id)
}

func (s *Service) determineFileType(ext string) FileType {
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg":
		return FileTypeImage
	case ".mp4", ".mov", ".webm", ".avi", ".mkv":
		return FileTypeVideo
	case ".mp3", ".wav", ".ogg", ".flac":
		return FileTypeAudio
	case ".pdf", ".doc", ".docx", ".txt", ".xls", ".xlsx":
		return FileTypeDocument
	default:
		return FileTypeOther
	}
}
