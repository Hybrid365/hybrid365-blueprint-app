"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { postDashboardGenerateProgramme } from "@/app/lib/postDashboardGenerateProgramme";

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

type BenchmarkView = {
  id: string;
  title: string;
  icon: ReactNode;
  current: string;
  previous: string;
  change: number;
  unit: string;
  lastTested: string;
  history: { date: string; value: string }[];
};

function toNumberOrNull(v: string) {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
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
  const [selectedTest, setSelectedTest] = useState("");
  const [value, setValue] = useState("");

  const latestByType = useMemo(() => {
    const map = new Map<string, BenchmarkTestRow>();
    for (const t of tests) {
      if (!t.test_type) continue;
      if (!map.has(t.test_type)) map.set(t.test_type, t);
    }
    return map;
  }, [tests]);

  const testsByType = useMemo(() => {
    const map = new Map<string, BenchmarkTestRow[]>();
    for (const row of tests) {
      if (!row.test_type) continue;
      const existing = map.get(row.test_type) ?? [];
      existing.push(row);
      map.set(row.test_type, existing);
    }
    return map;
  }, [tests]);

  async function onSaveTest() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const selectedMap: Record<string, { test_type: string; unit: string | null; isTime: boolean }> = {
        "5km": { test_type: "5km time trial", unit: null, isTime: true },
        "skierg": { test_type: "1km SkiErg", unit: null, isTime: true },
        "row": { test_type: "1km Row", unit: null, isTime: true },
        "bodyweight": { test_type: "Bodyweight", unit: "kg", isTime: false },
      };
      const selected = selectedMap[selectedTest] ?? {
        test_type: selectedTest,
        unit: null,
        isTime: true,
      };

      const res = await fetch("/api/dashboard/testing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programme_instance_id: programmeInstanceId,
          test_type: selected.test_type,
          test_label: selected.test_type,
          test_time: selected.isTime ? value : null,
          test_value: selected.isTime ? null : toNumberOrNull(value),
          test_unit: selected.unit,
          bodyweight_kg: selected.test_type === "Bodyweight" ? toNumberOrNull(value) : null,
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
      setSelectedTest("");
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

  const benchmarks: BenchmarkView[] = [
    "5km time trial",
    "1km SkiErg",
    "1km Row",
    "Bodyweight",
  ].map((type) => {
    const row = latestByType.get(type);
    const history = (testsByType.get(type) ?? []).slice(0, 4).map((entry, idx) => ({
      date: entry.tested_at ? new Date(entry.tested_at).toLocaleDateString() : `Entry ${idx + 1}`,
      value:
        entry.test_time ||
        (entry.test_value != null ? `${entry.test_value}${entry.test_unit ? ` ${entry.test_unit}` : ""}` : "Logged"),
    }));
    const icon =
      type === "5km time trial" ? (
        <Timer className="w-6 h-6" />
      ) : type === "1km SkiErg" ? (
        <Wind className="w-6 h-6" />
      ) : type === "1km Row" ? (
        <Waves className="w-6 h-6" />
      ) : (
        <Scale className="w-6 h-6" />
      );
    const previous = (testsByType.get(type) ?? [])[1];
    const change =
      row?.test_value != null && previous?.test_value != null && previous.test_value !== 0
        ? ((row.test_value - previous.test_value) / previous.test_value) * 100
        : 0;
    return {
      id: type,
      title: type === "5km time trial" ? "5km TT" : type,
      icon,
      current:
        row?.test_time ||
        (row?.test_value != null ? `${row.test_value}${row.test_unit ? ` ${row.test_unit}` : ""}` : "Not logged yet"),
      previous:
        previous?.test_time ||
        (previous?.test_value != null
          ? `${previous.test_value}${previous.test_unit ? ` ${previous.test_unit}` : ""}`
          : ""),
      change,
      unit: type === "Bodyweight" ? "kg" : "min",
      lastTested: row?.tested_at ? new Date(row.tested_at).toLocaleDateString() : "Not logged yet",
      history: history.length > 0 ? history : [{ date: "No history", value: "Not logged yet" }],
    };
  });

  const recentTests = tests.slice(0, 8).map((row) => ({
    id: row.id,
    test: row.test_label || row.test_type || "Test",
    result:
      row.test_time ||
      (row.test_value != null ? `${row.test_value}${row.test_unit ? ` ${row.test_unit}` : ""}` : "Result logged"),
    date: row.tested_at ? new Date(row.tested_at).toLocaleDateString() : "Date not set",
    improvement: true,
    icon:
      row.test_type === "Bodyweight" ? (
        <Scale className="w-5 h-5 text-muted-foreground" />
      ) : row.test_type === "1km SkiErg" ? (
        <Wind className="w-5 h-5 text-muted-foreground" />
      ) : row.test_type === "1km Row" ? (
        <Waves className="w-5 h-5 text-muted-foreground" />
      ) : (
        <Timer className="w-5 h-5 text-muted-foreground" />
      ),
  }));

  const retestTimeline = [
    { week: "Baseline", date: "Start", completed: tests.some((t) => t.test_phase === "baseline") },
    { week: "Week 4", date: "Retest", completed: tests.some((t) => t.test_phase === "retest") },
    { week: "Week 8", date: "Retest", completed: tests.some((t) => t.test_phase === "retest") },
    { week: "Week 12", date: "Final", completed: tests.some((t) => t.test_phase === "final"), current: true },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Nav />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="px-4 pt-6 pb-4 md:px-8 md:pt-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-primary font-semibold text-sm tracking-wide">HYBRID365</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Testing & Benchmarks</h1>
          <p className="text-muted-foreground text-sm">Track your progress with regular testing</p>

          {assessmentCompleted && !programmeGenerated ? (
            <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 sm:p-5">
              <p className="text-sm font-semibold text-foreground">Baseline testing is optional</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Logging benchmarks improves tracking later, but you can generate your personalised 12-week programme
                anytime once your assessment is complete.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={generatingProgramme}
                  onClick={handleGenerateProgramme}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generatingProgramme ? "Generating…" : "Generate programme"}
                </button>
                <Link
                  href="/dashboard"
                  className="inline-flex justify-center text-sm font-medium text-primary underline-offset-4 hover:underline sm:px-2"
                >
                  Back to dashboard
                </Link>
              </div>
              {generateError ? (
                <p className="mt-3 text-sm text-destructive">{generateError}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="px-4 md:px-8 mb-6">
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Retest Timeline</span>
            </div>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-3 left-0 right-0 h-0.5 bg-border" />
              <div className="absolute top-3 left-0 h-0.5 bg-primary transition-all" style={{ width: `${(retestTimeline.filter((x) => x.completed).length / Math.max(1, retestTimeline.length)) * 100}%` }} />

              {retestTimeline.map((item) => (
                <div key={item.week} className="relative flex flex-col items-center z-10">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center border-2",
                    item.completed
                      ? "bg-primary border-primary"
                      : item.current
                        ? "bg-card border-primary"
                        : "bg-card border-border"
                  )}>
                    {item.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                    {item.current && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                  </div>
                  <span className={cn("text-[10px] mt-2 font-medium", item.current ? "text-primary" : item.completed ? "text-foreground" : "text-muted-foreground")}>
                    {item.week}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Core Benchmarks</h2>
            <button onClick={() => setShowAddTest(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              Add Test
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {benchmarks.map((benchmark) => {
              const isImprovement = benchmark.change < 0;
              return (
                <div key={benchmark.id} className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">{benchmark.icon}</div>
                    <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", isImprovement ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>
                      {isImprovement ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(benchmark.change).toFixed(1)}%
                    </div>
                  </div>
                  <h3 className="font-medium text-foreground mb-1">{benchmark.title}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold text-foreground">{benchmark.current}</span>
                    <span className="text-sm text-muted-foreground">{benchmark.unit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{benchmark.lastTested}</span>
                    <button onClick={() => setSelectedBenchmark(benchmark)} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                      History <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-4 md:px-8 mt-8 pb-8">
          <h2 className="font-semibold text-foreground mb-4">Recent Tests</h2>
          <div className="space-y-3">
            {recentTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">{test.icon}</div>
                  <div>
                    <p className="font-medium text-foreground">{test.test}</p>
                    <p className="text-xs text-muted-foreground">{test.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{test.result}</span>
                  {test.improvement && <TrendingUp className="w-4 h-4 text-green-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showAddTest && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddTest(false)} />
          <div className="relative bg-card border border-border rounded-t-3xl md:rounded-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Log New Test</h2>
              <button onClick={() => setShowAddTest(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Select Test</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "5km", label: "5km Time Trial", icon: <Timer className="w-5 h-5" /> },
                    { id: "skierg", label: "1km SkiErg", icon: <Wind className="w-5 h-5" /> },
                    { id: "row", label: "1km Row", icon: <Waves className="w-5 h-5" /> },
                    { id: "bodyweight", label: "Bodyweight", icon: <Scale className="w-5 h-5" /> },
                  ].map((test) => (
                    <button key={test.id} onClick={() => setSelectedTest(test.id)} className={cn("flex items-center gap-2 p-3 rounded-xl border transition-colors", selectedTest === test.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:text-foreground")}>
                      {test.icon}
                      <span className="text-sm font-medium">{test.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Result</label>
                <input type="text" placeholder={selectedTest === "bodyweight" ? "e.g., 78.5" : "e.g., 24:32"} value={value} onChange={(e) => setValue(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

              <button className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!selectedTest || !value || saving} onClick={onSaveTest}>
                {saving ? "Saving..." : "Save Test Result"}
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
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">{selectedBenchmark.icon}</div>
                <h2 className="text-lg font-semibold text-foreground">{selectedBenchmark.title} History</h2>
              </div>
              <button onClick={() => setSelectedBenchmark(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedBenchmark.history.map((entry, index) => (
                <div key={`${entry.date}-${index}`} className={cn("flex items-center justify-between p-3 rounded-xl", index === 0 ? "bg-primary/10 border border-primary/20" : "bg-secondary")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", index === 0 ? "bg-primary" : "bg-muted-foreground")} />
                    <span className={cn("text-sm font-medium", index === 0 ? "text-primary" : "text-muted-foreground")}>{entry.date}</span>
                  </div>
                  <span className={cn("font-semibold", index === 0 ? "text-primary" : "text-foreground")}>
                    {entry.value} {selectedBenchmark.unit}
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
