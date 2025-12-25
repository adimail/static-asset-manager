package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/adimail/asset-manager/ent"
	"github.com/adimail/asset-manager/internal/api"
	"github.com/adimail/asset-manager/internal/assets"
	"github.com/adimail/asset-manager/internal/config"
	"github.com/adimail/asset-manager/internal/filesystem"
	"github.com/adimail/asset-manager/internal/preprocessing"
	"github.com/adimail/asset-manager/internal/tags"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	cfg := config.Load()

	if err := os.MkdirAll(filepath.Dir(cfg.Database.Path), 0o755); err != nil {
		log.Fatal(err)
	}

	client, err := ent.Open("sqlite3", "file:"+cfg.Database.Path+"?cache=shared&_fk=1")
	if err != nil {
		log.Fatalf("failed opening connection to sqlite: %v", err)
	}
	defer client.Close()

	if err := client.Schema.Create(context.Background()); err != nil {
		log.Fatalf("failed creating schema resources: %v", err)
	}

	fs := filesystem.New()
	validator := assets.NewValidator(cfg.Server.MaxUploadSize)

	preprocessor := preprocessing.NewService(client, cfg.Compression)

	// Initialize Asset Service first as Tag Service depends on it for cascading deletes
	assetService := assets.NewService(client, fs, validator, cfg.Storage.AssetsDir, preprocessor)
	tagService := tags.NewService(client, assetService)

	handler := api.NewServer(assetService, tagService)

	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      handler,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	go func() {
		log.Printf("Server starting on %s", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil {
			log.Println(err)
		}
	}()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*15)
	defer cancel()
	srv.Shutdown(ctx)
}
