package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Server      ServerConfig
	Database    DatabaseConfig
	Storage     StorageConfig
	Compression CompressionConfig
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
	AssetsDir         string
	OriginalsDir      string
	ThumbnailsDir     string
	WranglerPath      string
	CloudflareProject string
}

type CompressionConfig struct {
	Enabled            bool
	WorkerCount        int
	ImageQuality       int
	VideoMaxHeight     int
	RetainOriginalDays int
	FFmpegPath         string
	OriginalsDir       string
	ThumbnailsDir      string
	AssetsDir          string
}

func Load() *Config {
	assetsDir := getEnv("STORAGE_ASSETS_DIR", "./cdn/assets")
	originalsDir := getEnv("STORAGE_ORIGINALS_DIR", "./storage/private/originals")
	thumbnailsDir := getEnv("STORAGE_THUMBNAILS_DIR", "./cdn/thumbnails")
	ffmpegPath := getEnv("FFMPEG_PATH", "ffmpeg")

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
			AssetsDir:         assetsDir,
			OriginalsDir:      originalsDir,
			ThumbnailsDir:     thumbnailsDir,
			WranglerPath:      getEnv("WRANGLER_PATH", "wrangler"),
			CloudflareProject: getEnv("CLOUDFLARE_PROJECT", "orion-static-cdn"),
		},
		Compression: CompressionConfig{
			Enabled:            getEnv("COMPRESSION_ENABLED", "true") == "true",
			WorkerCount:        getEnvInt("COMPRESSION_WORKERS", 2),
			ImageQuality:       getEnvInt("COMPRESSION_IMAGE_QUALITY", 85),
			VideoMaxHeight:     getEnvInt("COMPRESSION_VIDEO_MAX_HEIGHT", 1080),
			RetainOriginalDays: getEnvInt("COMPRESSION_RETAIN_DAYS", 7),
			FFmpegPath:         ffmpegPath,
			OriginalsDir:       originalsDir,
			ThumbnailsDir:      thumbnailsDir,
			AssetsDir:          assetsDir,
		},
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if value, ok := os.LookupEnv(key); ok {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return fallback
}
