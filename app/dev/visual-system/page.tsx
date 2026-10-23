import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VisualSystemLab } from "@/components/athlete-command-centre/visual/VisualSystemLab";

export const metadata: Metadata = {
  title: "Athlete visual system",
  robots: { index: false, follow: false },
};

function labEnabled() {
  return (
    process.env.HYROX_ENV === "staging" ||
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "preview"
  );
}

export default function VisualSystemLabPage() {
  if (!labEnabled()) notFound();
  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <VisualSystemLab />
      </div>
    </main>
  );
}
