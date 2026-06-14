"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function OCRViewer({
  text,
  open,
  onOpenChange,
  title,
}: {
  text: string | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Text copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <DialogTitle>AI Transcribed Text</DialogTitle>
          </div>
          <DialogDescription>
            Gemini OCR transcription for &quot;{title}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-[200px] mt-2 relative">
          <ScrollArea className="h-[400px] w-full rounded-md border border-border/60 bg-muted/30 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {text || "No clinical text could be extracted from this document."}
          </ScrollArea>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-border/40 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!text}
            className="gap-1.5"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            Copy Text
          </Button>
          <Button variant="default" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
