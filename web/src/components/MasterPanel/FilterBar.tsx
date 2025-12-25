import { Search, X } from "lucide-react";
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
  } = useStore();

  return (
    <div className="p-4 border-b border-border bg-surface space-y-3 flex-none">
      <div className="relative">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FileType | "all")}
          className="w-full h-10 pl-3 pr-8 bg-white dark:bg-gray-800 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none"
        >
          <option value="all">All Types</option>
          <option value="image">Images</option>
          <option value="document">Documents</option>
          <option value="video">Videos</option>
          <option value="audio">Audio</option>
          <option value="other">Other</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
          ▼
        </div>
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-8 bg-white dark:bg-gray-800 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="relative">
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as any)}
          className="w-full h-10 pl-3 pr-8 bg-white dark:bg-gray-800 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none"
        >
          <option value="newest">Sort: Newest First</option>
          <option value="oldest">Sort: Oldest First</option>
          <option value="name-asc">Sort: Name (A-Z)</option>
          <option value="name-desc">Sort: Name (Z-A)</option>
          <option value="size-desc">Sort: Largest First</option>
          <option value="size-asc">Sort: Smallest First</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
          ▼
        </div>
      </div>
    </div>
  );
}
