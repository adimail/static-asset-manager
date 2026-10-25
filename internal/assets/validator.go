package assets

import (
	"errors"
	"io"
	"net/http"
	"path/filepath"
	"strings"
)

type Validator struct {
	MaxUploadSize int64
}

func NewValidator(maxSize int64) *Validator {
	return &Validator{MaxUploadSize: maxSize}
}

func (v *Validator) Validate(file io.ReadSeeker, filename string, size int64) (string, error) {
	if size > v.MaxUploadSize {
		return "", errors.New("file too large")
	}
	if strings.TrimSpace(filename) == "" {
		return "", errors.New("filename required")
	}
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		return "", errors.New("extension required")
	}

	buf := make([]byte, 512)
	n, err := file.Read(buf)
	if err != nil && err != io.EOF {
		return "", errors.New("failed reading file header")
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", errors.New("failed rewinding file pointer")
	}

	sniffedMime := http.DetectContentType(buf[:n])

	if (ext == ".svg" || strings.Contains(strings.ToLower(string(buf[:n])), "<svg")) && !strings.Contains(sniffedMime, "xml") && !strings.Contains(sniffedMime, "svg") {
		sniffedMime = "image/svg+xml"
	}

	if (ext == ".html" || ext == ".htm" || strings.Contains(sniffedMime, "html")) && ext != ".html" && ext != ".htm" {
		return "", errors.New("disguised executable html payload detected")
	}

	return sniffedMime, nil
}
