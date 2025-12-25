package config

import (
	"os"
	"time"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Storage  StorageConfig
}

type ServerConfig struct {
	Port          string
	ReadTimeout   time.Duration
	WriteTimeout  time.Duration
	MaxUploadSize int64
}

type DatabaseConfig struct {
	Path string
}

type StorageConfig struct {
	AssetsDir string
}

func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port:          getEnv("SERVER_PORT", "8080"),
			ReadTimeout:   time.Second * 15,
			WriteTimeout:  time.Second * 15,
			MaxUploadSize: 100 * 1024 * 1024,
		},
		Database: DatabaseConfig{
			Path: getEnv("DATABASE_PATH", "./data/assets.db"),
		},
		Storage: StorageConfig{
			AssetsDir: getEnv("STORAGE_ASSETS_DIR", "./static/assets"),
		},
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
