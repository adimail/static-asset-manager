import { useState, useEffect } from "react";
import axios from "axios";
import { useStore } from "../../store/useStore";

export function Footer() {
  const { setHelpOpen } = useStore();
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    axios
      .get("http://localhost:8080/internal/health")
      .then((res) => {
        setIsHealthy(res.data?.status === "healthy");
      })
      .catch(() => setIsHealthy(false));
  }, []);

  return (
    <footer className="h-8 flex-none border-t border-border bg-surface/50 backdrop-blur-sm px-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-text-muted z-30">
      <div className="flex items-center gap-4">
        <span>Asset Manager v1.0.0</span>

        {isHealthy === true && (
          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500 font-bold animate-fade-in">
            <div className="w-1 h-1 rounded-full bg-current" />
            <span>All systems nominal</span>
          </div>
        )}

        {isHealthy === false && (
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-500 font-bold animate-fade-in">
            <div className="w-1 h-1 rounded-full bg-current" />
            <span>System health degraded</span>
          </div>
        )}
      </div>

      <button
        onClick={() => setHelpOpen(true)}
        className="hover:text-primary transition-colors cursor-pointer font-bold flex items-center"
      >
        Press{" "}
        <span className="bg-surface-highlight px-1.5 py-0.5 border border-border rounded mx-1 text-primary">
          ?
        </span>{" "}
        for help
      </button>
    </footer>
  );
}
