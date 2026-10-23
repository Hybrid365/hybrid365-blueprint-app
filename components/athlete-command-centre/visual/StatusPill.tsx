import {
  ATHLETE_STATUS_LABEL,
  type AthleteStatusKey,
} from "./tokens";

const TONE: Record<AthleteStatusKey, string> = {
  current: "border-zinc-600 text-yellow-400/90",
  pending: "border-amber-500/40 text-amber-200",
  approved: "border-zinc-700 text-zinc-300",
  coach_verified: "border-zinc-600 text-zinc-200",
  historical: "border-zinc-800 text-zinc-400",
};

export function StatusPill({
  status,
  className = "",
}: {
  status: AthleteStatusKey;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${TONE[status]} ${className}`}
    >
      {ATHLETE_STATUS_LABEL[status]}
    </span>
  );
}
