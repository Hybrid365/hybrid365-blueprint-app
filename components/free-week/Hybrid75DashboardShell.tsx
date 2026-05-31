"use client";

import Hybrid75AppNav from "@/components/free-week/Hybrid75AppNav";

export default function Hybrid75DashboardShell({
  planId,
  children,
}: {
  planId: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-black text-white">
      <Hybrid75AppNav planId={planId} />
      <div className="mx-auto max-w-6xl px-4 py-8 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:px-6 md:py-10 md:pb-10">
        {children}
        <footer className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-zinc-500">
          Plan ID: {planId} · Built using <span className="text-white">Hybrid</span>
          <span className="text-[#F4D23C]">365</span> principles.
        </footer>
      </div>
    </main>
  );
}
