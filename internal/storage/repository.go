package storage

import (
	"context"
	"database/sql"

	"github.com/adimail/asset-manager/internal/assets"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, a *assets.Asset) error {
	query := `INSERT INTO assets (id, original_filename, file_type, extension, file_size_bytes, storage_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
	_, err := r.db.ExecContext(ctx, query, a.ID, a.OriginalFilename, a.FileType, a.Extension, a.FileSizeBytes, a.StoragePath, a.CreatedAt)
	return err
}

func (r *Repository) List(ctx context.Context) ([]*assets.Asset, error) {
	query := `SELECT id, original_filename, file_type, extension, file_size_bytes, storage_path, created_at FROM assets ORDER BY created_at DESC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*assets.Asset
	for rows.Next() {
		var a assets.Asset
		if err := rows.Scan(&a.ID, &a.OriginalFilename, &a.FileType, &a.Extension, &a.FileSizeBytes, &a.StoragePath, &a.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, &a)
	}
	return list, nil
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM assets WHERE id = ?", id)
	return err
}

func (r *Repository) Get(ctx context.Context, id string) (*assets.Asset, error) {
	query := `SELECT id, original_filename, file_type, extension, file_size_bytes, storage_path, created_at FROM assets WHERE id = ?`
	var a assets.Asset
	err := r.db.QueryRowContext(ctx, query, id).Scan(&a.ID, &a.OriginalFilename, &a.FileType, &a.Extension, &a.FileSizeBytes, &a.StoragePath, &a.CreatedAt)
	return &a, err
}
