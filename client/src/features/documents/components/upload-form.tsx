"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useDocuments } from "../hooks/use-documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, Loader2, ArrowLeft, Paperclip } from "lucide-react";
import { toast } from "sonner";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];

const uploadSchema = zod.object({
  title: zod.string().min(1, "Document title is required").max(255),
  description: zod.string().optional(),
  tag: zod.enum(["prescription", "report", "scan", "bill", "discharge_summary", "other"]),
  file: zod
    .any()
    .refine((files) => files && files.length > 0, "Please select a file to upload")
    .refine(
      (files) => files && files[0] && ACCEPTED_TYPES.includes(files[0].type),
      "Only PDF, PNG, JPG, JPEG, and WEBP formats are supported"
    ),
});

type UploadSchema = zod.infer<typeof uploadSchema>;

export default function UploadForm() {
  const router = useRouter();
  const { uploadDocument, isUploading } = useDocuments();
  const [fileName, setFileName] = useState<string | null>(null);

  const form = useForm<UploadSchema>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      description: "",
      tag: "other",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
      form.setValue("file", files);
    } else {
      setFileName(null);
    }
  };

  const onSubmit = async (data: UploadSchema) => {
    const formData = new FormData();
    formData.append("file", data.file[0]);
    formData.append("title", data.title);
    if (data.description) {
      formData.append("description", data.description);
    }
    formData.append("tag", data.tag);

    try {
      await uploadDocument(formData);
      router.push("/patient/documents");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="w-full max-w-2xl border-border/60 shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">Go Back</span>
        </div>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <FileUp className="h-5 w-5 text-primary" />
          Upload Medical Record
        </CardTitle>
        <CardDescription>
          Files are encrypted securely. Upload prescriptions, test reports, scans or summaries.
          AI OCR automatically transcribes clinical notes from your uploads.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Lipitor Prescription May 2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Record Type / Tag</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="prescription">Prescription</SelectItem>
                        <SelectItem value="report">Lab / Test Report</SelectItem>
                        <SelectItem value="scan">Scan / X-Ray / MRI</SelectItem>
                        <SelectItem value="bill">Medical Invoice / Bill</SelectItem>
                        <SelectItem value="discharge_summary">Discharge Summary</SelectItem>
                        <SelectItem value="other">Other Clinical Record</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem className="flex flex-col">
                <FormLabel>Select File</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="file"
                      id="file-upload"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground ring-offset-background hover:bg-muted/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    >
                      <span className="truncate flex items-center gap-1.5 font-medium">
                        <Paperclip className="h-4 w-4 shrink-0 text-primary" />
                        {fileName || "Choose prescription/image..."}
                      </span>
                      <span className="rounded bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary shrink-0 hover:bg-primary/20">
                        Browse
                      </span>
                    </label>
                  </div>
                </FormControl>
                <FormDescription className="text-[11px] leading-tight">
                  Supports PDF, PNG, JPG, JPEG, WEBP. Max size 10MB.
                </FormDescription>
                {/* Manual display of validation error for file field */}
                {form.formState.errors.file && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {form.formState.errors.file.message as string}
                  </p>
                )}
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinical Notes / Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any extra notes or symptoms mentioned..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading} className="gap-1.5 shadow-md">
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing & uploading...
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4" />
                    Upload & Transcribe
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
