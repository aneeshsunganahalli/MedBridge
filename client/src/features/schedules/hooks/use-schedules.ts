"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { schedulesApi } from "@/lib/api";
import { ScheduleCreate, ScheduleUpdate } from "@/types";
import { toast } from "sonner";

export function useSchedules() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["schedules"],
    queryFn: schedulesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (newSchedule: ScheduleCreate) => schedulesApi.create(newSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Schedule slot created successfully!");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Failed to create schedule slot.";
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ScheduleUpdate }) =>
      schedulesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Schedule slot updated successfully!");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Failed to update schedule slot.";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => schedulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Schedule slot deleted successfully.");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Failed to delete schedule slot.";
      toast.error(msg);
    },
  });

  return {
    schedules: listQuery.data || [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,
    createSchedule: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateSchedule: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteSchedule: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
