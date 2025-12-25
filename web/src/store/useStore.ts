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
  filterType: FileType | "all";
  setFilterType: (type: FileType | "all") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOrder: SortOption;
  setSortOrder: (order: SortOption) => void;
  shouldFocusSearch: number;
  triggerSearchFocus: () => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
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
      filterType: "all",
      setFilterType: (type) => set({ filterType: type, currentPage: 1 }),
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
      sortOrder: "newest",
      setSortOrder: (order) => set({ sortOrder: order, currentPage: 1 }),
      shouldFocusSearch: 0,
      triggerSearchFocus: () =>
        set((state) => ({ shouldFocusSearch: state.shouldFocusSearch + 1 })),
      showDeleteConfirm: false,
      setShowDeleteConfirm: (show) => set({ showDeleteConfirm: show }),
      currentPage: 1,
      setCurrentPage: (page) => set({ currentPage: page }),
    }),
    {
      name: "asset-manager-storage",
      partialize: (state) => ({
        theme: state.theme,
        masterPanelWidth: state.masterPanelWidth,
        sortOrder: state.sortOrder,
      }),
    },
  ),
);
