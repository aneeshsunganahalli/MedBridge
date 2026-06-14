import React from "react";
import UploadForm from "@/features/documents/components/upload-form";

export default function UploadDocumentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Document</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add a new clinical record to your secure vault.
        </p>
      </div>

      <div className="flex justify-center md:pt-4">
        <UploadForm />
      </div>
    </div>
  );
}
