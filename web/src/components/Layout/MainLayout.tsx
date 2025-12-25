import { useState, useEffect, useRef } from "react";
import { useStore } from "../../store/useStore";
import { MasterPanel } from "../MasterPanel/MasterPanel";
import { DetailPanel } from "../DetailPanel/DetailPanel";

export function MainLayout() {
  const { masterPanelWidth, setMasterPanelWidth } = useStore();
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
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  return (
    <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
      <div
        style={{ width: `${masterPanelWidth}%` }}
        className="flex flex-col min-w-[400px]"
      >
        <MasterPanel />
      </div>

      <div
        className="w-[3px] hover:w-[4px] bg-border hover:bg-primary cursor-col-resize transition-all z-20 flex-none"
        onMouseDown={startResizing}
      />

      <div className="flex-1 flex flex-col min-w-[600px] bg-surface">
        <DetailPanel />
      </div>
    </div>
  );
}
