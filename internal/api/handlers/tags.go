package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/adimail/asset-manager/internal/tags"
	"github.com/gorilla/mux"
)

type TagHandler struct {
	service *tags.Service
}

func NewTagHandler(s *tags.Service) *TagHandler {
	return &TagHandler{service: s}
}

func (h *TagHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name  string `json:"name"`
		Color string `json:"color"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	tag, err := h.service.Create(r.Context(), req.Name, req.Color)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tag)
}

func (h *TagHandler) List(w http.ResponseWriter, r *http.Request) {
	tags, err := h.service.List(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tags)
}

func (h *TagHandler) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	var req struct {
		Name  string `json:"name"`
		Color string `json:"color"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	tag, err := h.service.Update(r.Context(), vars["id"], req.Name, req.Color)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tag)
}

func (h *TagHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if err := h.service.Delete(r.Context(), vars["id"]); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TagHandler) TagAsset(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	var req struct {
		TagIDs []string `json:"tag_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.service.TagAsset(r.Context(), vars["id"], req.TagIDs); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *TagHandler) BulkTagAssets(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AssetIDs []string `json:"asset_ids"`
		TagIDs   []string `json:"tag_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.service.BulkTagAssets(r.Context(), req.AssetIDs, req.TagIDs); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
