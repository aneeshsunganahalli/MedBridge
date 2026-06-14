"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { remindersApi } from "@/lib/api";
import { ReminderCreate, ReminderUpdate } from "@/types";
import { toast } from "sonner";

export function useReminders() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["reminders"],
    queryFn: remindersApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (newReminder: ReminderCreate) => remindersApi.create(newReminder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Reminder created successfully!");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Failed to create reminder.";
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReminderUpdate }) =>
      remindersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Reminder updated successfully!");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Failed to update reminder.";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remindersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Reminder deleted successfully.");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Failed to delete reminder.";
      toast.error(msg);
    },
  });

  return {
    reminders: listQuery.data || [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,
    createReminder: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateReminder: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteReminder: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
