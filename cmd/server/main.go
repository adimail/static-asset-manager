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

	"github.com/adimail/asset-manager/internal/api"
	"github.com/adimail/asset-manager/internal/assets"
	"github.com/adimail/asset-manager/internal/config"
	"github.com/adimail/asset-manager/internal/filesystem"
	"github.com/adimail/asset-manager/internal/storage"
)

func main() {
	cfg := config.Load()

	if err := os.MkdirAll(filepath.Dir(cfg.Database.Path), 0o755); err != nil {
		log.Fatal(err)
	}

	db, err := storage.Connect(cfg.Database.Path)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if _, err := db.Exec(storage.MigrationSQL); err != nil {
		log.Fatal(err)
	}

	repo := storage.NewRepository(db)
	fs := filesystem.New()
	validator := assets.NewValidator(cfg.Server.MaxUploadSize)

	svc := assets.NewService(repo, fs, validator, cfg.Storage.AssetsDir)
	handler := api.NewServer(svc)

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
