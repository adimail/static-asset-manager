import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Assets } from "../api/types";
import { toast } from "sonner";

export function useAssets(
  page: number = 1,
  limit: number = 50,
  tag: string | null = null,
) {
  return useQuery({
    queryKey: ["assets", page, limit, tag],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (tag) {
        params.append("tags", tag);
      }

      const { data } = await api.get<Assets>(`/assets?${params.toString()}`);
      return data;
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useBulkDeleteAssets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await api.post("/assets/bulk/delete", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useCompressAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/assets/${id}/compress`);
    },
    onSuccess: () => {
      toast.success("Compression started");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: () => {
      toast.error("Failed to start compression");
    },
  });
}

export function useBulkCompressAssets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await api.post("/assets/bulk/compress", { ids });
    },
    onSuccess: () => {
      toast.success("Bulk compression started");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: () => {
      toast.error("Failed to start bulk compression");
    },
  });
}
