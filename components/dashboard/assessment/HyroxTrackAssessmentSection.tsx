"use client";

import { cn } from "@/lib/utils";
import {
  CONFIDENCE_SCALE,
  HYROX_CATEGORY_OPTIONS,
  HYROX_DIVISION_OPTIONS,
  HYROX_EQUIPMENT_OPTIONS,
  HYROX_RACE_BOOKED_OPTIONS,
  HYROX_RACE_PRIORITY_OPTIONS,
  HYROX_STATION_WEAKNESS_OPTIONS,
  HYROX_TRACK_POSITIONING_COPY,
  SLED_EXPERIENCE_OPTIONS,
  type CommunityHyroxDetails,
  type HyroxEquipmentAccess,
  type HyroxStationWeakness,
} from "@/app/lib/communityHyroxAssessment";

function ValuePills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-3 py-2 text-sm font-medium transition-all",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MultiPills<T extends string>({
  options,
  selected,
  onToggle,
  max,
}: {
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (v: T) => void;
  max?: number;
}) {
  const atMax = max != null && selected.length >= max;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isOn = selected.includes(opt.value);
        const disabled = !isOn && atMax;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(opt.value)}
            className={cn(
              "rounded-full px-3 py-2 text-sm font-medium transition-all",
              isOn
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
              disabled && "cursor-not-allowed opacity-40"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ConfidencePills({
  value,
  onChange,
  optional = false,
}: {
  value: number | null;
  onChange: (v: number) => void;
  optional?: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {CONFIDENCE_SCALE.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-all",
              value === n
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {optional ? "Optional · 1 = low confidence, 10 = very confident" : "Required · 1 = low, 10 = very confident"}
      </p>
    </div>
  );
}

type Props = {
  details: CommunityHyroxDetails;
  onChange: (patch: Partial<CommunityHyroxDetails>) => void;
};

export function HyroxTrackAssessmentSection({ details, onChange }: Props) {
  const toggleWeakness = (w: HyroxStationWeakness) => {
    const has = details.station_weaknesses.includes(w);
    if (has) {
      onChange({ station_weaknesses: details.station_weaknesses.filter((x) => x !== w) });
      return;
    }
    if (details.station_weaknesses.length >= 3) return;
    onChange({ station_weaknesses: [...details.station_weaknesses, w] });
  };

  const toggleEquipment = (e: HyroxEquipmentAccess) => {
    const has = details.equipment.includes(e);
    onChange({
      equipment: has ? details.equipment.filter((x) => x !== e) : [...details.equipment, e],
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{HYROX_TRACK_POSITIONING_COPY}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Race context</h3>
        <div className="mt-3 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              HYROX race booked <span className="text-primary">*</span>
            </label>
            <ValuePills
              options={HYROX_RACE_BOOKED_OPTIONS}
              value={details.race_booked}
              onChange={(v) => onChange({ race_booked: v })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Race date (optional)</label>
              <input
                type="date"
                value={details.race_date ?? ""}
                onChange={(e) => onChange({ race_date: e.target.value.trim() || null })}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Race location (optional)</label>
              <input
                type="text"
                placeholder="e.g., London Excel"
                value={details.race_location ?? ""}
                onChange={(e) => onChange({ race_location: e.target.value })}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Category</label>
            <ValuePills
              options={HYROX_CATEGORY_OPTIONS}
              value={details.category}
              onChange={(v) => onChange({ category: v })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Division</label>
            <ValuePills
              options={HYROX_DIVISION_OPTIONS}
              value={details.division}
              onChange={(v) => onChange({ division: v })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Target time (optional)</label>
              <input
                type="text"
                placeholder="e.g., 1:24:00"
                value={details.target_time ?? ""}
                onChange={(e) => onChange({ target_time: e.target.value })}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Previous HYROX time (optional)</label>
              <input
                type="text"
                placeholder="e.g., 1:32:00"
                value={details.previous_time ?? ""}
                onChange={(e) => onChange({ previous_time: e.target.value })}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Race priority</label>
            <ValuePills
              options={HYROX_RACE_PRIORITY_OPTIONS}
              value={details.race_priority}
              onChange={(v) => onChange({ race_priority: v })}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Running ability / engine</h3>
        <div className="mt-3 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Current 5K time (optional)</label>
              <input
                type="text"
                placeholder="e.g., 25:00"
                value={details.current_5k_time ?? ""}
                onChange={(e) => onChange({ current_5k_time: e.target.value })}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Current 10K time (optional)</label>
              <input
                type="text"
                placeholder="e.g., 52:00"
                value={details.current_10k_time ?? ""}
                onChange={(e) => onChange({ current_10k_time: e.target.value })}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Weekly run volume (km, optional)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g., 25"
                value={details.weekly_run_volume_km != null ? String(details.weekly_run_volume_km) : ""}
                onChange={(e) => {
                  const t = e.target.value.trim();
                  if (!t) {
                    onChange({ weekly_run_volume_km: null });
                    return;
                  }
                  const n = Number(t);
                  onChange({ weekly_run_volume_km: Number.isFinite(n) ? n : null });
                }}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Longest recent run (optional)</label>
              <input
                type="text"
                placeholder="e.g., 12 km or 75 min"
                value={details.longest_recent_run ?? ""}
                onChange={(e) => onChange({ longest_recent_run: e.target.value })}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              Running confidence <span className="text-primary">*</span>
            </label>
            <ConfidencePills
              value={details.running_confidence}
              onChange={(v) => onChange({ running_confidence: v })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Treadmill access</label>
            <div className="flex gap-2">
              {[
                { label: "Yes", value: true },
                { label: "No", value: false },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onChange({ treadmill_access: opt.value })}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-all",
                    details.treadmill_access === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">HYROX benchmarks (optional)</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">1K SkiErg</label>
            <input
              type="text"
              placeholder="e.g., 4:00"
              value={details.ski_1k_time ?? ""}
              onChange={(e) => onChange({ ski_1k_time: e.target.value })}
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">1K RowErg</label>
            <input
              type="text"
              placeholder="e.g., 3:45"
              value={details.row_1k_time ?? ""}
              onChange={(e) => onChange({ row_1k_time: e.target.value })}
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Wall ball standard</label>
            <input
              type="text"
              placeholder="e.g., 6 kg / 9 kg"
              value={details.wall_ball_standard ?? ""}
              onChange={(e) => onChange({ wall_ball_standard: e.target.value })}
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Wall balls max unbroken</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="e.g., 40"
              value={details.wall_ball_max_unbroken != null ? String(details.wall_ball_max_unbroken) : ""}
              onChange={(e) => {
                const t = e.target.value.trim();
                if (!t) {
                  onChange({ wall_ball_max_unbroken: null });
                  return;
                }
                const n = Number(t);
                onChange({ wall_ball_max_unbroken: Number.isFinite(n) ? n : null });
              }}
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Burpee broad jump confidence</label>
            <ConfidencePills
              optional
              value={details.burpee_broad_jump_confidence}
              onChange={(v) => onChange({ burpee_broad_jump_confidence: v })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Farmers carry confidence</label>
            <ConfidencePills
              optional
              value={details.farmers_carry_confidence}
              onChange={(v) => onChange({ farmers_carry_confidence: v })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Sled push / pull experience</label>
            <ValuePills
              options={SLED_EXPERIENCE_OPTIONS}
              value={details.sled_push_pull_experience}
              onChange={(v) => onChange({ sled_push_pull_experience: v })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Sandbag lunge confidence</label>
            <ConfidencePills
              optional
              value={details.sandbag_lunge_confidence}
              onChange={(v) => onChange({ sandbag_lunge_confidence: v })}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted-foreground">
          Station weaknesses <span className="text-primary">*</span>
          <span className="ml-1 font-normal">(select up to 3)</span>
        </label>
        <MultiPills
          options={HYROX_STATION_WEAKNESS_OPTIONS}
          selected={details.station_weaknesses}
          onToggle={toggleWeakness}
          max={3}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted-foreground">
          HYROX equipment access <span className="text-primary">*</span>
        </label>
        <MultiPills
          options={HYROX_EQUIPMENT_OPTIONS}
          selected={details.equipment}
          onToggle={toggleEquipment}
        />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Training availability (days per week, session length, double sessions) is captured in the
          general sections above — both tracks use the same schedule fields.
        </p>
      </div>
    </div>
  );
}
