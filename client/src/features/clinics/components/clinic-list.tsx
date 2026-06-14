"use client";

import React from "react";
import { useClinics } from "../hooks/use-clinics";
import ClinicForm from "./clinic-form";
import LoadingSpinner from "@/components/shared/loading-spinner";
import EmptyState from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Phone, MapPin, Edit3 } from "lucide-react";

export default function ClinicList() {
  const { clinics, isLoading, isError, refetch } = useClinics();

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (isError) {
    return (
      <div className="text-center p-6 bg-card border rounded-lg max-w-sm mx-auto">
        <p className="text-destructive font-bold">Failed to load clinics</p>
        <button onClick={() => refetch()} className="text-xs text-primary hover:underline mt-2">
          Try again
        </button>
      </div>
    );
  }

  if (clinics.length === 0) {
    return (
      <EmptyState
        title="No Clinics Registered"
        description="You have not created any clinic locations yet. Add a clinic to schedule consultations."
        icon={Building2}
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {clinics.map((clinic) => (
        <Card key={clinic.id} className="hover:shadow-md transition-shadow border-border/60 flex flex-col justify-between">
          <div>
            <CardHeader className="bg-secondary/10 pb-3 flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-primary shrink-0" />
                <CardTitle className="text-sm font-bold truncate max-w-[180px]">
                  {clinic.name}
                </CardTitle>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground px-2 py-0.5 bg-background rounded-full border border-border/40">
                ID: {clinic.id}
              </span>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {clinic.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 h-8 leading-relaxed">
                  {clinic.description}
                </p>
              )}

              {clinic.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{clinic.phone}</span>
                </div>
              )}

              {clinic.address && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">{clinic.address}</span>
                </div>
              )}
            </CardContent>
          </div>

          <div className="bg-secondary/5 px-4 py-3 border-t border-border/40 flex justify-end">
            <ClinicForm
              clinic={clinic}
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs font-semibold">
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Details
                </Button>
              }
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
