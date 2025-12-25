package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/adimail/asset-manager/internal/assets"
	"github.com/gorilla/mux"
)

type AssetHandler struct {
	service *assets.Service
}

func NewAssetHandler(s *assets.Service) *AssetHandler {
	return &AssetHandler{service: s}
}

func (h *AssetHandler) Upload(w http.ResponseWriter, r *http.Request) {
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Invalid file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	req := assets.UploadRequest{
		File:     file,
		Filename: header.Filename,
		Size:     header.Size,
	}

	asset, err := h.service.Upload(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(asset)
}

func (h *AssetHandler) List(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.List(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func (h *AssetHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if err := h.service.Delete(r.Context(), vars["id"]); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AssetHandler) Download(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	asset, err := h.service.Get(r.Context(), vars["id"])
	if err != nil {
		http.Error(w, "Asset not found", http.StatusNotFound)
		return
	}
	http.ServeFile(w, r, asset.StoragePath)
}
