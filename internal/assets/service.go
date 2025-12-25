package assets

import (
	"context"
	"fmt"
	"io"
	"log"
	"path/filepath"
	"strings"
	"time"

	"github.com/adimail/asset-manager/ent"
	"github.com/adimail/asset-manager/ent/asset"
	"github.com/google/uuid"
)

type FileStorage interface {
	Write(path string, data io.Reader) error
	Delete(path string) error
}

type Service struct {
	client    *ent.Client
	storage   FileStorage
	validator *Validator
	assetsDir string
}

func NewService(client *ent.Client, storage FileStorage, validator *Validator, assetsDir string) *Service {
	return &Service{
		client:    client,
		storage:   storage,
		validator: validator,
		assetsDir: assetsDir,
	}
}

func (s *Service) getAbsolutePath(relativePath string) string {
	abs, _ := filepath.Abs(filepath.Join(s.assetsDir, relativePath))
	return abs
}

func (s *Service) Upload(ctx context.Context, req UploadRequest) (*Asset, error) {
	if err := s.validator.Validate(req); err != nil {
		return nil, err
	}

	id := uuid.New().String()
	ext := strings.ToLower(filepath.Ext(req.Filename))
	fileType := s.determineFileType(ext)

	managedPath := s.getAbsolutePath(id + ext)

	if err := s.storage.Write(managedPath, req.File); err != nil {
		return nil, fmt.Errorf("failed to write file to managed folder: %w", err)
	}

	saved, err := s.client.Asset.Create().
		SetID(id).
		SetOriginalFilename(req.Filename).
		SetFileType(asset.FileType(fileType)).
		SetExtension(ext).
		SetFileSizeBytes(req.Size).
		SetStoragePath(managedPath).
		SetCreatedAt(time.Now()).
		Save(ctx)
	if err != nil {
		s.storage.Delete(managedPath)
		return nil, fmt.Errorf("failed to save metadata: %w", err)
	}

	return s.mapToDomain(saved), nil
}

func (s *Service) List(ctx context.Context, page, limit int) (*ListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 50
	}
	offset := (page - 1) * limit

	total, err := s.client.Asset.Query().Count(ctx)
	if err != nil {
		return nil, err
	}

	list, err := s.client.Asset.Query().
		Order(ent.Desc(asset.FieldCreatedAt)).
		Limit(limit).
		Offset(offset).
		All(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]*Asset, len(list))
	for i, item := range list {
		result[i] = s.mapToDomain(item)
	}

	return &ListResponse{
		Assets:     result,
		TotalCount: total,
		Page:       page,
		Limit:      limit,
	}, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	a, err := s.client.Asset.Get(ctx, id)
	if err != nil {
		return err
	}

	if err := s.storage.Delete(a.StoragePath); err != nil {
		log.Printf("failed to delete file from managed storage: %s, error: %v", a.StoragePath, err)
	}

	return s.client.Asset.DeleteOneID(id).Exec(ctx)
}

func (s *Service) Get(ctx context.Context, id string) (*Asset, error) {
	a, err := s.client.Asset.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	return s.mapToDomain(a), nil
}

func (s *Service) GetFullStoragePath(a *Asset) string {
	return a.StoragePath
}

func (s *Service) mapToDomain(e *ent.Asset) *Asset {
	return &Asset{
		ID:               e.ID,
		OriginalFilename: e.OriginalFilename,
		FileType:         FileType(e.FileType),
		Extension:        e.Extension,
		FileSizeBytes:    e.FileSizeBytes,
		StoragePath:      e.StoragePath,
		CreatedAt:        e.CreatedAt,
	}
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
	case ".py", ".js", ".ts", ".tsx", ".json", ".go", ".yaml", ".yml", ".css", ".html", ".md":
		return FileTypeCode
	default:
		return FileTypeOther
	}
}
