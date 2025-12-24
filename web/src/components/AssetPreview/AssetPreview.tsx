import { X } from "lucide-react";
import { Asset } from "../../api/types";

interface AssetPreviewProps {
  asset: Asset | null;
  onClose: () => void;
}

export function AssetPreview({ asset, onClose }: AssetPreviewProps) {
  if (!asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold truncate">
            {asset.original_filename}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
          {asset.file_type === "image" ? (
            <img
              src={`/api/v1/assets/${asset.id}/download`}
              alt={asset.original_filename}
              className="max-w-full max-h-[60vh] object-contain"
            />
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">
                Preview not available for this file type.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
