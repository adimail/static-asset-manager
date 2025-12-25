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
    <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-fade-in">
      <FolderOpen size={64} className="mb-6 opacity-20" />
      <h2 className="text-lg font-medium text-gray-500">
        Select an asset to preview
      </h2>
      <p className="text-sm mt-2">
        Choose a file from the list or upload new files
      </p>
      <div className="mt-8 flex gap-4 text-[10px] uppercase tracking-widest opacity-50">
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-surface-highlight border border-border rounded">
            ↑↓
          </kbd>
          <span>Navigate</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-surface-highlight border border-border rounded">
            Enter
          </kbd>
          <span>Select</span>
        </div>
      </div>
    </div>
  );
}
