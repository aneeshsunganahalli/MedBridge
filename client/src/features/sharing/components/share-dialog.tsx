"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Copy, Check, Loader2, QrCode, ExternalLink } from "lucide-react";
import { useSharing } from "../hooks/use-sharing";
import { sharingApi } from "@/lib/api";
import { toast } from "sonner";

export default function ShareDialog({
  documentId,
  title = "Share Documents",
  triggerButton,
}: {
  documentId?: number;
  title?: string;
  triggerButton?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresIn, setExpiresIn] = useState("24");
  const { createShareLink, isCreating, shareData } = useSharing();

  const handleShare = async () => {
    try {
      await createShareLink({
        is_folder_share: !documentId,
        document_ids: documentId ? [documentId] : undefined,
        expires_in_hours: parseInt(expiresIn, 10),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = () => {
    if (!shareData) return;
    // Replace the API's backend path with our frontend path!
    // The backend returns: http://localhost:8000/api/sharing/access/<token>
    // We should give the user the frontend route: http://localhost:3000/shared/<token>
    const frontendBase = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const frontendUrl = `${frontendBase}/shared/${shareData.token}`;
    
    navigator.clipboard.writeText(frontendUrl);
    setCopied(true);
    toast.success("Share link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const getFrontendUrl = () => {
    if (!shareData) return "";
    const frontendBase = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    return `${frontendBase}/shared/${shareData.token}`;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        // Clear previous sharing data when opening a new share dialog
        if (!val) {
          // data will reset on next mount/render
        }
      }}
    >
      <DialogTrigger
        render={
          triggerButton || (
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" />
          )
        }
      >
        {!triggerButton && (
          <>
            <Share2 className="h-3.5 w-3.5" />
            Share
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>
            {documentId
              ? "Generate a secure, read-only link to share this specific medical document."
              : "Generate a secure link to share your ENTIRE medical folder containing all records."}
          </DialogDescription>
        </DialogHeader>

        {!shareData ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="expiration">Link Expiry Duration</Label>
              <Select value={expiresIn} onValueChange={(val) => { if (val) setExpiresIn(val); }}>
                <SelectTrigger id="expiration">
                  <SelectValue placeholder="Select expiry duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hour</SelectItem>
                  <SelectItem value="12">12 Hours</SelectItem>
                  <SelectItem value="24">24 Hours (1 Day)</SelectItem>
                  <SelectItem value="72">72 Hours (3 Days)</SelectItem>
                  <SelectItem value="168">168 Hours (7 Days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleShare} className="w-full mt-2" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating secure link...
                </>
              ) : (
                "Generate Link"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-5 pt-3 flex flex-col items-center">
            {/* QR Code display */}
            <div className="p-3 bg-white rounded-xl border shadow-sm">
              {/* Point QR code image from FastAPI backend */}
              <img
                src={sharingApi.getQrCodeUrl(shareData.token)}
                alt="QR Code for Sharing"
                className="w-48 h-48 object-contain"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Patients/Doctors can scan this QR code to view the document(s) on a mobile device instantly.
            </p>

            {/* Share Link display */}
            <div className="w-full space-y-2">
              <Label className="text-xs text-muted-foreground">Share URL</Label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={getFrontendUrl()}
                  className="flex-1 text-xs rounded-md border border-input bg-muted px-3 py-2 text-muted-foreground select-all outline-none"
                />
                <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0 h-9 w-9">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="w-full flex gap-2 border-t border-border/40 pt-4 mt-2">
              <Button
                variant="outline"
                className="flex-1 text-xs gap-1.5 h-9"
                onClick={() => window.open(getFrontendUrl(), "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Preview Page
              </Button>
              <Button className="flex-1 text-xs h-9" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
