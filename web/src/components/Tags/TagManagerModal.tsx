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

const COLORS = [
  "#38bdf8",
  "#818cf8",
  "#c084fc",
  "#f472b6",
  "#fb7185",
  "#f97316",
  "#facc15",
  "#4ade80",
  "#2dd4bf",
  "#94a3b8",
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
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const targetAssetIds = useMemo(
    () =>
      isSelectionMode
        ? selectedAssetIds
        : selectedAssetId
          ? [selectedAssetId]
          : [],
    [isSelectionMode, selectedAssetIds, selectedAssetId],
  );

  useEffect(() => {
    if (isTagModalOpen && assetsData?.assets && targetAssetIds.length > 0) {
      const targets = assetsData.assets.filter((a) =>
        targetAssetIds.includes(a.id),
      );

      if (targets.length > 0) {
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
      { name: newTagName.trim(), color: selectedColor },
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
      { id: editingTagId, name: editName.trim(), color: editColor },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-border w-full max-w-md shadow-2xl rounded-xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <TagIcon size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">
              {targetAssetIds.length > 0
                ? "Tag Selected Assets"
                : "Manage Tags"}
            </h3>
          </div>
          <button
            onClick={() => setTagModalOpen(false)}
            className="text-text-muted hover:text-text-primary p-1 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <form
            onSubmit={handleCreate}
            className="space-y-3 bg-surface-highlight/30 p-3.5 rounded-lg border border-border"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Create new tag..."
                className="flex-1 h-8 px-2.5 bg-surface border border-border rounded text-xs text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
              <button
                type="submit"
                disabled={isCreating || !newTagName.trim()}
                className="px-3 bg-primary text-background font-semibold text-xs rounded hover:bg-primary-hover disabled:opacity-40 cursor-pointer transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={clsx(
                    "w-5 h-5 rounded-full transition-transform hover:scale-110 cursor-pointer",
                    selectedColor === color &&
                      "ring-2 ring-primary ring-offset-2 ring-offset-surface",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </form>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              {targetAssetIds.length > 0
                ? "Select Tags to Apply"
                : "Existing Tags"}
            </label>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-text-muted">
                Loading tags...
              </div>
            ) : tags?.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-muted">
                No tags created yet
              </div>
            ) : (
              <div className="space-y-1.5">
                {tags?.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  const isEditing = editingTagId === tag.id;
                  const isDeleting = deleteConfirmId === tag.id;

                  if (isEditing) {
                    return (
                      <div
                        key={tag.id}
                        className="flex items-center gap-2 p-2 bg-surface-highlight/40 rounded border border-primary/50"
                      >
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 h-7 px-2 bg-surface border border-border rounded text-xs"
                          autoFocus
                        />
                        <button
                          onClick={saveEdit}
                          className="p-1 bg-emerald-500 text-white rounded cursor-pointer"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingTagId(null)}
                          className="p-1 text-text-muted rounded cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  }

                  if (isDeleting) {
                    return (
                      <div
                        key={tag.id}
                        className="p-2.5 bg-red-950/30 border border-red-800/60 rounded flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 text-xs text-red-400">
                          <AlertTriangle size={14} />
                          <span>Delete #{tag.name}? (Files remain safe)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-0.5 text-[11px] text-text-secondary hover:text-white cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(tag.id)}
                            className="px-2 py-0.5 text-[11px] bg-red-600 text-white rounded font-medium cursor-pointer"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={tag.id}
                      className={clsx(
                        "group flex items-center justify-between p-2 rounded-md border transition-all cursor-pointer",
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-surface border-border hover:border-border-focused",
                      )}
                      onClick={() => toggleTagSelection(tag.id)}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-none"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-xs font-medium text-text-primary truncate">
                          {tag.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {isSelected && (
                          <Check size={14} className="text-primary mr-1" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(tag);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-text-primary rounded cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(tag.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-400 rounded cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-border bg-surface/50 flex justify-end gap-2">
          <button
            onClick={() => setTagModalOpen(false)}
            className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded cursor-pointer"
          >
            Cancel
          </button>
          {targetAssetIds.length > 0 && (
            <button
              onClick={handleApply}
              disabled={isTagging}
              className="px-4 py-1.5 bg-primary text-background font-semibold text-xs rounded hover:bg-primary-hover disabled:opacity-50 cursor-pointer shadow-sm transition-colors"
            >
              {isTagging ? "Applying..." : "Save Tags"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
