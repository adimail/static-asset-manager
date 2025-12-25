import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Tag } from "../api/types";
import { toast } from "sonner";

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data } = await api.get<Tag[]>("/tags");
      return data;
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tag: { name: string; color: string }) => {
      const { data } = await api.post<Tag>("/tags", tag);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag created");
    },
    onError: () => {
      toast.error("Failed to create tag");
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tag: { id: string; name: string; color: string }) => {
      const { data } = await api.put<Tag>(`/tags/${tag.id}`, {
        name: tag.name,
        color: tag.color,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Tag updated");
    },
    onError: () => {
      toast.error("Failed to update tag");
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Tag and associated assets deleted");
    },
    onError: () => {
      toast.error("Failed to delete tag");
    },
  });
}

export function useBulkTagAssets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      assetIds,
      tagIds,
    }: {
      assetIds: string[];
      tagIds: string[];
    }) => {
      await api.post("/tags/bulk/assets", {
        asset_ids: assetIds,
        tag_ids: tagIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Assets tagged successfully");
    },
    onError: () => {
      toast.error("Failed to tag assets");
    },
  });
}
