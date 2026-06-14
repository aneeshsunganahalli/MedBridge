import React from "react";
import { Badge } from "@/components/ui/badge";

export default function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const styles: Record<string, string> = {
    booked: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20",
    completed: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20",
    cancelled: "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20",
    medication: "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/20",
    appointment: "bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20 border-cyan-500/20",
    custom: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20",
  };

  const currentStyle = styles[normalized] || "bg-slate-500/10 text-slate-600 border-slate-500/20";

  return (
    <Badge variant="outline" className={`${currentStyle} font-semibold capitalize px-2.5 py-0.5 rounded-full border`}>
      {normalized}
    </Badge>
  );
}
