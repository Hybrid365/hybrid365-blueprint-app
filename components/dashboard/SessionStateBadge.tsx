import { CheckCircle2 } from "lucide-react";
import {
  SESSION_DISPLAY_LABELS,
  type SessionDisplayState,
} from "@/app/lib/sessionLogTypes";

const STYLES: Record<SessionDisplayState, string> = {
  complete: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  partial: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  skipped: "border-zinc-600 bg-zinc-800/60 text-zinc-400",
  moved: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  today: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
  upcoming: "border-zinc-700 bg-zinc-900 text-zinc-500",
};

export function SessionStateBadge({ state }: { state: SessionDisplayState }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STYLES[state]}`}
    >
      {state === "complete" ? <CheckCircle2 className="h-3 w-3" /> : null}
      {SESSION_DISPLAY_LABELS[state]}
    </span>
  );
}
