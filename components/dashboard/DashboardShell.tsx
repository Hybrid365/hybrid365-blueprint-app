"use client";

import { Nav } from "@/components/nav";

/** Wraps paid community dashboard routes with consistent bottom (mobile) / side (desktop) nav. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Nav />
      <div className="min-h-0 flex-1 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {children}
      </div>
    </div>
  );
}
