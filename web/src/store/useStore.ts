import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FileType } from "../api/types";

type Theme = "light" | "dark" | "system";
type SortOption =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "size-desc"
  | "size-asc";
type ViewMode = "list" | "grid";

interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  masterPanelWidth: number;
  setMasterPanelWidth: (width: number) => void;
  selectedAssetId: string | null;
  selectAsset: (id: string | null) => void;
  isUploadOpen: boolean;
  setUploadOpen: (isOpen: boolean) => void;
  isHelpOpen: boolean;
  setHelpOpen: (isOpen: boolean) => void;

  filterTypes: FileType[];
  toggleFilterType: (type: FileType) => void;
  clearFilters: () => void;

  tagFilter: string | null;
  setTagFilter: (tagId: string | null) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  sortOrder: SortOption;
  setSortOrder: (order: SortOption) => void;

  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  shouldFocusSearch: number;
  triggerSearchFocus: () => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;

  isSelectionMode: boolean;
  toggleSelectionMode: () => void;
  selectedAssetIds: string[];
  toggleAssetSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;

  isTagModalOpen: boolean;
  setTagModalOpen: (isOpen: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
      masterPanelWidth: 40,
      setMasterPanelWidth: (width) => set({ masterPanelWidth: width }),
      selectedAssetId: null,
      selectAsset: (id) =>
        set({
          selectedAssetId: id,
          isUploadOpen: false,
          showDeleteConfirm: false,
        }),
      isUploadOpen: false,
      setUploadOpen: (isOpen) =>
        set((state) => ({
          isUploadOpen: isOpen,
          selectedAssetId: isOpen ? null : state.selectedAssetId,
        })),
      isHelpOpen: false,
      setHelpOpen: (isOpen) => set({ isHelpOpen: isOpen }),
      filterTypes: [],
      toggleFilterType: (type) =>
        set((state) => {
          const next = state.filterTypes.includes(type)
            ? state.filterTypes.filter((t) => t !== type)
            : [...state.filterTypes, type];
          return { filterTypes: next, currentPage: 1 };
        }),
      clearFilters: () =>
        set({ filterTypes: [], currentPage: 1, tagFilter: null }),

      tagFilter: null,
      setTagFilter: (tagId) => set({ tagFilter: tagId, currentPage: 1 }),

      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
      sortOrder: "newest",
      setSortOrder: (order) => set({ sortOrder: order, currentPage: 1 }),

      viewMode: "list",
      setViewMode: (mode) => set({ viewMode: mode }),

      shouldFocusSearch: 0,
      triggerSearchFocus: () =>
        set((state) => ({ shouldFocusSearch: state.shouldFocusSearch + 1 })),
      showDeleteConfirm: false,
      setShowDeleteConfirm: (show) => set({ showDeleteConfirm: show }),
      currentPage: 1,
      setCurrentPage: (page) => set({ currentPage: page }),

      isSelectionMode: false,
      toggleSelectionMode: () =>
        set((state) => ({
          isSelectionMode: !state.isSelectionMode,
          selectedAssetIds: [],
        })),
      selectedAssetIds: [],
      toggleAssetSelection: (id) =>
        set((state) => {
          const exists = state.selectedAssetIds.includes(id);
          return {
            selectedAssetIds: exists
              ? state.selectedAssetIds.filter((x) => x !== id)
              : [...state.selectedAssetIds, id],
          };
        }),
      clearSelection: () =>
        set({ selectedAssetIds: [], isSelectionMode: false }),
      selectAll: (ids) => set({ selectedAssetIds: ids }),

      isTagModalOpen: false,
      setTagModalOpen: (isOpen) => set({ isTagModalOpen: isOpen }),
    }),
    {
      name: "asset-manager-storage",
      partialize: (state) => ({
        theme: state.theme,
        masterPanelWidth: state.masterPanelWidth,
        sortOrder: state.sortOrder,
        viewMode: state.viewMode,
      }),
    },
  ),
);
