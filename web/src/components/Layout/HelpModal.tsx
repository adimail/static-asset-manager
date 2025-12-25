import { X } from "lucide-react";
import { useStore } from "../../store/useStore";

export function HelpModal() {
  const { isHelpOpen, setHelpOpen } = useStore();

  if (!isHelpOpen) return null;

  const shortcuts = [
    { key: "Ctrl/Cmd + U", desc: "Open upload interface" },
    { key: "Ctrl/Cmd + F", desc: "Focus search input" },
    { key: "/", desc: "Focus search (alternative)" },
    { key: "Esc", desc: "Close / Clear selection / Cancel" },
    { key: "↑ / ↓", desc: "Navigate between items" },
    { key: "Home / End", desc: "Jump to first / last item" },
    { key: "Enter / Space", desc: "Select item" },
    { key: "Delete", desc: "Trigger delete confirmation" },
    { key: "?", desc: "Show this help menu" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-border w-full max-w-md shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setHelpOpen(false)}
            className="text-text-muted hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">{s.desc}</span>
              <kbd className="px-2 py-1 bg-surface-highlight border border-border rounded text-xs font-mono text-primary font-bold">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
        <div className="p-6 bg-surface-highlight/30 border-t border-border text-center">
          <button
            onClick={() => setHelpOpen(false)}
            className="px-6 py-2 bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
