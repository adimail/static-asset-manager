import { Moon, Sun, Monitor, Plus } from "lucide-react";
import { useStore } from "../../store/useStore";
import clsx from "clsx";

export function Header() {
  const { theme, setTheme, setUploadOpen } = useStore();

  return (
    <header className="h-16 flex-none bg-surface border-b border-border px-6 flex items-center justify-between z-10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Asset Manager</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setTheme("light")}
            className={clsx(
              "p-1.5 rounded-md transition-all",
              theme === "light"
                ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
            )}
            title="Light Mode"
          >
            <Sun size={16} />
          </button>
          <button
            onClick={() => setTheme("system")}
            className={clsx(
              "p-1.5 rounded-md transition-all",
              theme === "system"
                ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
            )}
            title="System Theme"
          >
            <Monitor size={16} />
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={clsx(
              "p-1.5 rounded-md transition-all",
              theme === "dark"
                ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
            )}
            title="Dark Mode"
          >
            <Moon size={16} />
          </button>
        </div>

        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          <span>Upload Files</span>
        </button>
      </div>
    </header>
  );
}
