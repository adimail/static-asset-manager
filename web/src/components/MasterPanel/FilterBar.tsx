import { useEffect, useRef } from "react";
import { Search, X, Filter, ArrowUpDown } from "lucide-react";
import { useStore } from "../../store/useStore";
import { FileType } from "../../api/types";

export function FilterBar() {
  const {
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    shouldFocusSearch,
  } = useStore();

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shouldFocusSearch > 0) {
      searchRef.current?.focus();
      searchRef.current?.select();
    }
  }, [shouldFocusSearch]);

  return (
    <div className="p-4 space-y-3 flex-none bg-sidebar/50 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
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

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            size={14}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FileType | "all")}
            className="w-full h-9 pl-9 pr-8 bg-surface border border-border text-xs font-medium text-text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer hover:bg-surface-highlight transition-colors"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="relative flex-1">
          <ArrowUpDown
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            size={14}
          />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full h-9 pl-9 pr-8 bg-surface border border-border text-xs font-medium text-text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer hover:bg-surface-highlight transition-colors"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name-asc">A-Z</option>
            <option value="name-desc">Z-A</option>
            <option value="size-desc">Largest</option>
            <option value="size-asc">Smallest</option>
          </select>
        </div>
      </div>
    </div>
  );
}
