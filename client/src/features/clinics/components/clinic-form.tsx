"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Clinic } from "@/types";
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
import { Button } from "@/components/ui/button";
import { Plus, Edit, Loader2 } from "lucide-react";
import { useClinics } from "../hooks/use-clinics";

const clinicSchema = zod.object({
  name: zod.string().min(1, "Clinic name is required").max(255),
  address: zod.string().optional(),
  description: zod.string().optional(),
  phone: zod.string().optional(),
});

type ClinicSchema = zod.infer<typeof clinicSchema>;

export default function ClinicForm({
  clinic,
  trigger,
}: {
  clinic?: Clinic;
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const { createClinic, updateClinic, isCreating, isUpdating } = useClinics();

  const isEdit = !!clinic;

  const form = useForm<ClinicSchema>({
    resolver: zodResolver(clinicSchema),
    defaultValues: {
      name: "",
      address: "",
      description: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (clinic) {
        form.reset({
          name: clinic.name,
          address: clinic.address || "",
          description: clinic.description || "",
          phone: clinic.phone || "",
        });
      } else {
        form.reset({
          name: "",
          address: "",
          description: "",
          phone: "",
        });
      }
    }
  }, [open, clinic, form]);

  const onSubmit = async (data: ClinicSchema) => {
    try {
      if (isEdit && clinic) {
        await updateClinic({ id: clinic.id, data });
      } else {
        await createClinic(data);
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
            Add Clinic
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Clinic Details" : "Register Clinic"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update settings, phone, or location credentials for your clinic."
              : "Register a clinic location where you manage consultation visits."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinic Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Hope Wellness Center" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Line</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. +1 555-0199" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Suite 400, 100 Health Blvd"
                      className="resize-none min-h-[60px]"
                      {...field}
                    />
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
                  <FormLabel>Clinic Notes / Info</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add brief details about working facilities, department info..."
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
                  "Register Location"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
