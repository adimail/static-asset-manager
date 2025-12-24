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
	FileTypeOther    FileType = "other"
)

type Asset struct {
	ID               string    `json:"id"`
	OriginalFilename string    `json:"original_filename"`
	FileType         FileType  `json:"file_type"`
	Extension        string    `json:"extension"`
	FileSizeBytes    int64     `json:"file_size_bytes"`
	StoragePath      string    `json:"-"`
	CreatedAt        time.Time `json:"created_at"`
}

type UploadRequest struct {
	File     io.Reader
	Filename string
	Size     int64
}
