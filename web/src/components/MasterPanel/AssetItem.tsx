import { File, Image, Music, Video } from "lucide-react";
import { Asset } from "../../api/types";
import { useStore } from "../../store/useStore";
import { formatBytes } from "../../utils/fileHelpers";
import { formatDate } from "../../utils/dateHelpers";
import clsx from "clsx";

const IconMap = {
  image: Image,
  video: Video,
  audio: Music,
  document: File,
  other: File,
};

export function AssetItem({ asset }: { asset: Asset }) {
  const { selectedAssetId, selectAsset, setUploadOpen } = useStore();
  const isSelected = selectedAssetId === asset.id;
  const Icon = IconMap[asset.file_type] || File;

  const handleClick = () => {
    selectAsset(asset.id);
    setUploadOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={clsx(
        "h-20 p-3 rounded-lg cursor-pointer border-l-[3px] transition-all flex items-center gap-3 group",
        isSelected
          ? "bg-selected-bg border-selected-border"
          : "bg-surface border-transparent hover:bg-gray-100 dark:hover:bg-gray-800",
      )}
    >
      <div className="w-14 h-14 flex-none rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {asset.file_type === "image" ? (
          <img
            src={`/api/v1/assets/${asset.id}/download`}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Icon
            className={clsx(
              "w-6 h-6",
              isSelected ? "text-primary" : "text-gray-500",
            )}
          />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {asset.original_filename}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span className="capitalize">{asset.file_type}</span>
          <span>•</span>
          <span className="font-mono">
            {formatBytes(asset.file_size_bytes)}
          </span>
        </div>
        <div className="text-[10px] text-gray-400 mt-1">
          {formatDate(asset.created_at)}
        </div>
      </div>
    </div>
  );
}
