"use client";

import React from "react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import LoadingSpinner from "@/components/shared/loading-spinner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return null; // Will trigger redirect to login inside useAuth useEffect
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar className="hidden md:flex shrink-0" />

      {/* Main content container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        
        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
