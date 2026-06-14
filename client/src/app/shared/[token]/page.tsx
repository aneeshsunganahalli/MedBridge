"use client";

import React, { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { sharingApi } from "@/lib/api";
import DocumentCard from "@/features/documents/components/document-card";
import LoadingSpinner from "@/components/shared/loading-spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Calendar, FileText, AlertTriangle } from "lucide-react";

export default function PublicSharedDocumentsPage({
  params: paramsPromise,
}: {
  params: Promise<{ token: string }>;
}) {
  const params = use(paramsPromise);
  const token = params.token;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["shared-documents", token],
    queryFn: () => sharingApi.accessSharedDocuments(token),
    retry: false,
  });

  return (
    <div className="relative min-h-screen bg-background px-6 py-12 md:py-16">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-8">
        {/* Brand Banner */}
        <div className="flex justify-between items-center pb-6 border-b border-border/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <span className="text-xl font-extrabold tracking-tight text-primary">MedBridge Share</span>
          </div>
          <span className="rounded bg-teal-500/10 px-2.5 py-1 text-xs font-bold text-teal-600 border border-teal-500/10">
            Secure Access Portal
          </span>
        </div>

        {isLoading ? (
          <LoadingSpinner size="lg" />
        ) : isError || !data ? (
          <Card className="max-w-md mx-auto border-destructive/20 bg-destructive/5 text-center p-6">
            <CardHeader className="flex flex-col items-center">
              <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
              <CardTitle className="text-destructive">Access Restricted or Expired</CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                This link may have expired (sharing links default to 24h expiration) or is invalid. Please contact the patient for a new sharing token.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Owner Details Banner */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  Medical Records: {data.owner_name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  The patient has shared a {data.is_folder_share ? "full folder" : "selective list"} of medical documentation.
                </p>
              </div>
              <div className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium shrink-0">
                <Calendar className="h-3.5 w-3.5" />
                <span>Expires within link window</span>
              </div>
            </div>

            {/* Documents Grid */}
            {data.documents.length === 0 ? (
              <Card className="text-center p-8 border border-dashed">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-semibold text-sm">No Shared Files Available</h3>
                <p className="text-xs text-muted-foreground mt-1">This patient directory is currently empty.</p>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.documents.map((doc: any) => (
                  // Map public returned format to Document type
                  <DocumentCard
                    key={doc.id}
                    doc={{
                      id: doc.id,
                      patient_id: 0,
                      title: doc.title,
                      description: doc.description,
                      tag: doc.tag,
                      file_path: "",
                      original_filename: doc.original_filename,
                      mime_type: doc.mime_type,
                      ocr_text: doc.ocr_text,
                      uploaded_at: doc.uploaded_at,
                    }}
                    readOnly
                    sharingToken={token}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
