import { useMemo, useEffect, useRef } from "react";
import {
  useAssets,
  useBulkDeleteAssets,
  useBulkCompressAssets,
  useCdnStatus,
  useSyncCdn,
} from "../../hooks/useAssets";
import { useStore } from "../../store/useStore";
import { FilterBar } from "./FilterBar";
import { AssetItem } from "./AssetItem";
import { FolderOpen, Globe, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import clsx from "clsx";

export function MasterPanel() {
  const {
    currentPage,
    setCurrentPage,
    filterTypes,
    searchQuery,
    sortOrder,
    tagFilter,
    viewMode,
    selectedAssetId,
    selectAsset,
    isUploadOpen,
    isSelectionMode,
    selectedAssetIds,
    clearSelection,
    toggleSelectionMode,
    selectAll,
    setTagModalOpen,
  } = useStore();

  const { data, isLoading } = useAssets(currentPage, 50, tagFilter);
  const { data: cdnStatus } = useCdnStatus();
  const { mutate: syncCdn, isPending: isSyncing } = useSyncCdn();
  const { mutate: bulkDelete } = useBulkDeleteAssets();
  const { mutate: bulkCompress } = useBulkCompressAssets();
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasDetailOpen = selectedAssetId !== null || isUploadOpen;

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
        toast.success(`Deleted ${selectedAssetIds.length} assets`);
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
    if (selectedAssetIds.length === 0) return;
    setTagModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-bg border-r border-border relative overflow-hidden">
      <FilterBar />

      <div className="px-4 py-2 flex items-center justify-between bg-surface/50 border-b border-border text-xs text-text-secondary">
        <div className="flex items-center gap-3">
          <span className="font-medium text-text-primary">
            {processedAssets.length}{" "}
            <span className="text-text-muted font-normal">
              of {data?.total_count || 0}
            </span>
          </span>

          {cdnStatus && (
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <Globe size={11} /> {cdnStatus.total_live} Live
              </span>
              {cdnStatus.total_local_only > 0 && (
                <span className="text-[11px] text-amber-400">
                  {cdnStatus.total_local_only} local
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => syncCdn()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface border border-border hover:border-border-focused text-text-primary text-[11px] font-medium cursor-pointer transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={11}
              className={clsx(isSyncing && "animate-spin text-primary")}
            />
            <span>{isSyncing ? "Syncing..." : "Sync CDN"}</span>
          </button>
          <button
            onClick={toggleSelectionMode}
            className={clsx(
              "px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors border",
              isSelectionMode
                ? "bg-primary text-background border-primary"
                : "bg-surface border-border text-text-secondary hover:text-text-primary hover:border-border-focused",
            )}
          >
            {isSelectionMode ? "Cancel" : "Select"}
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 focus:outline-none"
      >
        {isLoading ? (
          <div
            className={clsx(
              "grid gap-4 animate-pulse",
              hasDetailOpen
                ? "grid-cols-2 lg:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
            )}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-surface rounded-lg border border-border"
              />
            ))}
          </div>
        ) : processedAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-text-muted">
            <FolderOpen size={40} className="opacity-40 mb-3" />
            <p className="text-sm">No assets found</p>
          </div>
        ) : viewMode === "grid" ? (
          <div
            className={clsx(
              "grid gap-4",
              hasDetailOpen
                ? "grid-cols-2 lg:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
            )}
          >
            {processedAssets.map((asset) => (
              <AssetItem key={asset.id} asset={asset} viewMode="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {processedAssets.map((asset) => (
              <AssetItem key={asset.id} asset={asset} viewMode="list" />
            ))}
          </div>
        )}
      </div>

      {isSelectionMode && (
        <div className="absolute bottom-0 inset-x-0 bg-surface/95 border-t border-primary p-3 shadow-2xl backdrop-blur-md z-30 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-primary">
              {selectedAssetIds.length} selected
            </span>
            <button
              onClick={() => selectAll(processedAssets.map((a) => a.id))}
              className="text-xs text-text-secondary hover:text-text-primary underline cursor-pointer"
            >
              Select all
            </button>
            <button
              onClick={clearSelection}
              className="text-xs text-text-secondary hover:text-text-primary underline cursor-pointer"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkCompress}
              className="px-3 py-1 bg-surface border border-border hover:bg-surface-hover text-text-primary text-xs font-medium rounded cursor-pointer transition-colors"
            >
              Optimize
            </button>
            <button
              onClick={handleBulkTag}
              className="px-3 py-1 bg-primary text-background text-xs font-bold rounded cursor-pointer hover:bg-primary-hover transition-colors"
            >
              Tag
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded cursor-pointer transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {totalPages > 1 && !isSelectionMode && (
        <div className="p-2.5 border-t border-border bg-surface/40 flex-none">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className="cursor-pointer text-xs h-7"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="text-xs font-medium px-2 text-text-secondary">
                  {currentPage} of {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  className="cursor-pointer text-xs h-7"
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
