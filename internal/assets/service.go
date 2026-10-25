package assets

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/adimail/asset-manager/ent"
	"github.com/adimail/asset-manager/ent/asset"
	"github.com/adimail/asset-manager/ent/compressionjob"
	"github.com/adimail/asset-manager/ent/tag"
	"github.com/adimail/asset-manager/internal/preprocessing"
	"github.com/google/uuid"
)

type FileStorage interface {
	Write(path string, data io.Reader) error
	Delete(path string) error
}

type Service struct {
	client            *ent.Client
	storage           FileStorage
	validator         *Validator
	assetsDir         string
	originalsDir      string
	thumbnailsDir     string
	wranglerPath      string
	cloudflareProject string
	preprocessor      *preprocessing.Service
}

func NewService(
	client *ent.Client,
	storage FileStorage,
	validator *Validator,
	assetsDir string,
	originalsDir string,
	thumbnailsDir string,
	wranglerPath string,
	cloudflareProject string,
	preprocessor *preprocessing.Service,
) *Service {
	return &Service{
		client:            client,
		storage:           storage,
		validator:         validator,
		assetsDir:         assetsDir,
		originalsDir:      originalsDir,
		thumbnailsDir:     thumbnailsDir,
		wranglerPath:      wranglerPath,
		cloudflareProject: cloudflareProject,
		preprocessor:      preprocessor,
	}
}

func (s *Service) Upload(ctx context.Context, req UploadRequest) (*Asset, error) {
	mime, err := s.validator.Validate(req.File, req.Filename, req.Size)
	if err != nil {
		return nil, err
	}

	hasher := sha256.New()
	if _, err := io.Copy(hasher, req.File); err != nil {
		return nil, fmt.Errorf("failed computing hash: %w", err)
	}
	hashStr := hex.EncodeToString(hasher.Sum(nil))

	if _, err := req.File.Seek(0, io.SeekStart); err != nil {
		return nil, fmt.Errorf("failed resetting stream: %w", err)
	}

	existing, err := s.client.Asset.Query().
		Where(asset.ContentHashEQ(hashStr)).
		WithTags().
		First(ctx)
	if err == nil && existing != nil {
		return s.mapToDomain(existing), nil
	}

	id := uuid.New().String()
	ext := strings.ToLower(filepath.Ext(req.Filename))
	fileType := s.determineFileType(ext)

	managedPath, err := filepath.Abs(filepath.Join(s.assetsDir, id+ext))
	if err != nil {
		return nil, err
	}

	if err := s.storage.Write(managedPath, req.File); err != nil {
		return nil, fmt.Errorf("failed writing file to storage: %w", err)
	}

	thumbPath := filepath.Join(s.thumbnailsDir, id+".webp")
	_ = s.preprocessor.GenerateThumbnail(managedPath, thumbPath, string(fileType))

	builder := s.client.Asset.Create().
		SetID(id).
		SetOriginalFilename(req.Filename).
		SetFileType(string(fileType)).
		SetExtension(ext).
		SetFileSizeBytes(req.Size).
		SetStoragePath(managedPath).
		SetCreatedAt(time.Now()).
		SetIsCompressed(false).
		SetContentHash(hashStr).
		SetMimeType(mime).
		SetCdnStatus("local_only")

	if _, err := os.Stat(thumbPath); err == nil {
		builder.SetThumbnailPath(thumbPath)
	}

	saved, err := builder.Save(ctx)
	if err != nil {
		s.storage.Delete(managedPath)
		return nil, fmt.Errorf("failed persisting asset record: %w", err)
	}

	return s.mapToDomain(saved), nil
}

func (s *Service) Rename(ctx context.Context, id string, newName string) (*Asset, error) {
	if strings.TrimSpace(newName) == "" {
		return nil, fmt.Errorf("filename cannot be empty")
	}

	ext := strings.ToLower(filepath.Ext(newName))
	if ext == "" {
		return nil, fmt.Errorf("extension required")
	}
	fileType := s.determineFileType(ext)

	a, err := s.client.Asset.UpdateOneID(id).
		SetOriginalFilename(newName).
		SetExtension(ext).
		SetFileType(string(fileType)).
		Save(ctx)
	if err != nil {
		return nil, err
	}
	return s.mapToDomain(a), nil
}

