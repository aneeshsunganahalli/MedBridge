"use client";

import React, { useState } from "react";
import { useReminders } from "../hooks/use-reminders";
import ReminderForm from "./reminder-form";
import LoadingSpinner from "@/components/shared/loading-spinner";
import EmptyState from "@/components/shared/empty-state";
import StatusBadge from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Edit2, Trash2, Loader2, Calendar } from "lucide-react";

export default function ReminderList() {
  const { reminders, isLoading, isError, refetch, updateReminder, deleteReminder, isDeleting } =
    useReminders();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleToggleCompleted = async (id: number, currentStatus: boolean) => {
    setUpdatingId(id);
    try {
      await updateReminder({ id, data: { is_completed: !currentStatus } });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this reminder?")) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteReminder(id);
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
        <p className="text-destructive font-bold">Failed to load reminders</p>
        <button onClick={() => refetch()} className="text-xs text-primary hover:underline mt-2">
          Try again
        </button>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <EmptyState
        title="No Active Reminders"
        description="Set medication dosings or scheduled alarms to help organize your care routine."
        icon={Bell}
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {reminders.map((rem) => {
        const isCurrentUpdating = updatingId === rem.id;
        const isCurrentDeleting = deletingId === rem.id;
        const localTime = new Date(rem.reminder_time).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        return (
          <Card
            key={rem.id}
            className={`hover:shadow-md transition-all duration-300 border-border/60 flex flex-col justify-between ${
              rem.is_completed ? "opacity-65" : ""
            }`}
          >
            <div>
              <CardHeader className="bg-secondary/10 pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-background border border-border/40 text-primary shrink-0">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle
                      className={`text-sm font-bold truncate max-w-[150px] ${
                        rem.is_completed ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                      title={rem.title}
                    >
                      {rem.title}
                    </CardTitle>
                    <span className="text-[10px] text-muted-foreground">ID: {rem.id}</span>
                  </div>
                </div>
                <StatusBadge status={rem.type} />
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {rem.description && (
                  <p
                    className={`text-xs leading-relaxed text-muted-foreground line-clamp-2 h-8 ${
                      rem.is_completed ? "line-through" : ""
                    }`}
                  >
                    {rem.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>Time: {localTime}</span>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Mark as Done
                  </span>
                  <div className="flex items-center">
                    {isCurrentUpdating && <Loader2 className="h-4.5 w-4.5 animate-spin text-primary mr-2" />}
                    <Switch
                      checked={rem.is_completed}
                      onCheckedChange={() => handleToggleCompleted(rem.id, rem.is_completed)}
                      disabled={isCurrentUpdating}
                    />
                  </div>
                </div>
              </CardContent>
            </div>

            <div className="bg-secondary/5 px-4 py-2.5 border-t border-border/40 flex justify-end gap-1">
              <ReminderForm
                reminder={rem}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Edit Reminder"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(rem.id)}
                disabled={isDeleting}
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                title="Delete Reminder"
              >
                {isCurrentDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
