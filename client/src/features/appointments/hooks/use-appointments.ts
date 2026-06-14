"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi } from "@/lib/api";
import { AppointmentCreate } from "@/types";
import { toast } from "sonner";

export function useAppointments(role: "patient" | "doctor" | null) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["appointments", role],
    queryFn: () =>
      role === "patient"
        ? appointmentsApi.listPatient()
        : appointmentsApi.listDoctor(),
    enabled: !!role,
  });

  const createMutation = useMutation({
    mutationFn: (newAppt: AppointmentCreate) => appointmentsApi.create(newAppt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Appointment booked successfully!");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Failed to book appointment.";
      toast.error(msg);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => appointmentsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Appointment cancelled successfully.");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Failed to cancel appointment.";
      toast.error(msg);
    },
  });

  return {
    appointments: listQuery.data || [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,
    bookAppointment: createMutation.mutateAsync,
    isBooking: createMutation.isPending,
    cancelAppointment: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  };
}
