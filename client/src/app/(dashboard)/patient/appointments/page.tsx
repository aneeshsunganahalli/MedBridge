"use client";

import React from "react";
import BookAppointmentDialog from "@/features/appointments/components/book-appointment-dialog";
import AppointmentList from "@/features/appointments/components/appointment-list";

export default function PatientAppointmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consultations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Book new appointments or review your healthcare history.
          </p>
        </div>
        <BookAppointmentDialog />
      </div>

      <AppointmentList role="patient" />
    </div>
  );
}
