package handlers

import (
	"encoding/json"
	"fmt"
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
		http.Error(w, err.Error(), http.StatusBadRequest)
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

	w.Header().Set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	if asset.FileType == "document" || asset.Extension == ".svg" || asset.Extension == ".html" {
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", asset.OriginalFilename))
	}

	http.ServeFile(w, r, asset.StoragePath)
}

func (h *AssetHandler) Thumbnail(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	path, mime, err := h.service.GetThumbnailPath(r.Context(), vars["id"])
	if err != nil {
		http.Error(w, "Thumbnail not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", mime)
	w.Header().Set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	http.ServeFile(w, r, path)
}

func (h *AssetHandler) SyncCDN(w http.ResponseWriter, r *http.Request) {
	if err := h.service.SyncCDN(r.Context()); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "synced"})
}

func (h *AssetHandler) GetCDNStatus(w http.ResponseWriter, r *http.Request) {
	status, err := h.service.GetCDNStatus(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}
