package assets

import (
	"context"
	"fmt"
	"io"
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
	assetsDir string
}

func NewService(repo Repository, storage FileStorage, assetsDir string) *Service {
	return &Service{
		repo:      repo,
		storage:   storage,
		assetsDir: assetsDir,
	}
}

type UploadRequest struct {
	File     io.Reader
	Filename string
	Size     int64
}

func (s *Service) Upload(ctx context.Context, req UploadRequest) (*Asset, error) {
	id := uuid.New().String()
	ext := strings.ToLower(filepath.Ext(req.Filename))
	fileType := determineFileType(ext)

	storagePath := filepath.Join(s.assetsDir, id+ext)

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
		// Log error but continue to delete metadata
	}

	return s.repo.Delete(ctx, id)
}

func (s *Service) Get(ctx context.Context, id string) (*Asset, error) {
	return s.repo.Get(ctx, id)
}

func determineFileType(ext string) FileType {
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg":
		return FileTypeImage
	case ".mp4", ".mov", ".webm":
		return FileTypeVideo
	case ".mp3", ".wav", ".ogg":
		return FileTypeAudio
	case ".pdf", ".doc", ".docx", ".txt":
		return FileTypeDocument
	default:
		return FileTypeOther
	}
}
