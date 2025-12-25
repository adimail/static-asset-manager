import { FileText, Image, Music, Video, File } from "lucide-react";
import { Asset } from "../../api/types";
import { useStore } from "../../store/useStore";
import { formatBytes } from "../../utils/fileHelpers";
import { formatDate } from "../../utils/dateHelpers";
import clsx from "clsx";

const IconMap = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  other: File,
};

const ColorMap = {
  image: "text-purple-500 bg-purple-500/10",
  video: "text-pink-500 bg-pink-500/10",
  audio: "text-cyan-500 bg-cyan-500/10",
  document: "text-blue-500 bg-blue-500/10",
  other: "text-gray-500 bg-gray-500/10",
};

export function AssetItem({ asset }: { asset: Asset }) {
  const { selectedAssetId, selectAsset, setUploadOpen } = useStore();
  const isSelected = selectedAssetId === asset.id;
  const Icon = IconMap[asset.file_type] || File;
  const colorClass = ColorMap[asset.file_type] || ColorMap.other;

  const handleClick = () => {
    selectAsset(asset.id);
    setUploadOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      id={`asset-${asset.id}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="listitem"
      tabIndex={0}
      className={clsx(
        "group relative p-3 cursor-pointer transition-all duration-200  border",
        isSelected
          ? "bg-primary-light border-primary/30 shadow-sm"
          : "bg-transparent border-transparent hover:bg-surface hover:shadow-md hover:border-border/50",
      )}
    >
      {/* Left Accent Border for Selected State */}
      {isSelected && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
      )}

      <div
        className={clsx("flex items-center gap-4")}
      >
        {/* Icon / Thumbnail */}
        <div
          className={clsx(
            "w-12 h-12 flex-none overflow-hidden flex items-center justify-center transition-transform duration-200",
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
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={clsx(
              "text-sm font-medium truncate transition-colors text-primary"
            )}
          >
            {asset.original_filename}
          </h3>
          <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
            <span className="capitalize">{asset.file_type}</span>
            <span className="w-1 h-1 rounded-full bg-text-muted/50" />
            <span className="font-mono">
              {formatBytes(asset.file_size_bytes)}
            </span>
          </div>
        </div>

        <div className="text-[10px] text-text-muted hidden sm:block">
          {formatDate(asset.created_at)}
        </div>
      </div>
    </div>
  );
}
