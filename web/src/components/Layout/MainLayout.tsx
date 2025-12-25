import { useState, useEffect, useRef } from "react";
import { useStore } from "../../store/useStore";
import { MasterPanel } from "../MasterPanel/MasterPanel";
import { DetailPanel } from "../DetailPanel/DetailPanel";
import clsx from "clsx";

export function MainLayout() {
  const {
    masterPanelWidth,
    setMasterPanelWidth,
    selectedAssetId,
    isUploadOpen,
  } = useStore();
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = () => setIsResizing(true);
  const stopResizing = () => setIsResizing(false);

  const resize = (e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const newWidth = (e.clientX / containerWidth) * 100;
      if (newWidth >= 20 && newWidth <= 60) {
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

  const showDetail = selectedAssetId !== null || isUploadOpen;

  return (
    <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
      <div
        className={clsx(
          "flex flex-col bg-bg border-r border-border",
          "w-full md:w-auto absolute md:relative inset-0 md:inset-auto z-10 md:z-0",
          showDetail ? "hidden md:flex" : "flex",
        )}
        style={{
          width: window.innerWidth >= 768 ? `${masterPanelWidth}%` : "100%",
        }}
      >
        <MasterPanel />
      </div>

      <div
        className="hidden md:block w-[3px] hover:w-[4px] bg-border hover:bg-primary cursor-col-resize z-20 flex-none"
        onMouseDown={startResizing}
      />

      <div
        className={clsx(
          "flex-1 flex flex-col bg-surface",
          "w-full md:w-auto absolute md:relative inset-0 md:inset-auto z-20 md:z-0",
          showDetail ? "flex" : "hidden md:flex",
        )}
      >
        <DetailPanel />
      </div>
    </div>
  );
}