func (s *Service) CompressAsset(ctx context.Context, id string) error {
	a, err := s.client.Asset.Get(ctx, id)
	if err != nil {
		return err
	}

	ft := FileType(a.FileType)
	if ft != FileTypeImage && ft != FileTypeVideo {
		return fmt.Errorf("asset type not supported for compression")
	}

	if a.IsCompressed {
		return fmt.Errorf("asset is already compressed")
	}

	return s.preprocessor.Enqueue(ctx, id)
}

func (s *Service) CompressMultiple(ctx context.Context, ids []string) error {
	assets, err := s.client.Asset.Query().Where(asset.IDIn(ids...)).All(ctx)
	if err != nil {
		return err
	}

	for _, a := range assets {
		ft := FileType(a.FileType)
		if (ft == FileTypeImage || ft == FileTypeVideo) && !a.IsCompressed {
			if err := s.preprocessor.Enqueue(ctx, a.ID); err != nil {
				log.Printf("failed enqueueing asset %s: %v", a.ID, err)
			}
		}
	}
	return nil
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

	_ = s.storage.Delete(a.StoragePath)

	if a.OriginalPath != "" {
		_ = os.Remove(a.OriginalPath)
	}

	if a.ThumbnailPath != "" {
		_ = os.Remove(a.ThumbnailPath)
	}

	_, _ = s.client.CompressionJob.Delete().
		Where(compressionjob.HasAssetWith(asset.ID(id))).
		Exec(ctx)

	return s.client.Asset.DeleteOneID(id).Exec(ctx)
}

func (s *Service) DeleteMultiple(ctx context.Context, ids []string) error {
	assets, err := s.client.Asset.Query().Where(asset.IDIn(ids...)).All(ctx)
	if err != nil {
		return err
	}

	for _, a := range assets {
		_ = s.storage.Delete(a.StoragePath)
		if a.OriginalPath != "" {
			_ = os.Remove(a.OriginalPath)
		}
		if a.ThumbnailPath != "" {
			_ = os.Remove(a.ThumbnailPath)
		}
	}

	_, _ = s.client.CompressionJob.Delete().
		Where(compressionjob.HasAssetWith(asset.IDIn(ids...))).
		Exec(ctx)

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

func (s *Service) GetThumbnailPath(ctx context.Context, id string) (string, string, error) {
	a, err := s.client.Asset.Get(ctx, id)
	if err != nil {
		return "", "", err
	}
	if a.ThumbnailPath != "" {
		if _, err := os.Stat(a.ThumbnailPath); err == nil {
			return a.ThumbnailPath, "image/webp", nil
		}
	}
	return a.StoragePath, a.MimeType, nil
}

func (s *Service) SyncCDN(ctx context.Context) error {
	cmd := exec.CommandContext(ctx, s.wranglerPath, "pages", "deploy", "cdn", "--project-name", s.cloudflareProject)
	output, err := cmd.CombinedOutput()
	if err != nil {
		_, _ = s.client.Asset.Update().
			Where(asset.CdnStatusEQ("local_only")).
			SetCdnStatus("failed").
			Save(ctx)
		return fmt.Errorf("wrangler error: %s - %w", string(output), err)
	}

	now := time.Now()
	_, err = s.client.Asset.Update().
		SetCdnStatus("live").
		SetLastSyncedAt(now).
		Save(ctx)
	return err
}

func (s *Service) GetCDNStatus(ctx context.Context) (*CDNStatusResponse, error) {
	localCount, err := s.client.Asset.Query().Where(asset.CdnStatusEQ("local_only")).Count(ctx)
	if err != nil {
		return nil, err
	}
	liveCount, err := s.client.Asset.Query().Where(asset.CdnStatusEQ("live")).Count(ctx)
	if err != nil {
		return nil, err
	}
	failedCount, err := s.client.Asset.Query().Where(asset.CdnStatusEQ("failed")).Count(ctx)
	if err != nil {
		return nil, err
	}

	var lastSynced *time.Time
	latest, err := s.client.Asset.Query().
		Where(asset.LastSyncedAtNotNil()).
		Order(ent.Desc(asset.FieldLastSyncedAt)).
		First(ctx)
	if err == nil && latest != nil {
		lastSynced = latest.LastSyncedAt
	}

	return &CDNStatusResponse{
		TotalLocalOnly: localCount,
		TotalLive:      liveCount,
		TotalFailed:    failedCount,
		LastSyncedAt:   lastSynced,
	}, nil
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
		ContentHash:      e.ContentHash,
		MimeType:         e.MimeType,
		ThumbnailPath:    e.ThumbnailPath,
		CdnStatus:        e.CdnStatus,
		LastSyncedAt:     e.LastSyncedAt,
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
