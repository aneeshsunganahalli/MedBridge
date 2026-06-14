"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clinicsApi } from "@/lib/api";
import { ClinicCreate, ClinicUpdate } from "@/types";
import { toast } from "sonner";

export function useClinics() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["clinics"],
    queryFn: clinicsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (newClinic: ClinicCreate) => clinicsApi.create(newClinic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Clinic added successfully!");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Failed to create clinic.";
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClinicUpdate }) =>
      clinicsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      toast.success("Clinic updated successfully!");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Failed to update clinic.";
      toast.error(msg);
    },
  });

  return {
    clinics: listQuery.data || [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,
    createClinic: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateClinic: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
