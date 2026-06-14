import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingSpinner({
  size = "md",
  fullScreen = false,
}: {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const spinner = <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />;

  if (fullScreen) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-4">{spinner}</div>;
}
