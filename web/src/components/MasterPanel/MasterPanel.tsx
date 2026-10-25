import { useMemo, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
import { FolderOpen, Info, Globe, RefreshCw } from "lucide-react";
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

  const rowVirtualizer = useVirtualizer({
    count: processedAssets.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => (viewMode === "list" ? 72 : 180),
    overscan: 5,
  });

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
    if (selectedAssetIds.length === 0) return;
    setTagModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-bg border-r border-border relative">
      <FilterBar />

      <div className="px-4 py-2 flex items-center justify-between bg-surface-highlight/10 border-b border-border/30">
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
          <div className="flex items-center gap-1.5">
            <Info size={12} />
            <span>
              Showing {processedAssets.length} of {data?.total_count || 0}
            </span>
          </div>

          {cdnStatus && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-400">
                <Globe size={11} /> {cdnStatus.total_live} Live
              </span>
              {cdnStatus.total_local_only > 0 && (
                <span className="text-amber-400">
                  {cdnStatus.total_local_only} Pending
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => syncCdn()}
            disabled={isSyncing}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-hover disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              size={11}
              className={clsx(isSyncing && "animate-spin")}
            />
            <span>{isSyncing ? "Syncing..." : "Sync CDN"}</span>
          </button>
          <button
            onClick={toggleSelectionMode}
            className="text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary cursor-pointer"
          >
            {isSelectionMode ? "Cancel" : "Select"}
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 focus:outline-none pb-20"
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
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {processedAssets.map((asset) => (
              <AssetItem key={asset.id} asset={asset} viewMode="grid" />
            ))}
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const asset = processedAssets[virtualRow.index];
              return (
                <div
                  key={asset.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <AssetItem asset={asset} viewMode="list" />
                </div>
              );
            })}
          </div>
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
              className="text-xs text-text-secondary hover:underline cursor-pointer"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="text-xs text-text-secondary hover:underline cursor-pointer"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkCompress}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded cursor-pointer"
            >
              Compress
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded cursor-pointer"
            >
              Delete
            </button>
            <button
              onClick={handleBulkTag}
              className="px-3 py-1 bg-primary hover:bg-primary-hover text-background text-xs font-bold rounded cursor-pointer"
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
