"use client";

import React from "react";
import ScheduleList from "@/features/schedules/components/schedule-list";
import ScheduleForm from "@/features/schedules/components/schedule-form";

export default function DoctorSchedulesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Schedules</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Specify your daily practice hours. Patients can request bookings within these periods.
          </p>
        </div>
        <ScheduleForm />
      </div>

      <ScheduleList />
    </div>
  );
}
