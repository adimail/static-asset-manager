package api

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/adimail/asset-manager/internal/api/handlers"
	"github.com/adimail/asset-manager/internal/assets"
	"github.com/adimail/asset-manager/internal/tags"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func NewServer(assetService *assets.Service, tagService *tags.Service) http.Handler {
	r := mux.NewRouter()
	r.Use(handlers.LoggingMiddleware)

	h := handlers.NewAssetHandler(assetService)
	th := handlers.NewTagHandler(tagService)

	r.HandleFunc("/internal/health", handlers.HealthCheck).Methods("GET")

	api := r.PathPrefix("/api/v1").Subrouter()

	// Assets
	api.HandleFunc("/assets", h.Upload).Methods("POST")
	api.HandleFunc("/assets", h.List).Methods("GET")
	api.HandleFunc("/assets/bulk/delete", h.BulkDelete).Methods("POST")
	api.HandleFunc("/assets/bulk/compress", h.BulkCompress).Methods("POST")
	api.HandleFunc("/assets/{id}", h.Delete).Methods("DELETE")
	api.HandleFunc("/assets/{id}/download", h.Download).Methods("GET")
	api.HandleFunc("/assets/{id}/compress", h.Compress).Methods("POST")
	api.HandleFunc("/assets/{id}/tags", th.TagAsset).Methods("POST")

	// Tags
	api.HandleFunc("/tags", th.Create).Methods("POST")
	api.HandleFunc("/tags", th.List).Methods("GET")
	api.HandleFunc("/tags/{id}", th.Delete).Methods("DELETE")

	staticPath := "web/dist"
	indexPath := "index.html"

	r.PathPrefix("/").Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(staticPath, r.URL.Path)

		fi, err := os.Stat(path)
		if os.IsNotExist(err) || fi.IsDir() {
			http.ServeFile(w, r, filepath.Join(staticPath, indexPath))
			return
		}

		http.ServeFile(w, r, path)
	}))

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})

	return c.Handler(r)
}
