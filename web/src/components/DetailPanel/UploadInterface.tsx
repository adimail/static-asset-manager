import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, CheckCircle, AlertCircle, File } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useUpload } from "../../hooks/useUpload";
import { toast } from "sonner";
import clsx from "clsx";

export function UploadInterface() {
  const { setUploadOpen } = useStore();
  const { mutateAsync } = useUpload();
  const [uploads, setUploads] = useState<
    Array<{
      file: File;
      status: "pending" | "uploading" | "success" | "error";
      progress: number;
      error?: string;
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
          toast.success(`Uploaded ${item.file.name}`);
        } catch (e: any) {
          const errorMessage = e.response?.data || e.message || "Upload failed";
          setUploads((prev) =>
            prev.map((u) =>
              u.file === item.file
                ? {
                    ...u,
                    status: "error",
                    progress: 0,
                    error:
                      typeof errorMessage === "string"
                        ? errorMessage
                        : "Server error",
                  }
                : u,
            ),
          );
          toast.error(`Failed to upload ${item.file.name}`);
        }
      });
    },
    [mutateAsync],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !uploads.length) {
      open();
    }
  };

  const hasActiveUploads = uploads.length > 0;

  return (
    <div className="h-full flex flex-col p-8 bg-bg" onKeyDown={handleKeyDown}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Upload Files</h2>
        <button
          onClick={() => setUploadOpen(false)}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-highlight rounded-full transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>
      </div>

      {!hasActiveUploads ? (
        <div
          {...getRootProps()}
          onClick={open}
          tabIndex={0}
          className={clsx(
            "flex-1 border-2 border-dashed flex flex-col items-center justify-center bg-primary-light transition-all duration-300 cursor-pointer group outline-none focus:ring-2 focus:ring-primary",
            isDragActive
              ? "border-primary scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-surface-highlight/50",
          )}
        >
          <input {...getInputProps()} />
          <div className="w-20 h-20 bg-amber-700 flex items-center justify-center shadow-xl mb-8 group-hover:scale-110 transition-transform duration-300">
            <UploadCloud size={40} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Drag & Drop files here
          </h3>
          <p className="text-text-muted mb-8">
            or click to browse from your computer
          </p>
          <button className="bg-surface border border-border text-text-primary px-6 py-2.5 font-medium shadow-sm hover:bg-surface-highlight transition-colors pointer-events-none">
            Browse Files
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {uploads.map((upload, idx) => (
            <div
              key={idx}
              className="bg-surface p-4 border border-border shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-highlight flex items-center justify-center flex-none">
                  <File size={20} className="text-text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1.5">
                    <span className="font-medium text-sm text-text-primary truncate">
                      {upload.file.name}
                    </span>
                    <span
                      className={clsx(
                        "text-xs font-medium",
                        upload.status === "success"
                          ? "text-green-500"
                          : upload.status === "error"
                            ? "text-red-500"
                            : "text-primary",
                      )}
                    >
                      {upload.status === "success"
                        ? "Completed"
                        : upload.status === "error"
                          ? "Failed"
                          : `${upload.progress}%`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-highlight rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        "h-full transition-all duration-500 ease-out rounded-full",
                        upload.status === "success"
                          ? "bg-green-500"
                          : upload.status === "error"
                            ? "bg-red-500"
                            : "bg-amber-700",
                      )}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex-none">
                  {upload.status === "success" && (
                    <CheckCircle size={20} className="text-green-500" />
                  )}
                  {upload.status === "error" && (
                    <AlertCircle size={20} className="text-red-500" />
                  )}
                </div>
              </div>

              {upload.status === "error" && upload.error && (
                <div className="ml-14 text-xs text-red-600 dark:text-red-400 font-medium animate-slide-up">
                  Reason: {upload.error}
                </div>
              )}
            </div>
          ))}

          {uploads.every(
            (u) => u.status === "success" || u.status === "error",
          ) && (
            <div className="flex justify-center mt-8">
              <button
                autoFocus
                onClick={() => {
                  setUploads([]);
                  setUploadOpen(false);
                }}
                className="text-primary hover:text-primary-hover font-medium hover:underline cursor-pointer"
              >
                Return to list
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
