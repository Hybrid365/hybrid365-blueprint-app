import Link from "next/link";
import { Hybrid11ApplicationsPanel } from "@/components/admin-one-to-one-applications/Hybrid11ApplicationsPanel";
import { HyroxPageShell } from "@/components/hyrox-team/HyroxTeamUi";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Hybrid 1-1 Applications | Hybrid365 Coach",
  description: "Review general Hybrid365 1-1 coaching applications — separate from HYROX Team.",
};

export default function OneToOneApplicationsAdminPage() {
  return (
    <HyroxPageShell maxWidth="max-w-[1600px]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/hyrox-athletes"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-yellow-500/40 hover:text-yellow-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Hyrox Team admin
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/80">
              Hybrid365 · General 1-1 Coaching
            </p>
            <h1 className="text-xl font-bold text-white sm:text-2xl">Hybrid 1-1 applications</h1>
          </div>
        </div>
        <Link
          href="/one-to-one-coaching/apply"
          target="_blank"
          className="text-xs font-semibold text-zinc-500 hover:text-yellow-400"
        >
          Public apply form →
        </Link>
      </header>

      <p className="mb-6 max-w-2xl text-sm text-zinc-500">
        Applications from <strong className="text-zinc-400">/one-to-one-coaching/apply</strong> only.
        Type: Hybrid 1-1 · Track: Hybrid Performance. Not mixed with HYROX Team applications.
      </p>

      <Hybrid11ApplicationsPanel />
    </HyroxPageShell>
  );
}
