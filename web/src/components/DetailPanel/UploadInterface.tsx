import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, CheckCircle, AlertCircle } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useUpload } from "../../hooks/useUpload";
import clsx from "clsx";

export function UploadInterface() {
  const { setUploadOpen } = useStore();
  const { mutateAsync } = useUpload();
  const [uploads, setUploads] = useState<
    Array<{
      file: File;
      status: "pending" | "uploading" | "success" | "error";
      progress: number;
    }>
  >([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newUploads = acceptedFiles.map((file) => ({
        file,
        status: "pending" as const,
        progress: 0,
      }));
      setUploads((prev) => [...prev, ...newUploads]);

      newUploads.forEach(async (item) => {
        try {
          setUploads((prev) =>
            prev.map((u) =>
              u.file === item.file
                ? { ...u, status: "uploading", progress: 50 }
                : u,
            ),
          );
          await mutateAsync(item.file);
          setUploads((prev) =>
            prev.map((u) =>
              u.file === item.file
                ? { ...u, status: "success", progress: 100 }
                : u,
            ),
          );
        } catch (e) {
          setUploads((prev) =>
            prev.map((u) =>
              u.file === item.file ? { ...u, status: "error", progress: 0 } : u,
            ),
          );
        }
      });
    },
    [mutateAsync],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const hasActiveUploads = uploads.length > 0;

  return (
    <div className="h-full flex flex-col p-8">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setUploadOpen(false)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <X size={24} />
        </button>
      </div>

      {!hasActiveUploads ? (
        <div
          {...getRootProps()}
          className={clsx(
            "flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer",
            isDragActive
              ? "border-primary bg-blue-50 dark:bg-blue-900/20 scale-[1.01]"
              : "border-gray-300 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800/50",
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud size={64} className="text-gray-400 mb-6" />
          <h3 className="text-lg font-medium mb-2">Drag and drop files here</h3>
          <p className="text-gray-500 text-sm mb-6">or</p>
          <button className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Choose Files
          </button>
          <p className="mt-8 text-xs text-gray-400">
            Supported: Images, PDFs, Audio, Video, Docs • Max size: 100MB
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4">
          <h3 className="text-lg font-medium mb-6">
            Uploading {uploads.length} files...
          </h3>
          {uploads.map((upload, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-border"
            >
              <div className="flex justify-between mb-2">
                <span className="font-medium truncate">{upload.file.name}</span>
                {upload.status === "success" && (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle size={14} /> Complete
                  </span>
                )}
                {upload.status === "error" && (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> Failed
                  </span>
                )}
                {upload.status === "uploading" && (
                  <span className="text-primary">{upload.progress}%</span>
                )}
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    "h-full transition-all duration-300",
                    upload.status === "success"
                      ? "bg-green-500"
                      : upload.status === "error"
                        ? "bg-red-500"
                        : "bg-primary",
                  )}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            </div>
          ))}
          {uploads.every(
            (u) => u.status === "success" || u.status === "error",
          ) && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => {
                  setUploads([]);
                  setUploadOpen(false);
                }}
                className="text-primary hover:underline"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
