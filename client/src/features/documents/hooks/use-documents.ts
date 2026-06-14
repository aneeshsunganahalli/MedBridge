"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/lib/api";
import { toast } from "sonner";

export function useDocuments(tag?: string) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["documents", tag],
    queryFn: () => documentsApi.list(tag),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => documentsApi.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Document uploaded and processed successfully!");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Failed to upload document.";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Document deleted successfully.");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Failed to delete document.";
      toast.error(msg);
    },
  });

  return {
    documents: listQuery.data || [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,
    uploadDocument: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
