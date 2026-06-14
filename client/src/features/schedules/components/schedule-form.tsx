"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Schedule } from "@/types";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Loader2 } from "lucide-react";
import { useSchedules } from "../hooks/use-schedules";

const DAYS_OF_WEEK = [
  { label: "Monday", value: "0" },
  { label: "Tuesday", value: "1" },
  { label: "Wednesday", value: "2" },
  { label: "Thursday", value: "3" },
  { label: "Friday", value: "4" },
  { label: "Saturday", value: "5" },
  { label: "Sunday", value: "6" },
];

const scheduleSchema = zod.object({
  day_of_week: zod.number().min(0).max(6, "Invalid day of week"),
  start_time: zod.string().min(1, "Start time is required"),
  end_time: zod.string().min(1, "End time is required"),
  is_available: zod.boolean(),
});

type ScheduleSchema = zod.infer<typeof scheduleSchema>;

export default function ScheduleForm({
  schedule,
  trigger,
}: {
  schedule?: Schedule;
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const { createSchedule, updateSchedule, isCreating, isUpdating } = useSchedules();

  const isEdit = !!schedule;

  const form = useForm<ScheduleSchema>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      day_of_week: 0,
      start_time: "09:00",
      end_time: "17:00",
      is_available: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (schedule) {
        // API returns time as HH:MM:SS or HH:MM
        const trimTime = (t: string) => t.slice(0, 5);
        form.reset({
          day_of_week: schedule.day_of_week,
          start_time: trimTime(schedule.start_time),
          end_time: trimTime(schedule.end_time),
          is_available: schedule.is_available,
        });
      } else {
        form.reset({
          day_of_week: 0,
          start_time: "09:00",
          end_time: "17:00",
          is_available: true,
        });
      }
    }
  }, [open, schedule, form]);

  const onSubmit = async (data: ScheduleSchema) => {
    if (data.start_time >= data.end_time) {
      form.setError("end_time", {
        type: "manual",
        message: "End time must be after start time",
      });
      return;
    }

    try {
      const formatTime = (t: string) => (t.length === 5 ? `${t}:00` : t);
      const payload = {
        day_of_week: data.day_of_week,
        start_time: formatTime(data.start_time),
        end_time: formatTime(data.end_time),
        is_available: data.is_available,
      };

      if (isEdit && schedule) {
        await updateSchedule({ id: schedule.id, data: payload });
      } else {
        await createSchedule(payload);
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
            Add Slot
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modify Schedule" : "Create Availability Slot"}</DialogTitle>
          <DialogDescription>
            Specify your practice day and hours for patient consultations.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="day_of_week"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day of the Week</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      if (val) field.onChange(parseInt(val, 10));
                    }}
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_available"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/60 p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-semibold">Active Availability</FormLabel>
                    <p className="text-[11px] text-muted-foreground leading-none">
                      Toggle whether patients can book this slot.
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
                  "Create Slot"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
