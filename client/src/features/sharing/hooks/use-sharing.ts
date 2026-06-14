"use client";

import { useMutation } from "@tanstack/react-query";
import { sharingApi } from "@/lib/api";
import { ShareLinkCreate } from "@/types";
import { toast } from "sonner";

export function useSharing() {
  const createMutation = useMutation({
    mutationFn: (payload: ShareLinkCreate) => sharingApi.createShareLink(payload),
    onSuccess: () => {
      toast.success("Sharing link generated successfully!");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Failed to generate sharing link.";
      toast.error(msg);
    },
  });

  return {
    createShareLink: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    shareData: createMutation.data,
  };
}
