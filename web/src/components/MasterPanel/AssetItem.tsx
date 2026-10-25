import { memo, useState } from "react";
import {
  FileText,
  Image,
  Music,
  Video,
  File,
  Trash2,
  CheckSquare,
  Square,
  Zap,
  Play,
} from "lucide-react";
import { Asset } from "../../api/types";
import { useStore } from "../../store/useStore";
import { useDeleteAsset, useCompressAsset } from "../../hooks/useAssets";
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

export const AssetItem = memo(
  ({ asset, viewMode }: { asset: Asset; viewMode: "list" | "grid" }) => {
    const {
      selectedAssetId,
      selectAsset,
      isSelectionMode,
      selectedAssetIds,
      toggleAssetSelection,
      toggleSelectionMode,
    } = useStore();
    const { mutate: deleteAsset } = useDeleteAsset();
    const { mutate: compressAsset } = useCompressAsset();
    const [imgError, setImgError] = useState(false);

    const isSelected = selectedAssetId === asset.id;
    const isChecked = selectedAssetIds.includes(asset.id);
    const Icon = IconMap[asset.file_type] || File;
    const canCompress =
      (asset.file_type === "image" || asset.file_type === "video") &&
      !asset.is_compressed;

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

    const handleCompress = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      compressAsset(asset.id);
    };

    if (viewMode === "list") {
      return (
        <div
          id={`asset-${asset.id}`}
          onClick={handleClick}
          role="listitem"
          tabIndex={0}
          className={clsx(
            "group relative flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer outline-none bg-surface",
            isSelected
              ? "border-primary ring-1 ring-primary shadow-sm"
              : "border-border hover:border-border-focused hover:bg-surface-hover",
            isChecked && "bg-primary-light border-primary/40",
          )}
        >
          {isSelectionMode && (
            <div className="flex-none text-primary">
              {isChecked ? (
                <CheckSquare size={16} />
              ) : (
                <Square size={16} className="text-text-muted" />
              )}
            </div>
          )}

          <div className="w-10 h-10 flex-none rounded bg-surface-highlight flex items-center justify-center overflow-hidden relative">
            {(asset.file_type === "image" || asset.file_type === "video") &&
            !imgError ? (
              <img
                src={`/api/v1/assets/${asset.id}/thumbnail`}
                alt={asset.original_filename}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <Icon size={18} className="text-text-muted" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4
              className="text-xs font-medium text-text-primary truncate"
              title={asset.original_filename}
            >
              {asset.original_filename}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-muted">
              <span>{formatBytes(asset.file_size_bytes)}</span>
              <span>•</span>
              <span className="uppercase">
                {asset.extension.replace(".", "")}
              </span>
              <span>•</span>
              <span>{formatDate(asset.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-none">
            {asset.cdn_status === "live" && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CDN
              </span>
            )}

            {!isSelectionMode && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                {canCompress && (
                  <button
                    onClick={handleCompress}
                    className="p-1 text-text-muted hover:text-primary rounded cursor-pointer"
                    title="Optimize"
                  >
                    <Zap size={14} />
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="p-1 text-text-muted hover:text-red-400 rounded cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        id={`asset-${asset.id}`}
        onClick={handleClick}
        role="listitem"
        tabIndex={0}
        className={clsx(
          "group relative flex flex-col rounded-xl border transition-all cursor-pointer outline-none bg-surface overflow-hidden shadow-sm aspect-square",
          isSelected
            ? "border-primary ring-2 ring-primary shadow-lg scale-[1.01]"
            : "border-border hover:border-border-focused hover:shadow-md",
          isChecked && "ring-2 ring-primary border-primary",
        )}
      >
        <div className="relative w-full h-full bg-[#090b10] flex items-center justify-center overflow-hidden">
          {(asset.file_type === "image" || asset.file_type === "video") &&
          !imgError ? (
            <img
              src={`/api/v1/assets/${asset.id}/thumbnail`}
              alt={asset.original_filename}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
              <Icon size={32} className="text-text-muted/50" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                {asset.extension}
              </span>
            </div>
          )}

          {asset.file_type === "video" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white/90 shadow-md">
                <Play size={18} className="ml-0.5" />
              </div>
            </div>
          )}

          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
            {isSelectionMode ? (
              <div className="bg-black/75 p-1 rounded backdrop-blur-sm text-primary">
                {isChecked ? (
                  <CheckSquare size={16} />
                ) : (
                  <Square size={16} className="text-white/70" />
                )}
              </div>
            ) : (
              asset.cdn_status === "live" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-black/75 text-emerald-400 border border-emerald-500/30 backdrop-blur-sm flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  CDN
                </span>
              )
            )}
          </div>

          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
            {asset.is_compressed && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-600 text-white shadow-sm backdrop-blur-sm">
                {asset.compression_ratio && asset.compression_ratio < 1
                  ? `-${Math.round((1 - asset.compression_ratio) * 100)}%`
                  : "OPT"}
              </span>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span
              className="text-xs font-medium text-white truncate max-w-[70%]"
              title={asset.original_filename}
            >
              {asset.original_filename}
            </span>

            {!isSelectionMode && (
              <div className="flex items-center gap-1.5 flex-none">
                {canCompress && (
                  <button
                    onClick={handleCompress}
                    className="p-1.5 bg-black/70 hover:bg-primary text-white hover:text-background rounded transition-colors cursor-pointer"
                    title="Optimize"
                  >
                    <Zap size={13} />
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="p-1.5 bg-black/70 hover:bg-red-600 text-white rounded transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
