import { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Tag as TagIcon,
  Check,
  Trash2,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import {
  useTags,
  useCreateTag,
  useBulkTagAssets,
  useDeleteTag,
  useUpdateTag,
} from "../../hooks/useTags";
import { useAssets } from "../../hooks/useAssets";
import clsx from "clsx";
import { toast } from "sonner";

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
  const { mutate: deleteTag } = useDeleteTag();
  const { mutate: updateTag } = useUpdateTag();

  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[6]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
      setEditingTagId(null);
      setDeleteConfirmId(null);
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
    if (editingTagId) return;
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

  const startEditing = (tag: { id: string; name: string; color: string }) => {
    setEditingTagId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
    setDeleteConfirmId(null);
  };

  const saveEdit = () => {
    if (!editingTagId || !editName.trim()) return;
    updateTag(
      { id: editingTagId, name: editName, color: editColor },
      {
        onSuccess: () => setEditingTagId(null),
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteTag(id, {
      onSuccess: () => setDeleteConfirmId(null),
    });
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
            className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
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
                    "w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-2 ring-offset-surface cursor-pointer",
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
              <div className="space-y-2">
                {tags?.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  const isEditing = editingTagId === tag.id;
                  const isDeleting = deleteConfirmId === tag.id;

                  if (isEditing) {
                    return (
                      <div
                        key={tag.id}
                        className="flex items-center gap-2 p-2 bg-surface-highlight/30 rounded border border-primary/50"
                      >
                        <div className="flex-1 flex flex-col gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 px-2 bg-surface border border-border rounded text-sm w-full"
                            autoFocus
                          />
                          <div className="flex gap-1.5 flex-wrap">
                            {COLORS.map((color) => (
                              <button
                                key={color}
                                onClick={() => setEditColor(color)}
                                className={clsx(
                                  "w-4 h-4 rounded-full cursor-pointer",
                                  editColor === color
                                    ? "ring-2 ring-primary ring-offset-1"
                                    : "",
                                )}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={saveEdit}
                            className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingTagId(null)}
                            className="p-1.5 bg-surface border border-border text-text-secondary rounded hover:bg-surface-highlight"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (isDeleting) {
                    return (
                      <div
                        key={tag.id}
                        className="flex flex-col gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"
                      >
                        <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
                          <AlertTriangle size={16} className="mt-0.5" />
                          <div className="text-xs">
                            <p className="font-bold">Delete "{tag.name}"?</p>
                            <p>
                              This will also delete ALL assets with this tag!
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-1">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs font-medium bg-white dark:bg-black/20 border border-border rounded hover:bg-surface-highlight"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(tag.id)}
                            className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Confirm Delete
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={tag.id}
                      className={clsx(
                        "group flex items-center justify-between p-2 rounded border transition-all",
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-surface border-border hover:border-primary/30",
                      )}
                    >
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => toggleTagSelection(tag.id)}
                      >
                        <div className="relative">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5">
                              <Check size={8} />
                            </div>
                          )}
                        </div>
                        <span
                          className={clsx(
                            "text-sm font-medium",
                            isSelected ? "text-primary" : "text-text-secondary",
                          )}
                        >
                          {tag.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(tag);
                          }}
                          className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded cursor-pointer"
                          title="Edit Tag"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(tag.id);
                          }}
                          className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer"
                          title="Delete Tag"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
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
