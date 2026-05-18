import type { ReactNode } from "react";
import type { SessionStatus } from "@/app/lib/hyroxTeamDashboardMock";
import { ChevronRight, Lock } from "lucide-react";

export function DashCard({
  children,
  className = "",
  locked = false,
  highlight = false,
}: {
  children: ReactNode;
  className?: string;
  locked?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 ${
        highlight
          ? "border-yellow-500/25 bg-gradient-to-br from-yellow-400/[0.06] via-zinc-900/90 to-zinc-950"
          : "border-zinc-800 bg-zinc-900/80"
      } ${locked ? "opacity-60" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h3 className="m-0 text-lg font-bold text-white">{title}</h3>
      {action}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
}) {
  return (
    <DashCard className="!p-4 sm:!p-5">
      {icon ? (
        <div className="mb-2 flex items-center gap-2 text-zinc-400">
          {icon}
          <span className="text-xs font-medium text-zinc-500">{label}</span>
        </div>
      ) : (
        <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      )}
      <p className="mt-1 text-xl font-bold text-white sm:text-2xl">{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-zinc-500">{sub}</p> : null}
    </DashCard>
  );
}

export function ProgressBar({ pct, label }: { pct: number; label?: string }) {
  return (
    <div>
      {label ? (
        <div className="mb-1.5 flex justify-between text-xs text-zinc-500">
          <span>{label}</span>
          <span className="font-medium text-yellow-400">{pct}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
        <div
          className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}

export function sessionTypeStyle(type: string) {
  if (type === "Run") return "bg-blue-500/20 text-blue-300 border-blue-500/40";
  if (type === "Strength") return "bg-red-500/20 text-red-300 border-red-500/40";
  if (type === "Hybrid") return "bg-purple-500/20 text-purple-300 border-purple-500/40";
  if (type === "Aerobic") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  return "bg-teal-500/20 text-teal-300 border-teal-500/40";
}

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const map: Record<SessionStatus, string> = {
    complete: "border-emerald-500/35 bg-emerald-500/15 text-emerald-300",
    upcoming: "border-zinc-600 bg-zinc-800 text-zinc-300",
    missed: "border-red-500/35 bg-red-500/15 text-red-300",
    modified: "border-amber-500/35 bg-amber-500/15 text-amber-200",
  };
  const labels: Record<SessionStatus, string> = {
    complete: "Complete",
    upcoming: "Upcoming",
    missed: "Missed",
    modified: "Modified",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

export function BodyweightSpark({ series }: { series: { week: number; kg: number }[] }) {
  if (series.length < 2) {
    return (
      <div className="mt-4 flex h-24 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-950/60 text-xs text-zinc-500">
        Trend builds with check-ins
      </div>
    );
  }
  const kgs = series.map((s) => s.kg);
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  const span = Math.max(0.001, max - min);
  return (
    <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
      <div className="flex h-28 items-end gap-1">
        {series.map((pt) => {
          const hPx = 12 + ((pt.kg - min) / span) * 88;
          return (
            <div key={pt.week} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className="w-full max-w-[14px] rounded-t-md bg-gradient-to-t from-yellow-500/30 to-yellow-400/80"
                style={{ height: `${hPx}px` }}
                title={`Week ${pt.week}: ${pt.kg} kg`}
              />
              <span className="text-[9px] font-medium text-zinc-500">W{pt.week}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ViewSessionButton({ compact }: { compact?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1 font-semibold text-yellow-400 hover:text-yellow-300 ${
        compact ? "text-xs" : "text-sm"
      }`}
    >
      View session
      <ChevronRight className="h-3.5 w-3.5" />
    </button>
  );
}

export function LockedPreviewCard({
  title,
  preview,
}: {
  title: string;
  preview: string;
}) {
  return (
    <DashCard locked className="relative !p-4">
      <Lock className="absolute right-3 top-3 h-4 w-4 text-zinc-600" />
      <p className="text-xs font-bold text-zinc-500">{title}</p>
      <p className="mt-1 text-sm text-zinc-600">{preview}</p>
    </DashCard>
  );
}

export function CheckInStatusPill({
  status,
}: {
  status: "Due" | "Submitted" | "Coach reviewed";
}) {
  const cls =
    status === "Due"
      ? "border-amber-500/35 bg-amber-500/15 text-amber-300"
      : status === "Submitted"
        ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-300"
        : "border-blue-500/35 bg-blue-500/15 text-blue-300";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
}
