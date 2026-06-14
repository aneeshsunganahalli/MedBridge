"use client";

import React, { useState } from "react";
import { useSchedules } from "../hooks/use-schedules";
import ScheduleForm from "./schedule-form";
import LoadingSpinner from "@/components/shared/loading-spinner";
import EmptyState from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Edit2, Trash2, Loader2 } from "lucide-react";
import { Schedule } from "@/types";

const DAYS_MAP = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ScheduleList() {
  const { schedules, isLoading, isError, refetch, deleteSchedule, isDeleting } = useSchedules();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this schedule slot?")) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteSchedule(id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (isError) {
    return (
      <div className="text-center p-6 bg-card border rounded-lg max-w-sm mx-auto">
        <p className="text-destructive font-bold">Failed to load schedules</p>
        <button onClick={() => refetch()} className="text-xs text-primary hover:underline mt-2">
          Try again
        </button>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <EmptyState
        title="No Schedule Slots"
        description="Set your consulting slots. Patients can only book appointments inside your active schedules."
        icon={Clock}
      />
    );
  }

  // Group schedules by day of week (0-6)
  const grouped: Record<number, Schedule[]> = {};
  schedules.forEach((s) => {
    if (!grouped[s.day_of_week]) {
      grouped[s.day_of_week] = [];
    }
    grouped[s.day_of_week].push(s);
  });

  // Sort grouped keys
  const sortedDays = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {sortedDays.map((dayNum) => {
        const daySlots = grouped[dayNum];
        const dayLabel = DAYS_MAP[dayNum];

        return (
          <Card key={dayNum} className="border-border/60">
            <CardHeader className="bg-secondary/10 py-3.5 border-b border-border/40">
              <CardTitle className="text-base font-bold text-foreground">{dayLabel}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {daySlots.map((slot) => {
                  const isCurrentDeleting = deletingId === slot.id;

                  return (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between px-6 py-4 flex-wrap gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <Clock className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-sm font-semibold">
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </span>
                        <Badge
                          variant={slot.is_available ? "default" : "secondary"}
                          className={`text-[10px] font-bold ${
                            slot.is_available
                              ? "bg-teal-500/10 text-teal-600 dark:bg-teal-950/20 hover:bg-teal-500/10"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {slot.is_available ? "Available" : "Unavailable"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <ScheduleForm
                          schedule={slot}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Edit Slot"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(slot.id)}
                          disabled={isDeleting}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Delete Slot"
                        >
                          {isCurrentDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
