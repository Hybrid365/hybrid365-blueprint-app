"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Timer,
  Plus,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  X,
  Scale,
  Waves,
  Wind,
  Calendar,
  Check,
  Dumbbell,
  Activity,
  ImageIcon,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { postDashboardGenerateProgramme } from "@/app/lib/postDashboardGenerateProgramme";
import { DashboardSubnav } from "@/components/DashboardSubnav";
import { coreBaselineAreaFlags, countCoreBaselineAreas } from "@/app/lib/benchmarkCoreAreas";
import { parseTimeToSeconds } from "@/app/lib/mapAssessmentToProgrammeInput";

export type BenchmarkTestRow = {
  id: string;
  test_type: string | null;
  test_label: string | null;
  test_value: number | null;
  test_unit: string | null;
  test_time: string | null;
  bodyweight_kg: number | null;
  week_number: number | null;
  test_phase: string | null;
  notes: string | null;
  tested_at: string | null;
};

type Props = {
  programmeInstanceId: string | null;
  initialTests: BenchmarkTestRow[];
  assessmentCompleted: boolean;
  programmeGenerated: boolean;
};

type CategoryId = "engine" | "strength" | "hybrid" | "body";

type TestPreset = {
  id: string;
  category: CategoryId;
  test_type: string;
  cardTitle: string;
  modalLabel: string;
  isTime: boolean;
  test_unit: string | null;
  placeholder: string;
};

const PRESETS: TestPreset[] = [
  { id: "5k", category: "engine", test_type: "5km time trial", cardTitle: "5 km TT", modalLabel: "5 km time trial", isTime: true, test_unit: null, placeholder: "e.g. 24:32" },
  { id: "3k", category: "engine", test_type: "3km time trial", cardTitle: "3 km TT", modalLabel: "3 km time trial", isTime: true, test_unit: null, placeholder: "e.g. 14:05" },
  { id: "ski", category: "engine", test_type: "1km SkiErg", cardTitle: "1 km SkiErg", modalLabel: "1 km SkiErg", isTime: true, test_unit: null, placeholder: "e.g. 4:12" },
  { id: "row", category: "engine", test_type: "1km Row", cardTitle: "1 km Row", modalLabel: "1 km Row", isTime: true, test_unit: null, placeholder: "e.g. 3:45" },
  { id: "pullup", category: "strength", test_type: "Pull-up max reps", cardTitle: "Pull-up max", modalLabel: "Pull-up max reps", isTime: false, test_unit: "reps", placeholder: "e.g. 12" },
  { id: "pushup", category: "strength", test_type: "Push-up max reps", cardTitle: "Push-up max", modalLabel: "Push-up max reps", isTime: false, test_unit: "reps", placeholder: "e.g. 40" },
  { id: "squat5", category: "strength", test_type: "Squat 5RM", cardTitle: "Squat 5RM", modalLabel: "Squat 5RM", isTime: false, test_unit: "kg", placeholder: "e.g. 100" },
  { id: "squat8", category: "strength", test_type: "Squat 8RM", cardTitle: "Squat 8RM", modalLabel: "Squat 8RM", isTime: false, test_unit: "kg", placeholder: "e.g. 85" },
  { id: "bench8", category: "strength", test_type: "DB Bench 8RM", cardTitle: "DB Bench 8RM", modalLabel: "DB Bench 8RM", isTime: false, test_unit: "kg", placeholder: "e.g. 32 (total or per DB)" },
  { id: "rdl8", category: "strength", test_type: "RDL 8RM", cardTitle: "RDL 8RM", modalLabel: "RDL 8RM", isTime: false, test_unit: "kg", placeholder: "e.g. 120" },
  { id: "trap5", category: "strength", test_type: "Trap bar deadlift 5RM", cardTitle: "Trap bar 5RM", modalLabel: "Trap bar deadlift 5RM", isTime: false, test_unit: "kg", placeholder: "e.g. 160" },
  { id: "farmer", category: "strength", test_type: "Farmer carry 40m", cardTitle: "Farmer carry 40m", modalLabel: "Farmer carry 40m", isTime: true, test_unit: null, placeholder: "e.g. 0:45 (40 m time)" },
  { id: "wallball", category: "hybrid", test_type: "Wall ball test", cardTitle: "Wall ball test", modalLabel: "Wall ball test", isTime: false, test_unit: "reps", placeholder: "e.g. 80 reps" },
  { id: "hyrox", category: "hybrid", test_type: "Hyrox race", cardTitle: "Hyrox race", modalLabel: "Hyrox race", isTime: true, test_unit: null, placeholder: "e.g. 1:08:30" },
  { id: "challenge", category: "hybrid", test_type: "Challenge workout", cardTitle: "Challenge workout", modalLabel: "Challenge workout", isTime: true, test_unit: null, placeholder: "e.g. 42:00" },
  { id: "bodyweight", category: "body", test_type: "Bodyweight", cardTitle: "Bodyweight", modalLabel: "Bodyweight", isTime: false, test_unit: "kg", placeholder: "e.g. 78.5" },
  { id: "other", category: "body", test_type: "Other", cardTitle: "Other", modalLabel: "Other", isTime: false, test_unit: null, placeholder: "Numeric score or reps" },
];

