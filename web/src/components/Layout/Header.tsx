import { Plus } from "lucide-react";
import { useStore } from "../../store/useStore";

export function Header() {
  const { setUploadOpen } = useStore();

  return (
    <header className="h-16 flex-none glass border-b border-border px-6 flex items-center justify-between z-30 sticky top-0 bg-surface/80">
      <div className="flex items-center gap-3 group cursor-default">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Orion <span className="text-primary">Asset Manager</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setUploadOpen(true)}
          className="group relative flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 font-medium transition-all duration-200 shadow-lg cursor-pointer"
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
