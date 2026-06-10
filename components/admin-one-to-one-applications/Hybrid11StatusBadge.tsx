import type { Hybrid11ApplicationStatus } from "@/app/lib/hybrid11DatabaseTypes";
import { hybrid11StatusLabel } from "@/app/lib/hybrid11ApplicationCoach";

const STYLES: Record<Hybrid11ApplicationStatus, string> = {
  new: "bg-sky-500/15 text-sky-200 ring-sky-500/30",
  reviewing: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
  accepted: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
  rejected: "bg-zinc-500/15 text-zinc-400 ring-zinc-600/40",
  converted: "bg-violet-500/15 text-violet-200 ring-violet-500/30",
};

export function Hybrid11StatusBadge({ status }: { status: Hybrid11ApplicationStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${STYLES[status]}`}
    >
      {hybrid11StatusLabel(status)}
    </span>
  );
}
