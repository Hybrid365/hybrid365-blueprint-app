"use client";

import Link from "next/link";
import { ArrowRight, Flag } from "lucide-react";
import type { CommunityHyroxDetails } from "@/app/lib/communityHyroxAssessment";
import { formatHyroxMetric } from "@/app/lib/communityHyroxDashboard";

type BenchmarkLike = {
  test_type: string | null;
  test_time: string | null;
  test_value: number | null;
  test_unit: string | null;
  tested_at: string | null;
};

const HYROX_BENCHMARKS: {
  key: string;
  label: string;
  matchers: string[];
  assessmentKey?: keyof CommunityHyroxDetails;
  hint: string;
}[] = [
  {
    key: "5k",
    label: "5K run",
    matchers: ["5km", "5k"],
    assessmentKey: "current_5k_time",
    hint: "Engine baseline",
  },
  {
    key: "10k",
    label: "10K run",
    matchers: ["10km", "10k"],
    assessmentKey: "current_10k_time",
    hint: "Threshold marker",
  },
  {
    key: "ski",
    label: "1K SkiErg",
    matchers: ["ski"],
    assessmentKey: "ski_1k_time",
    hint: "Station engine",
  },
  {
    key: "row",
    label: "1K RowErg",
    matchers: ["row"],
    assessmentKey: "row_1k_time",
    hint: "Station engine",
  },
  {
    key: "wallball",
    label: "Wall ball 2-min max quality reps",
    matchers: ["wall ball"],
    assessmentKey: "wall_ball_max_unbroken",
    hint: "Log via Testing",
  },
  {
    key: "farmers",
    label: "Farmers carry hold / distance",
    matchers: ["farmer"],
    hint: "Grip / carry capacity",
  },
  {
    key: "bbj",
    label: "Burpee broad jump density",
    matchers: ["burpee"],
    hint: "Hybrid station work",
  },
  {
    key: "mini",
    label: "Mini HYROX test",
    matchers: ["hyrox", "challenge"],
    hint: "Race-style snapshot",
  },
];

function resolveValue(
  spec: (typeof HYROX_BENCHMARKS)[number],
  tests: BenchmarkLike[],
  details: CommunityHyroxDetails
): string {
  for (const m of spec.matchers) {
    const hit = tests.find((t) =>
      String(t.test_type ?? "")
        .toLowerCase()
        .includes(m.toLowerCase())
    );
    if (hit?.test_time?.trim()) return hit.test_time.trim();
    if (hit?.test_value != null) {
      const unit = hit.test_unit ? ` ${hit.test_unit}` : "";
      return `${hit.test_value}${unit}`;
    }
  }
  if (spec.assessmentKey) {
    const raw = details[spec.assessmentKey];
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  }
  return "Not logged yet";
}

type Props = {
  details: CommunityHyroxDetails;
  benchmarkTests: BenchmarkLike[];
};

export function HyroxBenchmarkPanel({ details, benchmarkTests }: Props) {
  return (
    <section className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.05] to-zinc-950 p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-400/90">
              Recommended HYROX benchmarks
            </p>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Log tests in Testing to track progress — assessment values show until you retest.
          </p>
        </div>
        <Link
          href="/dashboard/testing"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-300 hover:text-amber-200"
        >
          Open Testing
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {HYROX_BENCHMARKS.map((spec) => {
          const value = resolveValue(spec, benchmarkTests, details);
          const muted = value === "Not logged yet";
          return (
            <div
              key={spec.key}
              className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3"
            >
              <p className="text-sm font-medium text-zinc-200">{spec.label}</p>
              <p className={`mt-1 text-lg font-bold ${muted ? "text-zinc-600" : "text-white"}`}>
                {muted ? formatHyroxMetric(null) : value}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">{spec.hint}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
