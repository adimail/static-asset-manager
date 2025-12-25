import { useStore } from "../../store/useStore";
import { useAssets } from "../../hooks/useAssets";
import { UploadInterface } from "./UploadInterface";
import { AssetPreview } from "./AssetPreview";
import { FolderOpen } from "lucide-react";

export function DetailPanel() {
  const { isUploadOpen, selectedAssetId, currentPage } = useStore();
  const { data } = useAssets(currentPage);

  const selectedAsset = data?.assets?.find((a) => a.id === selectedAssetId);

  if (isUploadOpen) {
    return <UploadInterface />;
  }

  if (selectedAssetId && selectedAsset) {
    return <AssetPreview key={selectedAsset.id} asset={selectedAsset} />;
  }

  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
      <FolderOpen size={64} className="mb-6 opacity-20" />
      <h2 className="text-lg font-medium text-gray-500">
        Select an asset to preview
      </h2>
    </div>
  );
}
