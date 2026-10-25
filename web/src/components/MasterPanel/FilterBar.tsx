import { useEffect, useRef, useState } from "react";
import {
  Search,
  X,
  Image,
  Video,
  Music,
  FileText,
  FileCode,
  LayoutGrid,
  List,
  Layers,
  ChevronDown,
  Check,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { useTags } from "../../hooks/useTags";
import { FileType } from "../../api/types";
import clsx from "clsx";

const CATEGORIES: { type: FileType | "all"; label: string; icon: any }[] = [
  { type: "all", label: "All", icon: Layers },
  { type: "image", label: "Images", icon: Image },
  { type: "video", label: "Videos", icon: Video },
  { type: "audio", label: "Audio", icon: Music },
  { type: "document", label: "Docs", icon: FileText },
  { type: "code", label: "Code", icon: FileCode },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
  { value: "size-desc", label: "Largest Size" },
  { value: "size-asc", label: "Smallest Size" },
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
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const [isTagOpen, setIsTagOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    if (shouldFocusSearch > 0) {
      searchRef.current?.focus();
      searchRef.current?.select();
    }
  }, [shouldFocusSearch]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(e.target as Node)
      ) {
        setIsTagOpen(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target as Node)
      ) {
        setIsSortOpen(false);
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleCategorySelect = (type: FileType | "all") => {
    if (type === "all") {
      clearFilters();
    } else {
      clearFilters();
      toggleFilterType(type);
    }
  };

  const selectedSortLabel =
    SORT_OPTIONS.find((s) => s.value === sortOrder)?.label || "Sort";

  return (
    <div className="p-3.5 space-y-3 flex-none bg-surface/80 border-b border-border backdrop-blur-md sticky top-0 z-20">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          size={14}
        />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search filenames..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-8 pl-8 pr-12 bg-surface-highlight/40 border border-border rounded-md text-xs text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="text-text-muted hover:text-text-primary p-1 rounded-full cursor-pointer"
            >
              <X size={12} />
            </button>
          ) : (
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[9px] text-text-muted font-mono pointer-events-none">
              /
            </kbd>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive =
            cat.type === "all"
              ? filterTypes.length === 0
              : filterTypes.includes(cat.type);
          const Icon = cat.icon;
          return (
            <button
              key={cat.type}
              onClick={() => handleCategorySelect(cat.type)}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer border",
                isActive
                  ? "bg-primary text-background border-primary font-semibold shadow-xs"
                  : "bg-surface border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary",
              )}
            >
              <Icon size={12} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <div ref={tagDropdownRef} className="relative flex-1 min-w-[120px]">
          <button
            type="button"
            onClick={() => {
              setIsTagOpen(!isTagOpen);
              setIsSortOpen(false);
            }}
            className="w-full h-8 px-2.5 bg-surface border border-border hover:border-border-focused rounded-md text-xs text-text-secondary hover:text-text-primary flex items-center justify-between gap-1 transition-colors cursor-pointer"
          >
            <span className="truncate">
              {tagFilter ? `#${tagFilter}` : "All Tags"}
            </span>
            <ChevronDown size={12} className="text-text-muted flex-none" />
          </button>

          {isTagOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 max-h-56 overflow-y-auto bg-surface border border-border rounded-md shadow-xl p-1 z-50">
              <button
                type="button"
                onClick={() => {
                  setTagFilter(null);
                  setIsTagOpen(false);
                }}
                className={clsx(
                  "w-full px-2 py-1.5 text-left text-xs rounded flex items-center justify-between cursor-pointer",
                  tagFilter === null
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
                )}
              >
                <span>All Tags</span>
                {tagFilter === null && <Check size={12} />}
              </button>
              {tags?.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTagFilter(t.name);
                    setIsTagOpen(false);
                  }}
                  className={clsx(
                    "w-full px-2 py-1.5 text-left text-xs rounded flex items-center justify-between cursor-pointer",
                    tagFilter === t.name
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full flex-none"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="truncate">#{t.name}</span>
                  </span>
                  {tagFilter === t.name && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={sortDropdownRef} className="relative flex-1 min-w-[120px]">
          <button
            type="button"
            onClick={() => {
              setIsSortOpen(!isSortOpen);
              setIsTagOpen(false);
            }}
            className="w-full h-8 px-2.5 bg-surface border border-border hover:border-border-focused rounded-md text-xs text-text-secondary hover:text-text-primary flex items-center justify-between gap-1 transition-colors cursor-pointer"
          >
            <span className="truncate">{selectedSortLabel}</span>
            <ChevronDown size={12} className="text-text-muted flex-none" />
          </button>

          {isSortOpen && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-surface border border-border rounded-md shadow-xl p-1 z-50">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSortOrder(opt.value as any);
                    setIsSortOpen(false);
                  }}
                  className={clsx(
                    "w-full px-2 py-1.5 text-left text-xs rounded flex items-center justify-between cursor-pointer",
                    sortOrder === opt.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
                  )}
                >
                  <span>{opt.label}</span>
                  {sortOrder === opt.value && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center bg-surface border border-border rounded-md p-0.5 flex-none">
          <button
            onClick={() => setViewMode("grid")}
            className={clsx(
              "p-1.5 rounded cursor-pointer transition-colors",
              viewMode === "grid"
                ? "bg-surface-highlight text-primary"
                : "text-text-muted hover:text-text-primary",
            )}
            title="Grid view"
          >
            <LayoutGrid size={13} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={clsx(
              "p-1.5 rounded cursor-pointer transition-colors",
              viewMode === "list"
                ? "bg-surface-highlight text-primary"
                : "text-text-muted hover:text-text-primary",
            )}
            title="List view"
          >
            <List size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
