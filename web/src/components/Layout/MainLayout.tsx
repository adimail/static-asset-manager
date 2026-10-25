import { useState, useEffect, useRef } from "react";
import { useStore } from "../../store/useStore";
import { MasterPanel } from "../MasterPanel/MasterPanel";
import { DetailPanel } from "../DetailPanel/DetailPanel";
import { useUpload } from "../../hooks/useUpload";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

export function MainLayout() {
  const {
    masterPanelWidth,
    setMasterPanelWidth,
    selectedAssetId,
    isUploadOpen,
  } = useStore();
  const [isResizing, setIsResizing] = useState(false);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  const { mutateAsync: uploadFile } = useUpload();

  const startResizing = () => setIsResizing(true);
  const stopResizing = () => setIsResizing(false);

  const resize = (e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const newWidth = (e.clientX / containerWidth) * 100;
      if (newWidth >= 30 && newWidth <= 70) {
        setMasterPanelWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer?.types?.includes("Files")) {
        setIsDraggingGlobal(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        setIsDraggingGlobal(false);
        dragCounter.current = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingGlobal(false);
      dragCounter.current = 0;

      if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return;

      const files = Array.from(e.dataTransfer.files);
      toast.info(
        `Uploading ${files.length} asset${files.length > 1 ? "s" : ""}...`,
      );

      for (const file of files) {
        try {
          await uploadFile(file);
          toast.success(`Uploaded ${file.name}`);
        } catch (err: any) {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [uploadFile]);

  const hasSelectionOrUpload = selectedAssetId !== null || isUploadOpen;

  return (
    <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
      {isDraggingGlobal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-primary animate-fade-in pointer-events-none">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary">
            <UploadCloud size={48} />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            Drop files anywhere to import
          </h2>
          <p className="text-xs text-text-muted">
            Instant upload to your library
          </p>
        </div>
      )}

      <div
        className={clsx(
          "flex flex-col bg-bg transition-[width] duration-150 ease-out",
          hasSelectionOrUpload ? "border-r border-border" : "w-full",
        )}
        style={{
          width: hasSelectionOrUpload
            ? window.innerWidth >= 768
              ? `${masterPanelWidth}%`
              : "100%"
            : "100%",
        }}
      >
        <MasterPanel />
      </div>

      {hasSelectionOrUpload && (
        <div
          className="hidden md:block w-1 hover:w-1.5 bg-border hover:bg-primary cursor-col-resize z-20 flex-none transition-all"
          onMouseDown={startResizing}
        />
      )}

      {hasSelectionOrUpload && (
        <div className="flex-1 flex flex-col bg-surface overflow-hidden">
          <DetailPanel />
        </div>
      )}
    </div>
  );
}
