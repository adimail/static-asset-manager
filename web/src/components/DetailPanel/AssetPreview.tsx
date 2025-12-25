import { useState, useEffect, useRef } from "react";
import {
  X,
  Trash2,
  Copy,
  Check,
  ArrowLeft,
  FileText,
  Download,
  Music,
  Zap,
  Tag as TagIcon,
} from "lucide-react";
import { Asset } from "../../api/types";
import { useStore } from "../../store/useStore";
import { useDeleteAsset, useCompressAsset } from "../../hooks/useAssets";
import { formatBytes } from "../../utils/fileHelpers";
import { formatDate } from "../../utils/dateHelpers";
import { toast } from "sonner";
import { api } from "../../api/client";

export function AssetPreview({ asset }: { asset: Asset }) {
  const {
    selectAsset,
    setShowDeleteConfirm,
    showDeleteConfirm,
    setTagModalOpen,
  } = useStore();
  const { mutate: deleteAsset } = useDeleteAsset();
  const { mutate: compressAsset } = useCompressAsset();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const textExtensions = [
    ".txt",
    ".json",
    ".ts",
    ".tsx",
    ".py",
    ".js",
    ".jsx",
    ".md",
    ".go",
    ".yaml",
    ".yml",
    ".css",
    ".html",
    ".sql",
    ".sh",
    ".ini",
    ".conf",
  ];

  const isPreviewableText =
    asset.file_type === "code" ||
    textExtensions.includes(asset.extension.toLowerCase());

  const apiPath = `/assets/${asset.id}/download`;
  const publicUrl = `/api/v1${apiPath}`;

  const canCompress =
    (asset.file_type === "image" || asset.file_type === "video") &&
    !asset.is_compressed;

  useEffect(() => {
    if (isPreviewableText) {
      setIsLoadingText(true);
      api
        .get(apiPath, { responseType: "text" })
        .then((res) => setTextContent(res.data))
        .catch(() => setTextContent("Error loading preview content."))
        .finally(() => setIsLoadingText(false));
    }
  }, [asset.id, isPreviewableText, apiPath]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const isInput = ["INPUT", "TEXTAREA"].includes(
          (e.target as HTMLElement).tagName,
        );
        if (isInput) return;

        const media = videoRef.current || audioRef.current;
        if (media) {
          e.preventDefault();
          if (media.paused) media.play();
          else media.pause();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      videoRef.current?.pause();
      audioRef.current?.pause();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

  const handleCompress = () => {
    compressAsset(asset.id);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Copied ${field} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="h-16 flex-none px-6 flex items-center justify-between border-b border-border bg-surface/50 backdrop-blur-sm z-10">
        {showDeleteConfirm ? (
          <div className="flex items-center justify-between w-full bg-red-50 dark:bg-red-900/20 p-2 border border-red-200 dark:border-red-800">
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
                className="md:hidden p-2 -ml-2 text-text-secondary hover:bg-surface-highlight rounded-full transition-colors cursor-pointer"
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
              <button
                onClick={() => setTagModalOpen(true)}
                className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                title="Add Tags"
              >
                <TagIcon size={18} />
              </button>
              {canCompress && (
                <button
                  onClick={handleCompress}
                  className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  title="Compress"
                >
                  <Zap size={18} />
                </button>
              )}
              <a
                href={publicUrl}
                download
                className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
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
        <div className="relative w-full h-full max-w-4xl flex items-center justify-center overflow-hidden">
          {asset.file_type === "image" ? (
            <img
              src={publicUrl}
              alt={asset.original_filename}
              className="max-w-full max-h-full object-contain shadow-xl"
            />
          ) : asset.file_type === "video" ? (
            <video
              ref={videoRef}
              src={publicUrl}
              controls
              className="max-w-full max-h-full bg-black w-full h-full"
            />
          ) : asset.file_type === "audio" ? (
            <div className="w-full max-w-xl p-8 bg-surface border border-border shadow-xl flex flex-col items-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Music size={40} className="text-primary" />
              </div>
              <audio
                ref={audioRef}
                src={publicUrl}
                controls
                className="w-full"
              />
            </div>
          ) : isPreviewableText ? (
            <div className="w-full h-full bg-surface border border-border p-6 overflow-auto font-mono text-sm text-text-primary shadow-inner">
              {isLoadingText ? (
                <div className="flex items-center gap-2 text-text-muted">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Loading content...
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-all">
                  {textContent}
                </pre>
              )}
            </div>
          ) : (
            <div className="text-center p-8">
              <div className="w-24 h-24 bg-surface-highlight mx-auto mb-6 flex items-center justify-center">
                <FileText size={48} className="text-text-muted" />
              </div>
              <p className="text-text-secondary mb-4">No preview available</p>
              <a
                href={publicUrl}
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-hover transition-colors shadow-lg cursor-pointer"
              >
                <Download size={16} /> Download File
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="flex-none bg-surface border-t border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => copyToClipboard(asset.id, "Asset ID")}
            className="group cursor-pointer p-4 bg-surface-highlight/20 border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all"
          >
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">
              Asset ID (Click to copy)
            </label>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs font-mono text-text-secondary truncate">
                {asset.id}
              </code>
              {copiedField === "Asset ID" ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy
                  size={14}
                  className="text-text-muted opacity-0 group-hover:opacity-100"
                />
              )}
            </div>
          </div>
          <div
            onClick={() =>
              copyToClipboard(window.location.origin + publicUrl, "Public URL")
            }
            className="group cursor-pointer p-4 bg-surface-highlight/20 border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all"
          >
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">
              Public URL (Click to copy)
            </label>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs font-mono text-text-secondary truncate">
                {window.location.origin}
                {publicUrl}
              </code>
              {copiedField === "Public URL" ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy
                  size={14}
                  className="text-text-muted opacity-0 group-hover:opacity-100"
                />
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-6 text-xs text-text-muted border-t border-border/50 pt-4">
          <div>
            <span className="font-bold uppercase mr-2">Type:</span>{" "}
            {asset.file_type} ({asset.extension})
          </div>
          <div>
            <span className="font-bold uppercase mr-2">Size:</span>{" "}
            {formatBytes(asset.file_size_bytes)}
          </div>
          <div>
            <span className="font-bold uppercase mr-2">Date:</span>{" "}
            {formatDate(asset.created_at)}
          </div>
          {asset.is_compressed && (
            <div>
              <span className="font-bold uppercase mr-2 text-green-600">
                Compressed
              </span>
              {asset.compression_ratio && (
                <span>({(asset.compression_ratio * 100).toFixed(0)}%)</span>
              )}
            </div>
          )}
        </div>
        {asset.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {asset.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 rounded-full text-xs font-medium border border-border"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  borderColor: `${tag.color}40`,
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
