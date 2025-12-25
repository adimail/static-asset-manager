package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

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
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	var tags []string
	if t := r.URL.Query().Get("tags"); t != "" {
		tags = strings.Split(t, ",")
	}

	res, err := h.service.List(r.Context(), page, limit, tags)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func (h *AssetHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if err := h.service.Delete(r.Context(), vars["id"]); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AssetHandler) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	var req struct {
		OriginalFilename string `json:"original_filename"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	asset, err := h.service.Rename(r.Context(), vars["id"], req.OriginalFilename)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(asset)
}

func (h *AssetHandler) BulkDelete(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IDs []string `json:"ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteMultiple(r.Context(), req.IDs); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AssetHandler) Compress(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if err := h.service.CompressAsset(r.Context(), vars["id"]); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusAccepted)
}

func (h *AssetHandler) BulkCompress(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IDs []string `json:"ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.service.CompressMultiple(r.Context(), req.IDs); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusAccepted)
}

func (h *AssetHandler) Download(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	asset, err := h.service.Get(r.Context(), vars["id"])
	if err != nil {
		http.Error(w, "Asset not found", http.StatusNotFound)
		return
	}

	fullPath := h.service.GetFullStoragePath(asset)
	http.ServeFile(w, r, fullPath)
}
