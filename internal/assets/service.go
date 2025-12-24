package assets

import (
	"context"
	"io"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, a *Asset) error
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
	fs        FileStorage
	assetsDir string
}

func NewService(repo Repository, fs FileStorage, assetsDir string) *Service {
	return &Service{repo: repo, fs: fs, assetsDir: assetsDir}
}

func (s *Service) Upload(ctx context.Context, req UploadRequest) (*Asset, error) {
	id := uuid.New().String()
	ext := filepath.Ext(req.Filename)
	fileType := DetermineFileType(req.Filename)
	storagePath := GeneratePath(s.assetsDir, fileType, id, ext)

	if err := s.fs.Write(storagePath, req.File); err != nil {
		return nil, err
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
		s.fs.Delete(storagePath)
		return nil, err
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
	if err := s.fs.Delete(asset.StoragePath); err != nil {
		// log error but continue
	}
	return s.repo.Delete(ctx, id)
}
