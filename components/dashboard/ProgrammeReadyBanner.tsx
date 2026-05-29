import Link from "next/link";
import { CheckCircle2, ChevronRight, X } from "lucide-react";
import {
  COMMUNITY_GO_TO_WEEK_ONE,
  COMMUNITY_PROGRAMME_READY_BODY,
  COMMUNITY_PROGRAMME_READY_HEADLINE,
} from "@/components/dashboard/communityOnboardingCopy";

type Props = {
  onDismiss?: () => void;
  className?: string;
  showWeekOneCta?: boolean;
};

export function ProgrammeReadyBanner({
  onDismiss,
  className = "",
  showWeekOneCta = true,
}: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-zinc-950 p-5 sm:p-6 ${className}`}
      role="status"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(52,211,153,0.12),transparent)]" />
      <div className="relative flex gap-3 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/30">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1 pr-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/90">
            Programme ready
          </p>
          <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">
            {COMMUNITY_PROGRAMME_READY_HEADLINE}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{COMMUNITY_PROGRAMME_READY_BODY}</p>
          {showWeekOneCta ? (
            <Link
              href="/dashboard/programme"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#F4D23C] px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
            >
              {COMMUNITY_GO_TO_WEEK_ONE}
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
