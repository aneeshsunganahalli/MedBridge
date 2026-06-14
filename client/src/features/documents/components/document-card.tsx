"use client";

import React, { useState } from "react";
import { Document } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Calendar,
  Eye,
  Download,
  Trash2,
  Share2,
  FileImage,
  Loader2,
  StickyNote,
} from "lucide-react";
import { useDocuments } from "../hooks/use-documents";
import { documentsApi } from "@/lib/api";
import OCRViewer from "./ocr-viewer";
import ShareDialog from "@/features/sharing/components/share-dialog";
import { toast } from "sonner";

export default function DocumentCard({
  doc,
  readOnly = false,
  sharingToken,
}: {
  doc: Document;
  readOnly?: boolean;
  sharingToken?: string;
}) {
  const { deleteDocument, isDeleting } = useDocuments();
  const [ocrOpen, setOcrOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      let blob: Blob;
      if (sharingToken) {
        // If we are viewing this from a public sharing link, we download via public share download API
        const { sharingApi } = await import("@/lib/api");
        blob = await sharingApi.downloadSharedFile(sharingToken, doc.id);
      } else {
        // Logged in patient downloading own file
        blob = await documentsApi.downloadFile(doc.id);
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = doc.original_filename;
      window.document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("File downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download file");
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this document? This cannot be undone.")) {
      return;
    }
    setDeletingId(doc.id);
    try {
      await deleteDocument(doc.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const isCurrentDeleting = deletingId === doc.id;
  const isImage = doc.mime_type.startsWith("image/");
  const formattedDate = new Date(doc.uploaded_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      prescription: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-850",
      report: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-850",
      scan: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-850",
      bill: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-850",
      discharge_summary: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-850",
      other: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-850",
    };
    return colors[tag] || colors.other;
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border border-border/50 bg-card flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 bg-secondary/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-background/80 shadow-sm text-primary">
              {isImage ? <FileImage className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div className="overflow-hidden">
              <Badge variant="outline" className={`capitalize font-semibold text-[10px] py-0 px-2 border mb-1.5 ${getTagColor(doc.tag)}`}>
                {doc.tag.replace("_", " ")}
              </Badge>
              <CardTitle className="text-sm font-bold truncate max-w-[150px] md:max-w-[200px]" title={doc.title}>
                {doc.title}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {doc.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 h-8 leading-relaxed">
              {doc.description}
            </p>
          )}

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Uploaded: {formattedDate}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate" title={doc.original_filename}>
            <StickyNote className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">File: {doc.original_filename}</span>
          </div>
        </CardContent>
      </div>

      <CardFooter className="bg-secondary/5 px-4 py-3 border-t border-border/40 flex justify-between gap-1">
        <div className="flex gap-1">
          {/* Download button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={downloading}
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary shrink-0"
            title="Download Document"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </Button>

          {/* OCR text button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOcrOpen(true)}
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary shrink-0"
            title="View Transcribed OCR"
          >
            <Eye className="h-4 w-4" />
          </Button>

          {/* Share button (Patient owner only) */}
          {!readOnly && (
            <ShareDialog
              documentId={doc.id}
              title={`Share "${doc.title}"`}
              triggerButton={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary shrink-0"
                  title="Create Share Link"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              }
            />
          )}
        </div>

        {/* Delete button (Patient owner only) */}
        {!readOnly && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
            title="Delete Document"
          >
            {isCurrentDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        )}
      </CardFooter>

      {/* OCR transcription dialog viewer */}
      <OCRViewer open={ocrOpen} onOpenChange={setOcrOpen} text={doc.ocr_text} title={doc.title} />
    </Card>
  );
}
