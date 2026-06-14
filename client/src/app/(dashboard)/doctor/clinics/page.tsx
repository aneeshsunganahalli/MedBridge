"use client";

import React from "react";
import ClinicList from "@/features/clinics/components/clinic-list";
import ClinicForm from "@/features/clinics/components/clinic-form";

export default function DoctorClinicsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clinics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register and manage the clinical locations where you practice.
          </p>
        </div>
        <ClinicForm />
      </div>

      <ClinicList />
    </div>
  );
}
