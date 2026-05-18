import { CheckCircle2, X } from "lucide-react";

type Props = {
  onDismiss?: () => void;
  className?: string;
};

export function ProgrammeReadyBanner({ onDismiss, className = "" }: Props) {
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/90">Programme ready</p>
          <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">
            Your 12-week Hybrid365 programme is ready.
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Start with Week 1, log your sessions honestly and use the weekly check-in to keep the structure working for
            you.
          </p>
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
