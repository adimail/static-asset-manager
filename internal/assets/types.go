package assets

import (
	"io"
	"time"
)

type FileType string

const (
	FileTypeImage    FileType = "image"
	FileTypeDocument FileType = "document"
	FileTypeAudio    FileType = "audio"
	FileTypeVideo    FileType = "video"
	FileTypeCode     FileType = "code"
	FileTypeOther    FileType = "other"
)

type Tag struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

type Asset struct {
	ID               string     `json:"id"`
	OriginalFilename string     `json:"original_filename"`
	FileType         FileType   `json:"file_type"`
	Extension        string     `json:"extension"`
	FileSizeBytes    int64      `json:"file_size_bytes"`
	StoragePath      string     `json:"-"`
	CreatedAt        time.Time  `json:"created_at"`
	IsCompressed     bool       `json:"is_compressed"`
	CompressionRatio float64    `json:"compression_ratio,omitempty"`
	ContentHash      string     `json:"content_hash,omitempty"`
	MimeType         string     `json:"mime_type"`
	ThumbnailPath    string     `json:"-"`
	CdnStatus        string     `json:"cdn_status"`
	LastSyncedAt     *time.Time `json:"last_synced_at,omitempty"`
	Tags             []Tag      `json:"tags"`
}

type ListResponse struct {
	Assets     []*Asset `json:"assets"`
	TotalCount int      `json:"total_count"`
	Page       int      `json:"page"`
	Limit      int      `json:"limit"`
}

type UploadRequest struct {
	File     io.ReadSeeker
	Filename string
	Size     int64
}

type CDNStatusResponse struct {
	TotalLocalOnly int        `json:"total_local_only"`
	TotalLive      int        `json:"total_live"`
	TotalFailed    int        `json:"total_failed"`
	LastSyncedAt   *time.Time `json:"last_synced_at,omitempty"`
}
