import { File, Image, Music, Video, Trash2 } from "lucide-react";
import { useAssets, useDeleteAsset } from "../../hooks/useAssets";
import { Asset } from "../../api/types";

const IconMap = {
  image: Image,
  video: Video,
  audio: Music,
  document: File,
  other: File,
};

export function AssetList() {
  const { data: assets, isLoading } = useAssets();
  const { mutate: deleteAsset } = useDeleteAsset();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {assets?.map((asset: Asset) => {
        const Icon = IconMap[asset.file_type] || File;
        return (
          <div
            key={asset.id}
            className="border rounded-lg p-4 shadow-sm bg-white flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="p-2 bg-gray-100 rounded">
                <Icon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {asset.original_filename}
                </p>
                <p className="text-xs text-gray-500">
                  {(asset.file_size_bytes / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => deleteAsset(asset.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