const CATEGORY_META: { id: CategoryId; title: string; blurb: string }[] = [
  { id: "engine", title: "Engine", blurb: "Run trials and ergs — your aerobic power reference." },
  { id: "strength", title: "Strength", blurb: "Lifts and calisthenics — measurable strength markers." },
  { id: "hybrid", title: "Hybrid", blurb: "Race-style and mixed tests — capacity under complexity." },
  { id: "body", title: "Body", blurb: "Composition markers — photos coming soon." },
];

type BenchmarkView = {
  id: string;
  title: string;
  icon: ReactNode;
  current: string;
  previous: string;
  change: number;
  /** Shown after current value (empty for times shown as MM:SS). */
  unitSuffix: string;
  lastTested: string;
  history: { date: string; value: string }[];
  higherIsBetter: boolean;
};

function toNumberOrNull(v: string) {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function rowsForType(tests: BenchmarkTestRow[], testType: string) {
  return tests
    .filter((t) => t.test_type === testType)
    .sort((a, b) => String(b.tested_at ?? "").localeCompare(String(a.tested_at ?? "")));
}

function formatDisplay(row: BenchmarkTestRow | undefined, type: string): string {
  if (!row) return "Not logged yet";
  if (type === "Bodyweight" && row.test_value != null && Number.isFinite(row.test_value)) {
    return row.test_unit?.trim() ? `${row.test_value} ${row.test_unit}` : `${row.test_value} kg`;
  }
  if (row.test_time?.trim()) return row.test_time.trim();
  if (row.test_value != null && Number.isFinite(row.test_value)) {
    return row.test_unit?.trim() ? `${row.test_value} ${row.test_unit}` : String(row.test_value);
  }
  return "Not logged yet";
}

function iconForType(testType: string): ReactNode {
  switch (testType) {
    case "5km time trial":
    case "3km time trial":
    case "Hyrox race":
    case "Challenge workout":
      return <Timer className="w-6 h-6" />;
    case "1km SkiErg":
      return <Wind className="w-6 h-6" />;
    case "1km Row":
      return <Waves className="w-6 h-6" />;
    case "Bodyweight":
      return <Scale className="w-6 h-6" />;
    case "Wall ball test":
      return <Activity className="w-6 h-6" />;
    case "Farmer carry 40m":
      return <Dumbbell className="w-6 h-6" />;
    case "Other":
      return <Trophy className="w-6 h-6" />;
    default:
      return <Dumbbell className="w-6 h-6" />;
  }
}

function buildBenchmarkView(preset: TestPreset, tests: BenchmarkTestRow[]): BenchmarkView {
  const rows = rowsForType(tests, preset.test_type);
  const row = rows[0];
  const previous = rows[1];
  const history = rows.slice(0, 4).map((entry, idx) => ({
    date: entry.tested_at ? new Date(entry.tested_at).toLocaleDateString() : `Entry ${idx + 1}`,
    value:
      entry.test_time?.trim() ||
      (entry.test_value != null && Number.isFinite(entry.test_value)
        ? `${entry.test_value}${entry.test_unit?.trim() ? ` ${entry.test_unit}` : ""}`
        : "—"),
  }));

  let change = 0;
  let higherIsBetter = !preset.isTime;
  if (preset.isTime) {
    const cur = parseTimeToSeconds(row?.test_time);
    const prev = parseTimeToSeconds(previous?.test_time);
    if (cur != null && prev != null && prev > 0) {
      change = ((prev - cur) / prev) * 100;
      higherIsBetter = true;
    }
  } else if (row?.test_value != null && previous?.test_value != null && previous.test_value !== 0) {
    change = ((row.test_value - previous.test_value) / previous.test_value) * 100;
  }

  const unitSuffix =
    preset.isTime || preset.test_type === "Other" ? "" : preset.test_unit === "kg" ? "kg" : preset.test_unit === "reps" ? "reps" : "";

  return {
    id: preset.test_type,
    title: preset.cardTitle,
    icon: iconForType(preset.test_type),
    current: formatDisplay(row, preset.test_type),
    previous: previous ? formatDisplay(previous, preset.test_type) : "",
    change,
    unitSuffix,
    lastTested: row?.tested_at ? new Date(row.tested_at).toLocaleDateString() : "Not logged yet",
    history: history.length > 0 ? history : [{ date: "No history", value: "Not logged yet" }],
    higherIsBetter,
  };
}

export default function TestingClient({
  programmeInstanceId,
  initialTests,
  assessmentCompleted,
  programmeGenerated,
}: Props) {
  const router = useRouter();
  const [tests, setTests] = useState(initialTests);
  const [showAddTest, setShowAddTest] = useState(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkView | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatingProgramme, setGeneratingProgramme] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [value, setValue] = useState("");

  const coreAreas = useMemo(() => coreBaselineAreaFlags(tests), [tests]);
  const coreCount = useMemo(() => countCoreBaselineAreas(tests), [tests]);

  const selectedPreset = useMemo(
    () => PRESETS.find((p) => p.id === selectedPresetId) ?? null,
    [selectedPresetId]
  );

  async function onSaveTest() {
    if (!selectedPreset) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const p = selectedPreset;
      const num = toNumberOrNull(value);
      if (!p.isTime && num == null) {
        throw new Error("Enter a valid number for this test.");
      }
      if (p.isTime && !value.trim()) {
        throw new Error("Enter a time for this test.");
      }
      const res = await fetch("/api/dashboard/testing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programme_instance_id: programmeInstanceId,
          test_type: p.test_type,
          test_label: p.modalLabel,
          test_time: p.isTime ? value.trim() || null : null,
          test_value: p.isTime ? null : num,
          test_unit: p.test_unit,
          bodyweight_kg: p.test_type === "Bodyweight" ? num : null,
          week_number: null,
          test_phase: "baseline",
          tested_at: new Date().toISOString().slice(0, 10),
          notes: null,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        console.error("benchmark save failed", payload);
        throw new Error(payload.error || "Failed to save test");
      }
      const payload = (await res.json()) as { test: BenchmarkTestRow };
      setTests((prev) => [payload.test, ...prev]);
      setSuccess("Benchmark test saved.");
      setShowAddTest(false);
      setSelectedPresetId(null);
      setValue("");
      router.refresh();
    } catch (e) {
      console.error("benchmark save error", e);
      setError(e instanceof Error ? e.message : "Unable to save test.");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateProgramme() {
    setGeneratingProgramme(true);
    setGenerateError(null);
    const result = await postDashboardGenerateProgramme();
    if (!result.ok) {
      setGenerateError(result.error);
      setGeneratingProgramme(false);
      return;
    }
    setGeneratingProgramme(false);
    router.push("/dashboard");
    router.refresh();
  }

  const recentTests = tests.slice(0, 8).map((row) => ({
    id: row.id,
    test: row.test_label || row.test_type || "Test",
    result:
      row.test_time ||
      (row.test_value != null ? `${row.test_value}${row.test_unit ? ` ${row.test_unit}` : ""}` : "Result logged"),
    date: row.tested_at ? new Date(row.tested_at).toLocaleDateString() : "Date not set",
    icon: iconForType(String(row.test_type)),
  }));

  const retestTimeline = [
    { week: "Baseline", date: "Start", completed: tests.some((t) => t.test_phase === "baseline") },
    { week: "Week 4", date: "Retest", completed: tests.some((t) => t.test_phase === "retest") },
    { week: "Week 8", date: "Retest", completed: tests.some((t) => t.test_phase === "retest") },
    { week: "Week 12", date: "Final", completed: tests.some((t) => t.test_phase === "final"), current: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1 pb-20 md:pb-0">
        <div className="px-4 pt-6 pb-4 md:px-8 md:pt-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-primary font-semibold text-sm tracking-wide">HYBRID365</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Testing & Benchmarks</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Hybrid baseline: bodyweight, a run marker, an engine test, and a strength marker — plus hybrid tests when
            you want deeper context.
          </p>
          <div className="mt-4">
            <DashboardSubnav variant="light" />
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-4 md:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Core baseline</p>
                <p className="mt-1 text-lg font-bold text-foreground">Baseline testing: {coreCount}/4 core areas complete</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Body marker · Run marker (5 km or 3 km) · Engine (Ski or Row) · Strength marker of your choice
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["Body", coreAreas.body],
                    ["Run", coreAreas.run],
                    ["Engine", coreAreas.engine],
                    ["Strength", coreAreas.strength],
                  ] as const
                ).map(([label, ok]) => (
                  <span
                    key={label}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium",
                      ok ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-muted/40 text-muted-foreground"
                    )}
                  >
                    {ok ? <Check className="h-3 w-3" /> : null}
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {assessmentCompleted && !programmeGenerated ? (
            <div className="mt-6 rounded-2xl border border-yellow-500/25 bg-zinc-950 p-5 sm:p-7 text-zinc-100 shadow-xl shadow-black/25">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">Programme</p>
              <h2 className="mt-2 text-lg font-bold text-white sm:text-xl">
                Baseline testing is recommended, not required
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Log bodyweight, a run trial (5 km or 3 km), one erg (Ski or Row), and at least one strength marker to
                anchor hybrid progress. You can still generate your programme today.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  disabled={generatingProgramme}
                  aria-busy={generatingProgramme}
                  onClick={handleGenerateProgramme}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:min-w-[200px]"
                >
                  {generatingProgramme ? "Generating…" : "Generate programme"}
                </button>
                <Link
                  href="/dashboard"
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-zinc-600 bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 sm:flex-none"
                >
                  Back to dashboard
                </Link>
              </div>
              {generateError ? <p className="mt-4 text-sm text-red-400">{generateError}</p> : null}
            </div>
          ) : null}
        </div>

        <div className="px-4 md:px-8 mb-6">
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Retest timeline</span>
            </div>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-3 left-0 right-0 h-0.5 bg-border" />
              <div
                className="absolute top-3 left-0 h-0.5 bg-primary transition-all"
                style={{
                  width: `${(retestTimeline.filter((x) => x.completed).length / Math.max(1, retestTimeline.length)) * 100}%`,
                }}
              />

              {retestTimeline.map((item) => (
                <div key={item.week} className="relative flex flex-col items-center z-10">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center border-2",
                      item.completed
                        ? "bg-primary border-primary"
                        : item.current
                          ? "bg-card border-primary"
                          : "bg-card border-border"
                    )}
                  >
                    {item.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                    {item.current && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] mt-2 font-medium",
                      item.current ? "text-primary" : item.completed ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {item.week}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 space-y-10 pb-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-foreground">Benchmark library</h2>
            <button
              type="button"
              onClick={() => {
                setShowAddTest(true);
                setSelectedPresetId(null);
                setValue("");
                setError(null);
                setSuccess(null);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add test
            </button>
          </div>

          {CATEGORY_META.map((cat) => (
            <section key={cat.id}>
              <div className="mb-3">
                <h3 className="text-sm font-bold text-foreground tracking-tight">{cat.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{cat.blurb}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {PRESETS.filter((p) => p.category === cat.id).map((preset) => {
                  const benchmark = buildBenchmarkView(preset, tests);
                  const showChip =
                    preset.test_type !== "Other" &&
                    preset.test_type !== "Bodyweight" &&
                    Math.abs(benchmark.change) > 0.05;
                  const isImprovement = benchmark.higherIsBetter ? benchmark.change > 0 : benchmark.change < 0;
                  return (
                    <div
                      key={preset.id}
                      className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                          {benchmark.icon}
                        </div>
                        {showChip ? (
                          <div
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                              isImprovement ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                            )}
                          >
                            {isImprovement ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(benchmark.change).toFixed(1)}%
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </div>
                      <h4 className="font-medium text-foreground mb-1">{benchmark.title}</h4>
                      <div className="flex items-baseline gap-1 mb-2 min-h-[2rem]">
                        <span className="text-xl font-bold text-foreground leading-tight">{benchmark.current}</span>
                        {benchmark.unitSuffix ? (
                          <span className="text-sm text-muted-foreground">{benchmark.unitSuffix}</span>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{benchmark.lastTested}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedBenchmark(benchmark)}
                          className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                        >
                          History <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {cat.id === "body" ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 flex flex-col justify-between">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted text-muted-foreground">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="mt-3">
                      <h4 className="font-medium text-foreground">Progress photos</h4>
                      <p className="mt-1 text-xs text-muted-foreground">Upload coming soon — optional body comp support.</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ))}
        </div>

        <div className="px-4 md:px-8 mt-2 pb-12">
          <h2 className="font-semibold text-foreground mb-4">Recent tests</h2>
          <div className="space-y-3">
            {recentTests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tests logged yet.</p>
            ) : (
              recentTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                      {test.icon}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{test.test}</p>
                      <p className="text-xs text-muted-foreground">{test.date}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-foreground">{test.result}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {showAddTest && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddTest(false)} />
          <div className="relative bg-card border border-border rounded-t-3xl md:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
            <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-foreground">Log new test</h2>
              <button
                type="button"
                onClick={() => setShowAddTest(false)}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-6">
              {CATEGORY_META.map((cat) => (
                <div key={cat.id}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{cat.title}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.filter((p) => p.category === cat.id).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPresetId(p.id);
                          setValue("");
                          setError(null);
                        }}
                        className={cn(
                          "text-left rounded-xl border px-3 py-2.5 transition-colors",
                          selectedPresetId === p.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="text-sm font-medium block">{p.modalLabel}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Result</label>
                <input
                  type="text"
                  placeholder={selectedPreset?.placeholder ?? "Select a test first"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={!selectedPreset}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>
              {error ? <p className="text-sm text-red-300">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
              <button
                type="button"
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedPreset || !value.trim() || saving}
                aria-busy={saving}
                onClick={onSaveTest}
              >
                {saving ? "Saving…" : "Save test result"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedBenchmark && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedBenchmark(null)} />
          <div className="relative bg-card border border-border rounded-t-3xl md:rounded-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {selectedBenchmark.icon}
                </div>
                <h2 className="text-lg font-semibold text-foreground">{selectedBenchmark.title} history</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBenchmark(null)}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedBenchmark.history.map((entry, index) => (
                <div
                  key={`${entry.date}-${index}`}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl",
                    index === 0 ? "bg-primary/10 border border-primary/20" : "bg-secondary"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", index === 0 ? "bg-primary" : "bg-muted-foreground")} />
                    <span className={cn("text-sm font-medium", index === 0 ? "text-primary" : "text-muted-foreground")}>
                      {entry.date}
                    </span>
                  </div>
                  <span className={cn("font-semibold", index === 0 ? "text-primary" : "text-foreground")}>
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
