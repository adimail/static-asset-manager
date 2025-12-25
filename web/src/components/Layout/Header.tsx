import { Moon, Sun, Monitor, Plus, Command } from "lucide-react";
import { useStore } from "../../store/useStore";
import clsx from "clsx";

export function Header() {
  const { theme, setTheme, setUploadOpen } = useStore();

  return (
    <header className="h-16 flex-none glass border-b border-border px-6 flex items-center justify-between z-30 sticky top-0">
      <div className="flex items-center gap-3 group cursor-default">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Orion <span className="text-primary">Asset Manager</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center bg-surface-highlight/50 p-1 border border-border/50">
          {[
            { id: "light", icon: Sun, label: "Light" },
            { id: "system", icon: Monitor, label: "System" },
            { id: "dark", icon: Moon, label: "Dark" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTheme(item.id as any)}
              className={clsx(
                "p-1.5 transition-all cursor-pointer duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50",
                theme === item.id
                  ? "bg-surface shadow-sm text-primary scale-105"
                  : "text-text-muted hover:text-text-primary hover:bg-surface/50",
              )}
              title={item.label}
            >
              <item.icon size={16} />
            </button>
          ))}
        </div>

        <button
          onClick={() => setUploadOpen(true)}
          className="group relative flex items-center gap-2 bg-amber-700 text-white px-5 py-2.5 font-medium transition-all duration-200 shadow-lg shadow-black-500/25 hover:shadow-black-500/40 cursor-pointer"
        >
          <Plus
            size={18}
            className="group-hover:rotate-90 transition-transform duration-300"
          />
          <span>Upload</span>
        </button>
      </div>
    </header>
  );
}
