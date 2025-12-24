package assets

import (
	"errors"
	"path/filepath"
	"strings"
)

type Validator struct {
	MaxUploadSize int64
}

func NewValidator(maxSize int64) *Validator {
	return &Validator{MaxUploadSize: maxSize}
}

func (v *Validator) Validate(req UploadRequest) error {
	if req.Size > v.MaxUploadSize {
		return errors.New("file too large")
	}
	if req.Filename == "" {
		return errors.New("filename required")
	}
	ext := strings.ToLower(filepath.Ext(req.Filename))
	if ext == "" {
		return errors.New("extension required")
	}
	return nil
}
