import { useEffect, useRef } from "react";
import {
  Search,
  X,
  Image,
  Video,
  Music,
  FileText,
  FileCode,
  MoreHorizontal,
  LayoutGrid,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { useTags } from "../../hooks/useTags";
import { FileType } from "../../api/types";
import clsx from "clsx";

const CATEGORIES: { type: FileType; label: string; icon: any }[] = [
  { type: "image", label: "Images", icon: Image },
  { type: "video", label: "Videos", icon: Video },
  { type: "audio", label: "Audio", icon: Music },
  { type: "document", label: "Docs", icon: FileText },
  { type: "code", label: "Code", icon: FileCode },
  { type: "other", label: "Other", icon: MoreHorizontal },
];

export function FilterBar() {
  const {
    filterTypes,
    toggleFilterType,
    clearFilters,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    shouldFocusSearch,
    tagFilter,
    setTagFilter,
    viewMode,
    setViewMode,
  } = useStore();

  const { data: tags } = useTags();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shouldFocusSearch > 0) {
      searchRef.current?.focus();
      searchRef.current?.select();
    }
  }, [shouldFocusSearch]);

  return (
    <div className="p-4 space-y-4 flex-none bg-sidebar/50 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
      <div className="relative group">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors"
          size={16}
        />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-8 bg-surface-highlight/50 border border-border text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-surface transition-all outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 w-full">
        <button
          onClick={clearFilters}
          className={clsx(
            "flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer",
            filterTypes.length === 0
              ? "bg-primary border-primary text-white shadow-sm"
              : "bg-surface border-border text-text-secondary hover:border-primary/50 hover:bg-surface-highlight/30",
          )}
        >
          <LayoutGrid size={12} />
          All
        </button>
        {CATEGORIES.map((cat) => {
          const isActive = filterTypes.includes(cat.type);
          const Icon = cat.icon;
          return (
            <button
              key={cat.type}
              onClick={() => toggleFilterType(cat.type)}
              className={clsx(
                "flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer",
                isActive
                  ? "bg-primary border-primary text-white shadow-sm"
                  : "bg-surface border-border text-text-secondary hover:border-primary/50 hover:bg-surface-highlight/30",
              )}
            >
              <Icon size={12} />
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <select
          value={tagFilter || ""}
          onChange={(e) => setTagFilter(e.target.value || null)}
          className="h-9 px-2 bg-surface border border-border text-xs font-medium text-text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer hover:bg-surface-highlight transition-colors"
        >
          <option value="">All Tags</option>
          {tags?.map((tag) => (
            <option key={tag.id} value={tag.name}>
              {tag.name}
            </option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as any)}
          className="h-9 px-2 bg-surface border border-border text-xs font-medium text-text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer hover:bg-surface-highlight transition-colors"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="size-desc">Size (Large)</option>
          <option value="size-asc">Size (Small)</option>
        </select>

        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as any)}
          className="h-9 px-2 bg-surface border border-border text-xs font-medium text-text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer hover:bg-surface-highlight transition-colors"
        >
          <option value="list">List View</option>
          <option value="grid">Grid View</option>
        </select>
      </div>
    </div>
  );
}
