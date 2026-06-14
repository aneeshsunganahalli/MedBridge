"use client";

import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Mail, Shield, Phone, CalendarDays } from "lucide-react";

export default function DoctorProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const registrationDate = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review your medical professional account credentials.
        </p>
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-secondary/15 py-8 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary text-3xl font-bold capitalize mb-4 shadow-sm border border-primary/10">
            {user.full_name[0]}
          </div>
          <CardTitle className="text-xl font-bold text-foreground">Dr. {user.full_name}</CardTitle>
          <CardDescription className="capitalize font-semibold text-xs text-primary mt-1">
            {user.role} Portal Access
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary" /> Email Address
              </label>
              <p className="text-sm font-semibold">{user.email}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" /> Phone Line
              </label>
              <p className="text-sm font-semibold">{user.phone || "Not provided"}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" /> Account Role
              </label>
              <p className="text-sm font-semibold capitalize">{user.role}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-primary" /> Registered On
              </label>
              <p className="text-sm font-semibold">{registrationDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
