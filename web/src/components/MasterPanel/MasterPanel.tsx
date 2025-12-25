import { useMemo, useEffect, useRef } from "react";
import {
  useAssets,
  useBulkDeleteAssets,
  useBulkCompressAssets,
} from "../../hooks/useAssets";
import { useStore } from "../../store/useStore";
import { FilterBar } from "./FilterBar";
import { AssetItem } from "./AssetItem";
import { FolderOpen, Info, CheckSquare, X } from "lucide-react";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function MasterPanel() {
  const {
    currentPage,
    setCurrentPage,
    filterTypes,
    searchQuery,
    sortOrder,
    selectedAssetId,
    selectAsset,
    isSelectionMode,
    selectedAssetIds,
    clearSelection,
    toggleSelectionMode,
    selectAll,
  } = useStore();

  const { data, isLoading } = useAssets(currentPage);
  const { mutate: bulkDelete } = useBulkDeleteAssets();
  const { mutate: bulkCompress } = useBulkCompressAssets();
  const listRef = useRef<HTMLDivElement>(null);

  const processedAssets = useMemo(() => {
    if (!data?.assets) return [];
    let result = [...data.assets];

    if (filterTypes.length > 0) {
      result = result.filter((a) => filterTypes.includes(a.file_type));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) =>
        a.original_filename.toLowerCase().includes(q),
      );
    }

    if (sortOrder === "name-asc") {
      result.sort((a, b) =>
        a.original_filename.localeCompare(b.original_filename),
      );
    } else if (sortOrder === "name-desc") {
      result.sort((a, b) =>
        b.original_filename.localeCompare(a.original_filename),
      );
    } else if (sortOrder === "size-desc") {
      result.sort((a, b) => b.file_size_bytes - a.file_size_bytes);
    } else if (sortOrder === "size-asc") {
      result.sort((a, b) => a.file_size_bytes - b.file_size_bytes);
    } else if (sortOrder === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    } else {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return result;
  }, [data, filterTypes, searchQuery, sortOrder]);

  const totalPages = data ? Math.ceil(data.total_count / data.limit) : 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        (e.target as HTMLElement).tagName,
      );
      if (isInput || processedAssets.length === 0) return;

      const currentIndex = processedAssets.findIndex(
        (a) => a.id === selectedAssetId,
      );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex =
          currentIndex === -1
            ? 0
            : Math.min(currentIndex + 1, processedAssets.length - 1);
        selectAsset(processedAssets[nextIndex].id);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex =
          currentIndex === -1 ? 0 : Math.max(currentIndex - 1, 0);
        selectAsset(processedAssets[prevIndex].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [processedAssets, selectedAssetId, selectAsset]);

  useEffect(() => {
    if (selectedAssetId) {
      const element = document.getElementById(`asset-${selectedAssetId}`);
      if (element) {
        element.scrollIntoView({ block: "nearest", behavior: "auto" });
      }
    }
  }, [selectedAssetId]);

  const handleBulkDelete = () => {
    if (selectedAssetIds.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedAssetIds.length} assets?`,
      )
    )
      return;

    bulkDelete(selectedAssetIds, {
      onSuccess: () => {
        toast.success(`Successfully deleted ${selectedAssetIds.length} assets`);
        clearSelection();
      },
      onError: () => {
        toast.error("Failed to delete assets");
      },
    });
  };

  const handleBulkCompress = () => {
    if (selectedAssetIds.length === 0) return;
    bulkCompress(selectedAssetIds, {
      onSuccess: () => {
        clearSelection();
      },
    });
  };

  const handleBulkTag = () => {
    toast.info("Bulk tagging feature coming soon");
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-sidebar to-bg border-r border-border relative">
      <FilterBar />

      <div className="px-4 py-2 flex items-center justify-between bg-surface-highlight/10 border-b border-border/30">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
          <Info size={12} />
          <span>
            Showing {processedAssets.length} of {data?.total_count || 0} assets
          </span>
        </div>
        <button
          onClick={toggleSelectionMode}
          className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
        >
          {isSelectionMode ? "Cancel Selection" : "Select Multiple"}
        </button>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 focus:outline-none pb-20"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : processedAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-text-muted">
            <FolderOpen size={32} className="opacity-50 mb-4" />
            <p>No files found</p>
          </div>
        ) : (
          processedAssets.map((asset) => (
            <AssetItem key={asset.id} asset={asset} />
          ))
        )}
      </div>

      {isSelectionMode && (
        <div className="absolute bottom-0 left-0 right-0 bg-surface border-t border-primary p-4 shadow-lg animate-slide-up z-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-primary">
              {selectedAssetIds.length} selected
            </span>
            <button
              onClick={() => selectAll(processedAssets.map((a) => a.id))}
              className="text-xs text-text-secondary hover:underline"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="text-xs text-text-secondary hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkCompress}
              className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded hover:bg-amber-700 cursor-pointer"
            >
              Compress
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 cursor-pointer"
            >
              Delete
            </button>
            <button
              onClick={handleBulkTag}
              className="px-3 py-1 bg-primary text-white text-xs font-bold rounded hover:bg-primary-hover cursor-pointer"
            >
              Tag
            </button>
          </div>
        </div>
      )}

      {totalPages > 1 && !isSelectionMode && (
        <div className="p-4 border-t border-border bg-surface/50">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className="cursor-pointer"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="text-xs font-bold px-4 text-text-secondary">
                  {currentPage} / {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  className="cursor-pointer"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
