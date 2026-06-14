"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/hooks/use-dashboard";
import LoadingSpinner from "@/components/shared/loading-spinner";
import EmptyState from "@/components/shared/empty-state";
import StatusBadge from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  Bell,
  Plus,
  Upload,
  ArrowRight,
  Stethoscope,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { PatientDashboard } from "@/types";

export default function PatientDashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const router = useRouter();

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (isError || !data) {
    return (
      <div className="text-center p-8 bg-card border rounded-lg max-w-lg mx-auto mt-12">
        <h3 className="text-lg font-bold text-destructive">Failed to Load Dashboard</h3>
        <p className="text-sm text-muted-foreground mt-2">
          There was an error communicating with the server. Please try again.
        </p>
        <Button onClick={() => refetch()} className="mt-4" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  const stats = data as PatientDashboard;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Health Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here is an overview of your medical records and active appointment schedules.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Medical Records
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
              <FileText className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_documents}</div>
            <p className="text-xs text-muted-foreground mt-1">Uploaded clinical documents</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Appointments
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_appointments}</div>
            <p className="text-xs text-muted-foreground mt-1">Consultations scheduled in MedBridge</p>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-teal-500/5 to-primary/5 border-primary/10 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Quick Shortcuts</CardTitle>
            <CardDescription className="text-xs">Direct actions to manage your care</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/patient/documents/upload")}
              className="w-full justify-start text-xs font-semibold gap-1.5 h-9"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Record
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/patient/appointments")}
              className="w-full justify-start text-xs font-semibold gap-1.5 h-9"
            >
              <Plus className="h-3.5 w-3.5" />
              Book Care
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Appointments & Reminders */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Upcoming Appointments</CardTitle>
              <CardDescription>Your booked visits with doctors</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/patient/appointments")}
              className="text-primary gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.upcoming_appointments.length === 0 ? (
              <EmptyState
                title="No Upcoming Consultations"
                description="You do not have any consultations booked at the moment."
                icon={Stethoscope}
                actionText="Book Appointment"
                onAction={() => router.push("/patient/appointments")}
              />
            ) : (
              <div className="divide-y divide-border/40">
                {stats.upcoming_appointments.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">
                        Consultation (Doctor ID: {appt.doctor_id})
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span>{appt.appointment_date}</span>
                        <span>•</span>
                        <span>
                          {appt.start_time.slice(0, 5)} - {appt.end_time.slice(0, 5)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={appt.status} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/patient/appointments")}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Reminders */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Upcoming Reminders</CardTitle>
              <CardDescription>Active medication and health checklists</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/patient/reminders")}
              className="text-primary gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.upcoming_reminders.length === 0 ? (
              <EmptyState
                title="All Caught Up!"
                description="No medication or appointment reminders scheduled today."
                icon={Bell}
                actionText="Create Reminder"
                onAction={() => router.push("/patient/reminders")}
              />
            ) : (
              <div className="divide-y divide-border/40">
                {stats.upcoming_reminders.map((rem) => (
                  <div key={rem.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{rem.title}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span>{new Date(rem.reminder_time).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={rem.type} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/patient/reminders")}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
