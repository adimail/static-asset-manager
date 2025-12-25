import { useStore } from "../../store/useStore";
import { useAssets } from "../../hooks/useAssets";
import { UploadInterface } from "./UploadInterface";
import { AssetPreview } from "./AssetPreview";
import { FolderOpen } from "lucide-react";

export function DetailPanel() {
  const { isUploadOpen, selectedAssetId } = useStore();
  const { data: assets } = useAssets();

  const selectedAsset = assets?.find((a) => a.id === selectedAssetId);

  if (isUploadOpen) {
    return <UploadInterface />;
  }

  if (selectedAssetId && selectedAsset) {
    return <AssetPreview asset={selectedAsset} />;
  }

  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
      <FolderOpen size={64} className="mb-6 opacity-20" />
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        Select an asset to preview
      </h2>
      <p className="text-sm mt-2">
        Choose a file from the list or upload new files
      </p>
    </div>
  );
}
