"use client";

import { cn } from "@/lib/utils";
import {
  CONFIDENCE_SCALE,
  HYROX_STATION_WEAKNESS_OPTIONS,
  type HyroxStationWeakness,
} from "@/app/lib/communityHyroxAssessment";
import type { CommunityHyroxCheckInDetails } from "@/app/lib/communityHyroxCheckIn";
import { stationWeaknessLabel } from "@/app/lib/communityHyroxDashboard";

function ScorePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-400">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {CONFIDENCE_SCALE.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition",
              value === n
                ? "bg-amber-400 text-zinc-950"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

type Props = {
  details: CommunityHyroxCheckInDetails;
  onChange: (patch: Partial<CommunityHyroxCheckInDetails>) => void;
};

export function HyroxCheckInSection({ details, onChange }: Props) {
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4 md:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-400/90">HYROX reflection</p>
      <p className="mt-2 text-sm text-zinc-400">
        HYROX-specific prompts for this week — saved with your check-in.
      </p>

      <div className="mt-5 space-y-5">
        <ScorePicker
          label="How did compromised running feel this week? (1–10)"
          value={details.compromised_running_feel}
          onChange={(v) => onChange({ compromised_running_feel: v })}
        />

        <div>
          <label className="mb-2 block text-sm text-zinc-400">Which station felt weakest this week?</label>
          <div className="flex flex-wrap gap-2">
            {HYROX_STATION_WEAKNESS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange({
                    weakest_station:
                      details.weakest_station === opt.value
                        ? null
                        : (opt.value as HyroxStationWeakness),
                  })
                }
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  details.weakest_station === opt.value
                    ? "bg-amber-400 text-zinc-950"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            How did your legs recover from lower-body / lunge / sled-style work?
          </label>
          <textarea
            value={details.legs_recovery ?? ""}
            onChange={(e) => onChange({ legs_recovery: e.target.value })}
            rows={2}
            placeholder="e.g. Heavy on Thursday, fine by Saturday..."
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          />
        </div>

        <ScorePicker
          label="How confident do you feel running after stations? (1–10)"
          value={details.running_after_stations_confidence}
          onChange={(v) => onChange({ running_after_stations_confidence: v })}
        />

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            Any wall ball, burpee, grip or lower-body issues?
          </label>
          <textarea
            value={details.wall_ball_grip_lower_body_notes ?? ""}
            onChange={(e) => onChange({ wall_ball_grip_lower_body_notes: e.target.value })}
            rows={2}
            placeholder="Optional — niggles, limits, what stood out..."
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          />
        </div>

        <ScorePicker
          label="HYROX race confidence this week (1–10)"
          value={details.race_confidence}
          onChange={(v) => onChange({ race_confidence: v })}
        />
      </div>
    </div>
  );
}

export function HyroxCheckInSummary({ details }: { details: CommunityHyroxCheckInDetails }) {
  const rows: { label: string; value: string }[] = [];
  if (details.compromised_running_feel != null) {
    rows.push({ label: "Compromised running", value: `${details.compromised_running_feel}/10` });
  }
  if (details.weakest_station) {
    rows.push({ label: "Weakest station", value: stationWeaknessLabel(details.weakest_station) });
  }
  if (details.running_after_stations_confidence != null) {
    rows.push({
      label: "Running after stations",
      value: `${details.running_after_stations_confidence}/10`,
    });
  }
  if (details.race_confidence != null) {
    rows.push({ label: "Race confidence", value: `${details.race_confidence}/10` });
  }
  if (!rows.length) return null;

  return (
    <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">HYROX week notes</p>
      <dl className="mt-2 space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-3 text-sm">
            <dt className="text-zinc-500">{r.label}</dt>
            <dd className="font-medium text-zinc-200">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
