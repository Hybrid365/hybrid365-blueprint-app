import type { HyroxApplicationStatus } from "@/app/lib/hyroxDatabaseTypes";
import { APPLICATION_STATUS_LABELS } from "@/app/lib/hyroxApplicationCoach";

const STYLES: Record<HyroxApplicationStatus, string> = {
  submitted: "bg-sky-500/15 text-sky-200 ring-sky-500/30",
  under_review: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
  accepted: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
  rejected: "bg-zinc-500/15 text-zinc-400 ring-zinc-600/40",
};

export function ApplicationStatusBadge({ status }: { status: HyroxApplicationStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${STYLES[status]}`}
    >
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}
