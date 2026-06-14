"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { dashboardApi } from "@/lib/api";

export function useDashboard() {
  const { user } = useAuth();

  const doctorQuery = useQuery({
    queryKey: ["dashboard", "doctor"],
    queryFn: dashboardApi.getDoctorData,
    enabled: user?.role === "doctor",
  });

  const patientQuery = useQuery({
    queryKey: ["dashboard", "patient"],
    queryFn: dashboardApi.getPatientData,
    enabled: user?.role === "patient",
  });

  const isLoading = user?.role === "doctor" ? doctorQuery.isLoading : patientQuery.isLoading;
  const isError = user?.role === "doctor" ? doctorQuery.isError : patientQuery.isError;
  const error = user?.role === "doctor" ? doctorQuery.error : patientQuery.error;
  const data = user?.role === "doctor" ? doctorQuery.data : patientQuery.data;
  const refetch = user?.role === "doctor" ? doctorQuery.refetch : patientQuery.refetch;

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
