import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Track assessment",
  description: "Hybrid365 Track onboarding, assessment week and athlete profile. Programme publishing is off.",
  robots: { index: false, follow: false },
};

export default function TrackFoundationLayout({ children }: { children: React.ReactNode }) {
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
