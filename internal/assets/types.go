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
	ID               string    `json:"id"`
	OriginalFilename string    `json:"original_filename"`
	FileType         FileType  `json:"file_type"`
	Extension        string    `json:"extension"`
	FileSizeBytes    int64     `json:"file_size_bytes"`
	StoragePath      string    `json:"-"`
	CreatedAt        time.Time `json:"created_at"`
	IsCompressed     bool      `json:"is_compressed"`
	CompressionRatio float64   `json:"compression_ratio,omitempty"`
	Tags             []Tag     `json:"tags"`
}

type ListResponse struct {
	Assets     []*Asset `json:"assets"`
	TotalCount int      `json:"total_count"`
	Page       int      `json:"page"`
	Limit      int      `json:"limit"`
}

type UploadRequest struct {
	File     io.Reader
	Filename string
	Size     int64
}
