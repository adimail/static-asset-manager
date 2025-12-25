import { memo } from "react";
import {
  FileText,
  Image,
  Music,
  Video,
  File,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import { Asset } from "../../api/types";
import { useStore } from "../../store/useStore";
import { useDeleteAsset } from "../../hooks/useAssets";
import { formatBytes } from "../../utils/fileHelpers";
import { formatDate } from "../../utils/dateHelpers";
import { toast } from "sonner";
import clsx from "clsx";

const IconMap = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  other: File,
  code: FileText,
};

const ColorMap = {
  image: "text-purple-500 bg-purple-500/10",
  video: "text-pink-500 bg-pink-500/10",
  audio: "text-cyan-500 bg-cyan-500/10",
  document: "text-blue-500 bg-blue-500/10",
  other: "text-gray-500 bg-gray-500/10",
  code: "text-green-500 bg-green-500/10",
};

export const AssetItem = memo(({ asset }: { asset: Asset }) => {
  const {
    selectedAssetId,
    selectAsset,
    isSelectionMode,
    selectedAssetIds,
    toggleAssetSelection,
    toggleSelectionMode,
  } = useStore();
  const { mutate: deleteAsset } = useDeleteAsset();

  const isSelected = selectedAssetId === asset.id;
  const isChecked = selectedAssetIds.includes(asset.id);
  const Icon = IconMap[asset.file_type] || File;
  const colorClass = ColorMap[asset.file_type] || ColorMap.other;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.ctrlKey || e.metaKey) {
      if (!isSelectionMode) toggleSelectionMode();
      toggleAssetSelection(asset.id);
      return;
    }

    if (isSelectionMode) {
      toggleAssetSelection(asset.id);
    } else {
      selectAsset(asset.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to delete ${asset.original_filename}?`,
      )
    ) {
      deleteAsset(asset.id, {
        onSuccess: () => {
          toast.success("Asset deleted");
          if (isSelected) selectAsset(null);
        },
        onError: () => toast.error("Failed to delete asset"),
      });
    }
  };

  return (
    <div
      id={`asset-${asset.id}`}
      onClick={handleClick}
      role="listitem"
      tabIndex={0}
      className={clsx(
        "group relative p-3 cursor-pointer border outline-none transition-all duration-200",
        isSelected && !isSelectionMode
          ? "bg-primary-light border-primary/30 shadow-sm"
          : "bg-transparent border-transparent hover:bg-surface hover:shadow-md hover:border-border/50",
        isChecked && isSelectionMode && "bg-primary/10 border-primary/30",
      )}
    >
      {isSelected && !isSelectionMode && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
      )}

      <div className="flex items-center gap-4 pointer-events-none">
        {isSelectionMode && (
          <div className="pointer-events-auto text-primary">
            {isChecked ? (
              <CheckSquare size={20} />
            ) : (
              <Square size={20} className="text-text-muted" />
            )}
          </div>
        )}

        <div
          className={clsx(
            "w-12 h-12 flex-none overflow-hidden flex items-center justify-center relative",
            asset.file_type === "image" ? "bg-surface-highlight" : colorClass,
          )}
        >
          {asset.file_type === "image" ? (
            <img
              src={`/api/v1/assets/${asset.id}/download`}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Icon className="w-6 h-6" />
          )}
          {asset.is_compressed && (
            <div className="absolute bottom-0 right-0 bg-green-500 text-white text-[8px] px-1 font-bold">
              ZIP
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate text-primary">
            {asset.original_filename}
          </h3>
          <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
            <span className="capitalize">{asset.file_type}</span>
            <span className="w-1 h-1 rounded-full bg-text-muted/50" />
            <span className="font-mono">
              {formatBytes(asset.file_size_bytes)}
            </span>
            {asset.tags.length > 0 && (
              <div className="flex gap-1 ml-2">
                {asset.tags.slice(0, 2).map((t) => (
                  <span
                    key={t.id}
                    className="px-1.5 py-0.5 bg-surface-highlight rounded text-[10px]"
                    style={{ color: t.color }}
                  >
                    {t.name}
                  </span>
                ))}
                {asset.tags.length > 2 && <span>+{asset.tags.length - 2}</span>}
              </div>
            )}
          </div>
        </div>

        {!isSelectionMode && (
          <button
            onClick={handleDelete}
            className="pointer-events-auto p-2 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        )}

        <div className="text-[10px] text-text-muted hidden sm:block">
          {formatDate(asset.created_at)}
        </div>
      </div>
    </div>
  );
});
