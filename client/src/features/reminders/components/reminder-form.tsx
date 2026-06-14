"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Reminder, ReminderType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Loader2 } from "lucide-react";
import { useReminders } from "../hooks/use-reminders";

const reminderSchema = zod.object({
  title: zod.string().min(1, "Title is required").max(255),
  description: zod.string().optional(),
  reminder_time: zod.string().min(1, "Reminder date & time is required"),
  type: zod.enum(["medication", "appointment", "custom"]),
});

type ReminderSchema = zod.infer<typeof reminderSchema>;

export default function ReminderForm({
  reminder,
  trigger,
}: {
  reminder?: Reminder;
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const { createReminder, updateReminder, isCreating, isUpdating } = useReminders();

  const isEdit = !!reminder;

  const form = useForm<ReminderSchema>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: "",
      description: "",
      reminder_time: "",
      type: "custom",
    },
  });

  // Prefill when editing
  useEffect(() => {
    if (open) {
      if (reminder) {
        // API date is ISO string (e.g. 2026-06-14T10:00:00)
        // input[type="datetime-local"] expects YYYY-MM-DDTHH:MM
        const localTime = new Date(reminder.reminder_time);
        const pad = (n: number) => n.toString().padStart(2, "0");
        const formatted = `${localTime.getFullYear()}-${pad(localTime.getMonth() + 1)}-${pad(
          localTime.getDate()
        )}T${pad(localTime.getHours())}:${pad(localTime.getMinutes())}`;

        form.reset({
          title: reminder.title,
          description: reminder.description || "",
          reminder_time: formatted,
          type: reminder.type,
        });
      } else {
        form.reset({
          title: "",
          description: "",
          reminder_time: "",
          type: "custom",
        });
      }
    }
  }, [open, reminder, form]);

  const onSubmit = async (data: ReminderSchema) => {
    try {
      // Convert to ISO string
      const isoTime = new Date(data.reminder_time).toISOString();
      const payload = {
        ...data,
        reminder_time: isoTime,
      };

      if (isEdit && reminder) {
        await updateReminder({ id: reminder.id, data: payload });
      } else {
        await createReminder(payload);
      }
      setOpen(false);
      form.reset();
    } catch (err) {
      console.error(err);
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger || <Button className="gap-1.5 shadow-md" />}>
        {!trigger && (
          <>
            <Plus className="h-4 w-4" />
            Add Reminder
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modify Reminder" : "Schedule Reminder"}</DialogTitle>
          <DialogDescription>
            Configure medication schedules, appointment alarms, or health checklists.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Take Lipitor 10mg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="medication">Medication Dosage</SelectItem>
                      <SelectItem value="appointment">Appointment Alarm</SelectItem>
                      <SelectItem value="custom">General / Custom Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reminder_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time & Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions / Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Take with water after eating lunch."
                      className="resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  "Save Changes"
                ) : (
                  "Set Reminder"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
