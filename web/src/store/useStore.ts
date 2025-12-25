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

  filterType: FileType | "all";
  setFilterType: (type: FileType | "all") => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  sortOrder: SortOption;
  setSortOrder: (order: SortOption) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),

      masterPanelWidth: 40, // Percentage
      setMasterPanelWidth: (width) => set({ masterPanelWidth: width }),

      selectedAssetId: null,
      selectAsset: (id) => set({ selectedAssetId: id }),

      isUploadOpen: false,
      setUploadOpen: (isOpen) => set({ isUploadOpen: isOpen }),

      filterType: "all",
      setFilterType: (type) => set({ filterType: type }),

      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),

      sortOrder: "newest",
      setSortOrder: (order) => set({ sortOrder: order }),
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
