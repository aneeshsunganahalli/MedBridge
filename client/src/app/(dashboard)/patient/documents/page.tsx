"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DocumentList from "@/features/documents/components/document-list";
import { Button } from "@/components/ui/button";
import { FileUp, Share2 } from "lucide-react";
import ShareDialog from "@/features/sharing/components/share-dialog";

export default function PatientDocumentsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medical Records</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Store and manage your test reports, scans, and doctor prescriptions securely.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Share entire folder dialog trigger */}
          <ShareDialog
            title="Share Entire Medical Folder"
            triggerButton={
              <Button variant="outline" className="gap-1.5 shadow-sm">
                <Share2 className="h-4 w-4" />
                Share Folder
              </Button>
            }
          />
          <Button onClick={() => router.push("/patient/documents/upload")} className="gap-1.5 shadow-md">
            <FileUp className="h-4 w-4" />
            Upload File
          </Button>
        </div>
      </div>

      <DocumentList />
    </div>
  );
}
