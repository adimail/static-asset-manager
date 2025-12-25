import { useMemo, useEffect, useRef } from "react";
import { useAssets } from "../../hooks/useAssets";
import { useStore } from "../../store/useStore";
import { FilterBar } from "./FilterBar";
import { AssetItem } from "./AssetItem";
import { FolderOpen } from "lucide-react";

export function MasterPanel() {
  const { data: assets, isLoading } = useAssets();
  const {
    filterType,
    searchQuery,
    sortOrder,
    selectedAssetId,
    selectAsset,
    setShowDeleteConfirm,
  } = useStore();
  const listRef = useRef<HTMLDivElement>(null);

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    let result = [...assets];
    if (filterType !== "all") {
      result = result.filter((a) => a.file_type === filterType);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) =>
        a.original_filename.toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "name-asc":
          return a.original_filename.localeCompare(b.original_filename);
        case "name-desc":
          return b.original_filename.localeCompare(a.original_filename);
        case "size-desc":
          return b.file_size_bytes - a.file_size_bytes;
        case "size-asc":
          return a.file_size_bytes - b.file_size_bytes;
        default:
          return 0;
      }
    });
    return result;
  }, [assets, filterType, searchQuery, sortOrder]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        (e.target as HTMLElement).tagName,
      );
      if (isInput || filteredAssets.length === 0) return;

      const currentIndex = filteredAssets.findIndex(
        (a) => a.id === selectedAssetId,
      );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex =
          currentIndex === -1
            ? 0
            : Math.min(currentIndex + 1, filteredAssets.length - 1);
        selectAsset(filteredAssets[nextIndex].id);
        document
          .getElementById(`asset-${filteredAssets[nextIndex].id}`)
          ?.scrollIntoView({ block: "nearest" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex =
          currentIndex === -1 ? 0 : Math.max(currentIndex - 1, 0);
        selectAsset(filteredAssets[prevIndex].id);
        document
          .getElementById(`asset-${filteredAssets[prevIndex].id}`)
          ?.scrollIntoView({ block: "nearest" });
      } else if (e.key === "Home") {
        e.preventDefault();
        selectAsset(filteredAssets[0].id);
        listRef.current?.scrollTo({ top: 0 });
      } else if (e.key === "End") {
        e.preventDefault();
        selectAsset(filteredAssets[filteredAssets.length - 1].id);
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      } else if (e.key === "Delete" && selectedAssetId) {
        e.preventDefault();
        setShowDeleteConfirm(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredAssets, selectedAssetId, selectAsset, setShowDeleteConfirm]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-sidebar to-bg border-r border-border">
      <FilterBar />
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 focus:outline-none"
        role="list"
        aria-label="Asset list"
        tabIndex={-1}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32 space-y-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-muted">Loading assets...</span>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-text-muted animate-fade-in">
            <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center mb-4">
              <FolderOpen size={32} className="opacity-50" />
            </div>
            <p className="text-lg font-medium text-text-primary">
              No files found
            </p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <AssetItem key={asset.id} asset={asset} />
          ))
        )}
      </div>
    </div>
  );
}
