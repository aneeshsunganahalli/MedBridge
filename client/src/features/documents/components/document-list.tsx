"use client";

import React, { useState } from "react";
import { useDocuments } from "../hooks/use-documents";
import DocumentCard from "./document-card";
import LoadingSpinner from "@/components/shared/loading-spinner";
import EmptyState from "@/components/shared/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Filter } from "lucide-react";
import { DocumentTag } from "@/types";

export default function DocumentList() {
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const tagParam = selectedTag === "all" ? undefined : selectedTag;
  
  const { documents, isLoading, isError, refetch } = useDocuments(tagParam);

  const tags: { label: string; value: string }[] = [
    { label: "All Records", value: "all" },
    { label: "Prescriptions", value: "prescription" },
    { label: "Lab Reports", value: "report" },
    { label: "Scans & Imaging", value: "scan" },
    { label: "Bills & Receipts", value: "bill" },
    { label: "Discharge Summaries", value: "discharge_summary" },
    { label: "Other", value: "other" },
  ];

  return (
    <div className="space-y-6">
      {/* Category filter tabs */}
      <Tabs
        defaultValue="all"
        value={selectedTag}
        onValueChange={setSelectedTag}
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Filter className="h-4 w-4 text-primary" />
            <span>Filter Categories</span>
          </div>
          <TabsList className="flex-wrap h-auto p-1 bg-secondary/40 border border-border/40">
            {tags.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="text-xs px-3 py-1.5 font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {/* Grid listing */}
      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : isError ? (
        <div className="text-center p-8 bg-card border border-destructive/10 rounded-lg max-w-sm mx-auto">
          <p className="text-destructive font-semibold">Failed to load medical files</p>
          <button
            onClick={() => refetch()}
            className="text-xs text-primary hover:underline mt-2"
          >
            Try reloading
          </button>
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          title="No Medical Files Found"
          description={
            selectedTag === "all"
              ? "You haven't uploaded any medical documents yet."
              : `You do not have any files tagged under "${selectedTag.replace("_", " ")}".`
          }
          icon={FileText}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
