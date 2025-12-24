package main

import (
	"context"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/signal"
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

	db, err := storage.Connect(cfg.Database.Path)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	migration, err := ioutil.ReadFile("internal/storage/migrations/001_initial.sql")
	if err == nil {
		db.Exec(string(migration))
	}

	repo := storage.NewRepository(db)
	fs := filesystem.New()
	svc := assets.NewService(repo, fs, cfg.Storage.AssetsDir)
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
