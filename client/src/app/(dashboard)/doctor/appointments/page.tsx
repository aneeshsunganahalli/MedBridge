"use client";

import React from "react";
import AppointmentList from "@/features/appointments/components/appointment-list";

export default function DoctorAppointmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Consultations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review booked appointments and patient consult times.
        </p>
      </div>

      <AppointmentList role="doctor" />
    </div>
  );
}
