import { useState, useEffect } from "react";
import {
  X,
  Trash2,
  Copy,
  Check,
  ArrowLeft,
  FileText,
  Download,
} from "lucide-react";
import { Asset } from "../../api/types";
import { useStore } from "../../store/useStore";
import { useDeleteAsset } from "../../hooks/useAssets";
import { formatBytes } from "../../utils/fileHelpers";
import { formatDate } from "../../utils/dateHelpers";
import { toast } from "sonner";

export function AssetPreview({ asset }: { asset: Asset }) {
  const { selectAsset, showDeleteConfirm, setShowDeleteConfirm } = useStore();
  const { mutate: deleteAsset } = useDeleteAsset();
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
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadUrl = `/api/v1/assets/${asset.id}/download`;

  return (
    <div className="h-full flex flex-col bg-bg animate-fade-in">
      <div className="h-16 flex-none px-6 flex items-center justify-between border-b border-border bg-surface/50 backdrop-blur-sm z-10">
        {showDeleteConfirm ? (
          <div className="flex items-center justify-between w-full bg-red-50 dark:bg-red-900/20 p-2 border border-red-200 dark:border-red-800 animate-scale-in">
            <span className="text-red-600 dark:text-red-400 font-medium px-2">
              Delete this file?
            </span>
            <div className="flex gap-2">
              <button
                autoFocus
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-white/50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 shadow-sm transition-colors cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 overflow-hidden">
              <button
                onClick={() => selectAsset(null)}
                className="md:hidden p-2 -ml-2 text-text-secondary hover:bg-surface-highlight rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex flex-col">
                <h2
                  className="font-semibold text-text-primary truncate max-w-md"
                  title={asset.original_filename}
                >
                  {asset.original_filename}
                </h2>
                <span className="text-xs text-text-muted">
                  {formatBytes(asset.file_size_bytes)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={downloadUrl}
                download
                className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                title="Download"
              >
                <Download size={18} />
              </a>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => selectAsset(null)}
                className="hidden md:block p-2 text-text-secondary hover:bg-surface-highlight transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center bg-surface-highlight/30">
        <div className="relative w-full h-full max-w-4xl max-h-[800px] flex items-center justify-center overflow-hidden">
          {asset.file_type === "image" ? (
            <img
              src={downloadUrl}
              alt={asset.original_filename}
              className="max-w-full max-h-full object-contain"
            />
          ) : asset.file_type === "video" ? (
            <video
              src={downloadUrl}
              controls
              className="max-w-full max-h-full bg-black w-full h-full"
            />
          ) : asset.file_type === "audio" ? (
            <div className="w-full max-w-xl p-8 flex flex-col items-center">
              <div className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg mb-8">
                <span className="text-5xl">🎵</span>
              </div>
              <h3 className="text-center font-medium mb-6 truncate w-full text-lg text-primary">
                {asset.original_filename}
              </h3>
              <audio src={downloadUrl} controls className="w-full" />
            </div>
          ) : asset.file_type === "document" && asset.extension === ".pdf" ? (
            <object
              data={downloadUrl}
              type="application/pdf"
              className="w-full h-full bg-white"
            >
              <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <p className="mb-4">Preview not available</p>
                <a href={downloadUrl} className="text-primary hover:underline">
                  Download PDF
                </a>
              </div>
            </object>
          ) : (
            <div className="text-center p-8">
              <div className="w-24 h-24 bg-surface-highlight mx-auto mb-6 flex items-center justify-center">
                <FileText size={48} className="text-text-muted" />
              </div>
              <p className="text-text-secondary mb-4">No preview available</p>
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-hover transition-colors shadow-lg"
              >
                <Download size={16} /> Download File
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="flex-none bg-surface border-t border-border p-6 md:p-8">
        <h3 className="font-semibold text-lg mb-6 text-text-primary">
          File Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <InfoRow
              label="Type"
              value={`${asset.file_type} (${asset.extension})`}
            />
            <InfoRow label="Size" value={formatBytes(asset.file_size_bytes)} />
            <InfoRow label="Uploaded" value={formatDate(asset.created_at)} />
          </div>
          <div className="space-y-4">
            <div className="group">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1 block">
                Asset ID
              </label>
              <div className="flex items-center gap-2 bg-surface-highlight p-2 border border-border">
                <code className="text-xs font-mono text-text-secondary flex-1 truncate">
                  {asset.id}
                </code>
                <button
                  onClick={() => copyToClipboard(asset.id, "id")}
                  className="text-text-muted hover:text-primary cursor-pointer"
                >
                  {copiedField === "id" ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>
            <div className="group">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1 block">
                Public URL
              </label>
              <div className="flex items-center gap-2 bg-surface-highlight p-2 border border-border">
                <code className="text-xs font-mono text-text-secondary flex-1 truncate">
                  {window.location.origin}
                  {downloadUrl}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(window.location.origin + downloadUrl, "url")
                  }
                  className="text-text-muted hover:text-primary cursor-pointer"
                >
                  {copiedField === "url" ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
        {label}
      </span>
      <span className="text-sm text-text-primary font-medium">{value}</span>
    </div>
  );
}
