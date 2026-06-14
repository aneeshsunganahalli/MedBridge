"use client";

import React from "react";
import { useAppointments } from "../hooks/use-appointments";
import AppointmentCard from "./appointment-card";
import LoadingSpinner from "@/components/shared/loading-spinner";
import EmptyState from "@/components/shared/empty-state";
import { Stethoscope } from "lucide-react";

export default function AppointmentList({
  role,
}: {
  role: "patient" | "doctor" | null;
}) {
  const { appointments, isLoading, isError, refetch } = useAppointments(role);

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (isError) {
    return (
      <div className="text-center p-6 bg-card border rounded-lg max-w-sm mx-auto">
        <p className="text-destructive font-bold">Failed to load appointments</p>
        <button onClick={() => refetch()} className="text-xs text-primary hover:underline mt-2">
          Try again
        </button>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <EmptyState
        title="No Appointments Scheduled"
        description="You do not have any consultations listed in your schedule."
        icon={Stethoscope}
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {appointments.map((appt) => (
        <AppointmentCard key={appt.id} appointment={appt} role={role} />
      ))}
    </div>
  );
}
