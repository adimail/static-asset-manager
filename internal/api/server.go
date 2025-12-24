package api

import (
	"net/http"

	"github.com/adimail/asset-manager/internal/api/handlers"
	"github.com/adimail/asset-manager/internal/assets"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func NewServer(assetService *assets.Service) http.Handler {
	r := mux.NewRouter()
	r.Use(handlers.LoggingMiddleware)

	h := handlers.NewAssetHandler(assetService)

	r.HandleFunc("/internal/health", handlers.HealthCheck).Methods("GET")

	api := r.PathPrefix("/api/v1").Subrouter()
	api.HandleFunc("/assets", h.Upload).Methods("POST")
	api.HandleFunc("/assets", h.List).Methods("GET")
	api.HandleFunc("/assets/{id}", h.Delete).Methods("DELETE")

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})

	return c.Handler(r)
}
