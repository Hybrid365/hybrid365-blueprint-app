import { CheckCircle2, Circle } from "lucide-react";

export type TimelineStep = {
  n: number;
  title: string;
  description?: string;
  status?: "complete" | "current" | "upcoming";
};

export function TimelineSteps({
  steps,
  variant = "vertical",
}: {
  steps: TimelineStep[];
  variant?: "vertical" | "compact";
}) {
  if (variant === "compact") {
    return (
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step) => (
          <li
            key={step.n}
            className="rounded-[20px] border border-white/[0.11] bg-white/[0.045] p-5"
          >
            <div className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#f4d23c]">
              {String(step.n).padStart(2, "0")} / Step
            </div>
            <h3 className="m-0 text-lg font-black uppercase tracking-[-0.04em] text-white">
              {step.title}
            </h3>
            {step.description ? (
              <p className="m-0 mt-2 text-sm leading-relaxed text-[#a9a9a9]">{step.description}</p>
            ) : null}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="relative space-y-0">
      {steps.map((step, i) => {
        const status = step.status ?? "upcoming";
        const isLast = i === steps.length - 1;
        return (
          <li key={step.n} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast ? (
              <span
                className="absolute left-[15px] top-9 h-[calc(100%-12px)] w-px bg-white/10"
                aria-hidden
              />
            ) : null}
            <div className="relative z-10 shrink-0">
              {status === "complete" ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-400/40">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
              ) : status === "current" ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4d23c] text-sm font-black text-[#050505] ring-2 ring-[#f4d23c]/50">
                  {step.n}
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm font-bold text-zinc-500">
                  <Circle className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#f4d23c]/80">
                Step {step.n}
              </p>
              <h3 className="mt-0.5 text-base font-bold text-white sm:text-lg">{step.title}</h3>
              {step.description ? (
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">{step.description}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
