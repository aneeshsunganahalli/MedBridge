"use client";

import React from "react";
import ReminderList from "@/features/reminders/components/reminder-list";
import ReminderForm from "@/features/reminders/components/reminder-form";

export default function PatientRemindersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reminders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan, edit, and keep track of medication logs and clinical appointments.
          </p>
        </div>
        <ReminderForm />
      </div>

      <ReminderList />
    </div>
  );
}
