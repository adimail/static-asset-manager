package storage

import (
	"database/sql"
	_ "embed"

	_ "github.com/mattn/go-sqlite3"
)

//go:embed migrations/001_initial.sql
var MigrationSQL string

func Connect(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	return db, nil
}
