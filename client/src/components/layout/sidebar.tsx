"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Upload,
  Share2,
  BellRing,
  User,
  Building2,
  Clock,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ className, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const patientNavItems = [
    { name: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
    { name: "Appointments", href: "/patient/appointments", icon: CalendarDays },
    { name: "Documents", href: "/patient/documents", icon: FileText },
    { name: "Upload Record", href: "/patient/documents/upload", icon: Upload },
    { name: "Shared Access", href: "/patient/shared", icon: Share2 },
    { name: "Reminders", href: "/patient/reminders", icon: BellRing },
    { name: "Profile", href: "/patient/profile", icon: User },
  ];

  const doctorNavItems = [
    { name: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
    { name: "Clinics", href: "/doctor/clinics", icon: Building2 },
    { name: "Work Schedules", href: "/doctor/schedules", icon: Clock },
    { name: "Appointments", href: "/doctor/appointments", icon: CalendarDays },
    { name: "Profile", href: "/doctor/profile", icon: User },
  ];

  const navItems = user.role === "patient" ? patientNavItems : doctorNavItems;

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-border/40 bg-card/60 backdrop-blur-md px-4 py-6 text-foreground",
        className
      )}
    >
      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-2 px-2">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <span className="text-xl font-extrabold tracking-tight text-primary">MedBridge</span>
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary capitalize">
          {user.role}
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-secondary hover:text-secondary-foreground",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info & Logout */}
      <div className="mt-auto border-t border-border/40 pt-4 space-y-3">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary font-bold capitalize">
            {user.full_name[0]}
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-semibold">{user.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            if (onClose) onClose();
            logout();
          }}
          className="w-full justify-start gap-3 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}
