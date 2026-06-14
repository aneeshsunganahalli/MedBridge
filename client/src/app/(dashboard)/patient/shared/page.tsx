"use client";

import React from "react";
import ShareDialog from "@/features/sharing/components/share-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, ShieldCheck, QrCode, Lock } from "lucide-react";

export default function PatientSharedDocumentsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shared Access</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Share your medical files securely with consult doctors using temporary tokens.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Folder Sharing Card */}
        <Card className="border-border/60 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 mb-2">
              <Share2 className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Share Entire Folder</CardTitle>
            <CardDescription>
              Generates a secure web link granting temporary access to ALL documents in your medical vault. Handy for new doctor consultations.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ShareDialog
              title="Share Entire Medical Folder"
              triggerButton={
                <Button className="w-full gap-2">
                  <Share2 className="h-4 w-4" />
                  Generate Folder Link
                </Button>
              }
            />
          </CardContent>
        </Card>

        {/* Security Info Card */}
        <Card className="border-border/60 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Privacy & Encryption</CardTitle>
            <CardDescription>
              We protect your healthcare records using strict standards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 text-xs leading-relaxed text-muted-foreground">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <strong>Temporary Tokens:</strong> Access tokens default to 24-hour expiration windows. Access becomes unavailable once expired.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <QrCode className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <strong>Scan & Show:</strong> Doctors can scan the generated QR code directly from your phone screen in the clinic to view prescriptions.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
