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
	"github.com/adimail/asset-manager/ent/tag"
	"github.com/adimail/asset-manager/internal/preprocessing"
	"github.com/google/uuid"
)

type FileStorage interface {
	Write(path string, data io.Reader) error
	Delete(path string) error
}

type Service struct {
	client       *ent.Client
	storage      FileStorage
	validator    *Validator
	assetsDir    string
	preprocessor *preprocessing.Service
}

func NewService(client *ent.Client, storage FileStorage, validator *Validator, assetsDir string, preprocessor *preprocessing.Service) *Service {
	return &Service{
		client:       client,
		storage:      storage,
		validator:    validator,
		assetsDir:    assetsDir,
		preprocessor: preprocessor,
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
		SetFileType(string(fileType)).
		SetExtension(ext).
		SetFileSizeBytes(req.Size).
		SetStoragePath(managedPath).
		SetCreatedAt(time.Now()).
		SetIsCompressed(false).
		Save(ctx)
	if err != nil {
		s.storage.Delete(managedPath)
		return nil, fmt.Errorf("failed to save metadata: %w", err)
	}

	// Trigger compression if applicable
	if fileType == FileTypeImage || fileType == FileTypeVideo {
		if err := s.preprocessor.Enqueue(context.Background(), saved.ID); err != nil {
			log.Printf("Failed to enqueue compression job for %s: %v", saved.ID, err)
		}
	}

	return s.mapToDomain(saved), nil
}

func (s *Service) List(ctx context.Context, page, limit int, tagNames []string) (*ListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 50
	}
	offset := (page - 1) * limit

	query := s.client.Asset.Query()

	if len(tagNames) > 0 {
		query.Where(asset.HasTagsWith(tag.NameIn(tagNames...)))
	}

	total, err := query.Count(ctx)
	if err != nil {
		return nil, err
	}

	list, err := query.
		WithTags().
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

	// Also delete original if exists
	if a.OriginalPath != "" {
		s.storage.Delete(a.OriginalPath)
	}

	return s.client.Asset.DeleteOneID(id).Exec(ctx)
}

func (s *Service) DeleteMultiple(ctx context.Context, ids []string) error {
	// 1. Get all assets to find paths
	assets, err := s.client.Asset.Query().Where(asset.IDIn(ids...)).All(ctx)
	if err != nil {
		return err
	}

	// 2. Delete files
	for _, a := range assets {
		if err := s.storage.Delete(a.StoragePath); err != nil {
			log.Printf("failed to delete file: %v", err)
		}
		if a.OriginalPath != "" {
			s.storage.Delete(a.OriginalPath)
		}
	}

	// 3. Delete from DB
	_, err = s.client.Asset.Delete().Where(asset.IDIn(ids...)).Exec(ctx)
	return err
}

func (s *Service) Get(ctx context.Context, id string) (*Asset, error) {
	a, err := s.client.Asset.Query().Where(asset.ID(id)).WithTags().Only(ctx)
	if err != nil {
		return nil, err
	}
	return s.mapToDomain(a), nil
}

func (s *Service) GetFullStoragePath(a *Asset) string {
	return a.StoragePath
}

func (s *Service) mapToDomain(e *ent.Asset) *Asset {
	tags := make([]Tag, len(e.Edges.Tags))
	for i, t := range e.Edges.Tags {
		tags[i] = Tag{ID: t.ID, Name: t.Name, Color: t.Color}
	}

	return &Asset{
		ID:               e.ID,
		OriginalFilename: e.OriginalFilename,
		FileType:         FileType(e.FileType),
		Extension:        e.Extension,
		FileSizeBytes:    e.FileSizeBytes,
		StoragePath:      e.StoragePath,
		CreatedAt:        e.CreatedAt,
		IsCompressed:     e.IsCompressed,
		CompressionRatio: e.CompressionRatio,
		Tags:             tags,
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
