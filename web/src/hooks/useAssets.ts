import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Assets } from "../api/types";
import { toast } from "sonner";

export function useAssets(page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: ["assets", page, limit],
    queryFn: async () => {
      const { data } = await api.get<Assets>(
        `/assets?page=${page}&limit=${limit}`,
      );
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
