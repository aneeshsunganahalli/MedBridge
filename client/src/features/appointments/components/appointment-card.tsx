"use client";

import React, { useState } from "react";
import { Appointment } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/status-badge";
import { Calendar, Clock, Stethoscope, Trash2, Building, Loader2 } from "lucide-react";
import { useAppointments } from "../hooks/use-appointments";

export default function AppointmentCard({
  appointment,
  role,
}: {
  appointment: Appointment;
  role: "patient" | "doctor" | null;
}) {
  const { cancelAppointment, isCancelling } = useAppointments(role);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const handleCancel = async () => {
    setCancellingId(appointment.id);
    try {
      await cancelAppointment(appointment.id);
    } catch (err) {
      console.error(err);
    } finally {
      setCancellingId(null);
    }
  };

  const isCurrentCancelling = cancellingId === appointment.id;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-border/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-secondary/20">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Appointment #{appointment.id}</span>
        </div>
        <StatusBadge status={appointment.status} />
      </CardHeader>
      <CardContent className="pt-4 space-y-3.5">
        <div className="flex items-center gap-2.5 text-sm">
          <Calendar className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
          <span>{appointment.appointment_date}</span>
        </div>

        <div className="flex items-center gap-2.5 text-sm">
          <Clock className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
          <span>
            {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-sm">
          <Building className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            Clinic ID: <span className="font-medium text-foreground">{appointment.clinic_id}</span>
          </span>
        </div>

        <div className="text-xs text-muted-foreground border-t border-border/40 pt-3 flex justify-between">
          <span>
            {role === "patient" ? `Doctor ID: ${appointment.doctor_id}` : `Patient ID: ${appointment.patient_id}`}
          </span>
        </div>
      </CardContent>
      {appointment.status === "booked" && (
        <CardFooter className="bg-secondary/10 px-6 py-3 border-t border-border/40 flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            disabled={isCancelling}
            onClick={handleCancel}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            {isCurrentCancelling ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Cancel Visit
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
