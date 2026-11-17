import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Track",
  description: "Hybrid365 Track coaching loop preview. Programme publishing is off.",
  robots: { index: false, follow: false },
};

export default function TrackLoopLayout({ children }: { children: React.ReactNode }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
        Preview · Track programme publishing is off
      </div>
      {children}
    </div>
  );
}
