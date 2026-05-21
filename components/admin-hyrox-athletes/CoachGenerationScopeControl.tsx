"use client";

import type { GenerationScope } from "./useCoachBlockProgramme";

const OPTIONS: Array<{
  id: GenerationScope;
  label: string;
  description: string;
  disabled?: boolean;
}> = [
  {
    id: "current_week",
    label: "Current week only",
    description: "Generate or publish a single selected week.",
  },
  {
    id: "block_4",
    label: "Current 4-week block",
    description: "Recommended — Weeks 1–4 with intro → progression → peak → deload.",
  },
  {
    id: "block_8",
    label: "Next 8 weeks",
    description: "Coming soon — generate the next block after coach review.",
    disabled: true,
  },
  {
    id: "full_12",
    label: "Full 12-week programme",
    description: "Coming soon — roadmap stays 12 weeks; detail ships in 4-week blocks.",
    disabled: true,
  },
];

export function CoachGenerationScopeControl({
  value,
  onChange,
}: {
  value: GenerationScope;
  onChange: (scope: GenerationScope) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <legend className="text-sm font-bold text-white">Generation scope</legend>
      <p className="mt-1 text-[11px] text-zinc-500">
        Default: current 4-week block. Athlete sees a seamless block; later blocks unlock after
        check-ins.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((opt) => (
          <label
            key={opt.id}
            className={`flex cursor-pointer gap-2 rounded-xl border p-3 transition ${
              opt.disabled
                ? "cursor-not-allowed border-zinc-800/60 opacity-50"
                : value === opt.id
                  ? "border-yellow-400/40 bg-yellow-400/5"
                  : "border-zinc-800 hover:border-zinc-600"
            }`}
          >
            <input
              type="radio"
              name="generationScope"
              value={opt.id}
              checked={value === opt.id}
              disabled={opt.disabled}
              onChange={() => !opt.disabled && onChange(opt.id)}
              className="mt-0.5"
            />
            <span>
              <span className="text-xs font-semibold text-white">
                {opt.label}
                {opt.id === "block_4" ? (
                  <span className="ml-1 text-[10px] font-bold text-yellow-400">Recommended</span>
                ) : null}
              </span>
              <span className="mt-0.5 block text-[10px] leading-snug text-zinc-500">
                {opt.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
