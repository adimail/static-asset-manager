package filesystem

import (
	"io"
	"os"
	"path/filepath"
)

type Storage struct{}

func New() *Storage {
	return &Storage{}
}

func (s *Storage) Write(path string, data io.Reader) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	out, err := os.Create(path)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, data)
	return err
}

func (s *Storage) Delete(path string) error {
	return os.Remove(path)
}
