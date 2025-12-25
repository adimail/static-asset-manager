import { useState } from "react";
import { X, Trash2, Copy, Check, ExternalLink, ArrowLeft } from "lucide-react";
import { Asset } from "../../api/types";
import { useStore } from "../../store/useStore";
import { useDeleteAsset } from "../../hooks/useAssets";
import { formatBytes } from "../../utils/fileHelpers";
import { formatDate } from "../../utils/dateHelpers";
import { toast } from "sonner";
import clsx from "clsx";

export function AssetPreview({ asset }: { asset: Asset }) {
  const { selectAsset } = useStore();
  const { mutate: deleteAsset } = useDeleteAsset();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleDelete = () => {
    deleteAsset(asset.id, {
      onSuccess: () => {
        toast.success("File deleted successfully");
        selectAsset(null);
      },
      onError: () => {
        toast.error("Failed to delete file");
      },
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field === "id" ? "Asset ID" : "URL"} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadUrl = `/api/v1/assets/${asset.id}/download`;

  return (
    <div
      className="h-full flex flex-col"
      role="region"
      aria-label="Asset preview"
    >
      {/* Header */}
      <div
        className={clsx(
          "h-16 flex-none px-6 flex items-center justify-between border-b border-border transition-colors",
          showDeleteConfirm ? "bg-red-50 dark:bg-red-900/20" : "bg-surface",
        )}
      >
        {showDeleteConfirm ? (
          <div
            className="flex items-center justify-between w-full"
            role="alert"
          >
            <span className="text-red-600 font-medium">Delete this file?</span>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 overflow-hidden">
              <button
                onClick={() => selectAsset(null)}
                className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Back to list"
              >
                <ArrowLeft size={20} />
              </button>
              <h2
                className="font-medium truncate max-w-md"
                title={asset.original_filename}
              >
                {asset.original_filename}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                title="Delete"
                aria-label="Delete asset"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => selectAsset(null)}
                className="hidden md:block p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                title="Close"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-0 md:p-8 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
        {asset.file_type === "image" ? (
          <img
            src={downloadUrl}
            alt={asset.original_filename}
            className="max-w-full max-h-full object-contain shadow-lg"
          />
        ) : asset.file_type === "video" ? (
          <video
            src={downloadUrl}
            controls
            className="max-w-full max-h-full shadow-lg bg-black"
          />
        ) : asset.file_type === "audio" ? (
          <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 shadow-lg">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 flex items-center justify-center rounded-full">
                <span className="text-4xl">🎵</span>
              </div>
            </div>
            <h3 className="text-center font-medium mb-4 truncate">
              {asset.original_filename}
            </h3>
            <audio src={downloadUrl} controls className="w-full" />
          </div>
        ) : asset.file_type === "document" && asset.extension === ".pdf" ? (
          <object
            data={downloadUrl}
            type="application/pdf"
            className="w-full h-full shadow-lg bg-white"
          >
            <div className="flex flex-col items-center justify-center h-full">
              <p className="mb-4">Unable to display PDF directly.</p>
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink size={16} /> Download PDF
              </a>
            </div>
          </object>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">📦</span>
            </div>
            <p className="text-gray-500">No preview available</p>
            <a
              href={downloadUrl}
              download
              className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
            >
              <ExternalLink size={16} /> Download File
            </a>
          </div>
        )}
      </div>

      {/* Metadata Footer */}
      <div className="flex-none bg-bg border-t border-border p-6">
        <h3 className="font-medium mb-4">File Information</h3>
        <div className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
          <span className="text-gray-500">Type</span>
          <span className="capitalize">{asset.file_type} Document</span>

          <span className="text-gray-500">Size</span>
          <span>
            {formatBytes(asset.file_size_bytes)} (
            {asset.file_size_bytes.toLocaleString()} bytes)
          </span>

          <span className="text-gray-500">Uploaded</span>
          <span>{formatDate(asset.created_at)}</span>

          <span className="text-gray-500">Asset ID</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs">{asset.id}</span>
            <button
              onClick={() => copyToClipboard(asset.id, "id")}
              className="text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-0.5 border border-primary/30 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Copy Asset ID"
            >
              {copiedField === "id" ? <Check size={10} /> : <Copy size={10} />}
              {copiedField === "id" ? "Copied!" : "Copy"}
            </button>
          </div>

          <span className="text-gray-500">Public URL</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs truncate max-w-[200px]">
              {downloadUrl}
            </span>
            <button
              onClick={() =>
                copyToClipboard(window.location.origin + downloadUrl, "url")
              }
              className="text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-0.5 border border-primary/30 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Copy Public URL"
            >
              {copiedField === "url" ? <Check size={10} /> : <Copy size={10} />}
              {copiedField === "url" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
