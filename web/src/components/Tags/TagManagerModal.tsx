import { useState, useEffect, useMemo } from "react";
import { X, Plus, Tag as TagIcon, Check } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useTags, useCreateTag, useBulkTagAssets } from "../../hooks/useTags";
import { useAssets } from "../../hooks/useAssets";
import clsx from "clsx";

const COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ec4899", // pink
  "#64748b", // slate
];

export function TagManagerModal() {
  const {
    isTagModalOpen,
    setTagModalOpen,
    selectedAssetIds,
    selectedAssetId,
    isSelectionMode,
    clearSelection,
    currentPage,
  } = useStore();

  const { data: tags, isLoading } = useTags();
  const { data: assetsData } = useAssets(currentPage);
  const { mutate: createTag, isPending: isCreating } = useCreateTag();
  const { mutate: bulkTag, isPending: isTagging } = useBulkTagAssets();

  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[6]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Determine target assets
  const targetAssetIds = useMemo(
    () =>
      isSelectionMode
        ? selectedAssetIds
        : selectedAssetId
          ? [selectedAssetId]
          : [],
    [isSelectionMode, selectedAssetIds, selectedAssetId],
  );

  // Pre-select tags based on target assets
  useEffect(() => {
    if (isTagModalOpen && assetsData?.assets && targetAssetIds.length > 0) {
      const targets = assetsData.assets.filter((a) =>
        targetAssetIds.includes(a.id),
      );

      if (targets.length > 0) {
        // Find intersection of tags: tags present in ALL selected assets
        const firstAssetTags = targets[0].tags.map((t) => t.id);
        const commonTags = firstAssetTags.filter((tagId) =>
          targets.every((a) => a.tags.some((t) => t.id === tagId)),
        );
        setSelectedTagIds(commonTags);
      } else {
        setSelectedTagIds([]);
      }
    } else if (!isTagModalOpen) {
      setSelectedTagIds([]);
      setNewTagName("");
    }
  }, [isTagModalOpen, assetsData, targetAssetIds]);

  if (!isTagModalOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    createTag(
      { name: newTagName, color: selectedColor },
      {
        onSuccess: () => setNewTagName(""),
      },
    );
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleApply = () => {
    if (targetAssetIds.length === 0) return;

    bulkTag(
      { assetIds: targetAssetIds, tagIds: selectedTagIds },
      {
        onSuccess: () => {
          setTagModalOpen(false);
          if (isSelectionMode) clearSelection();
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-border w-full max-w-lg shadow-2xl animate-scale-in flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <TagIcon size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Manage Tags
              </h2>
              <p className="text-xs text-text-muted">
                {targetAssetIds.length > 0
                  ? `Applying to ${targetAssetIds.length} asset${targetAssetIds.length > 1 ? "s" : ""}`
                  : "Create and manage tags"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setTagModalOpen(false)}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Create New Tag */}
          <form
            onSubmit={handleCreate}
            className="space-y-3 bg-surface-highlight/20 p-4 rounded-lg border border-border/50"
          >
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Create New Tag
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name..."
                className="flex-1 h-10 px-3 bg-surface border border-border rounded text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <button
                type="submit"
                disabled={isCreating || !newTagName.trim()}
                className="px-4 bg-primary text-white font-medium rounded hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={clsx(
                    "w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-2 ring-offset-surface",
                    selectedColor === color
                      ? "ring-primary scale-110"
                      : "ring-transparent",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </form>

          {/* Tag List */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Available Tags
            </label>
            {isLoading ? (
              <div className="text-center py-4 text-text-muted">
                Loading tags...
              </div>
            ) : tags?.length === 0 ? (
              <div className="text-center py-4 text-text-muted italic">
                No tags created yet.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags?.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTagSelection(tag.id)}
                      className={clsx(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-2",
                        isSelected
                          ? "bg-primary/10 border-primary text-primary shadow-sm"
                          : "bg-surface border-border text-text-secondary hover:border-primary/50",
                      )}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-surface-highlight/10 flex justify-end gap-3">
          <button
            onClick={() => setTagModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-highlight/50 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={targetAssetIds.length === 0 || isTagging}
            className="px-6 py-2 bg-primary text-white font-medium rounded hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {isTagging ? "Applying..." : "Apply Tags"}
          </button>
        </div>
      </div>
    </div>
  );
}
