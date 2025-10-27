"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/**
 * VisuallyHidden component for accessibility
 * Hides content visually but keeps it available to screen readers
 */
export function VisuallyHidden({ children, className, ...props }: VisuallyHiddenProps) {
  return (
    <span
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "sr-only", // Tailwind's screen reader only class
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}