"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Nav } from "@/components/nav";
import {
  Timer,
  Plus,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  X,
  Calendar,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type BenchmarkView = {
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

export type RetestTimelineItem = {
  week: string;
  date: string;
  completed?: boolean;
  current?: boolean;
};

export type RecentTestView = {
  id: string;
  test: string;
  result: string;
  date: string;
  improvement: boolean;
  icon: ReactNode;
};

export type TestOption = {
  id: string;
  label: string;
  icon: ReactNode;
};

type Props = {
  benchmarks: BenchmarkView[];
  retestTimeline: RetestTimelineItem[];
  recentTests: RecentTestView[];
  testOptions: TestOption[];
  onSaveTest: (selectedTest: string, value: string) => Promise<void> | void;
  addTestSaving?: boolean;
  addTestError?: string | null;
  addTestSuccess?: string | null;
};

function BenchmarkCard({
  benchmark,
  onViewHistory,
}: {
  benchmark: BenchmarkView;
  onViewHistory: () => void;
}) {
  const isImprovement = benchmark.change < 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
          {benchmark.icon}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            isImprovement ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          )}
        >
          {isImprovement ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(benchmark.change)}%
        </div>
      </div>

      <h3 className="font-medium text-foreground mb-1">{benchmark.title}</h3>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-foreground">{benchmark.current}</span>
        <span className="text-sm text-muted-foreground">{benchmark.unit}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{benchmark.lastTested}</span>
        <button onClick={onViewHistory} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
          History <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function TestingPageView({
  benchmarks,
  retestTimeline,
  recentTests,
  testOptions,
  onSaveTest,
  addTestSaving = false,
  addTestError = null,
  addTestSuccess = null,
}: Props) {
  const [showAddTest, setShowAddTest] = useState(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkView | null>(null);
  const [selectedTest, setSelectedTest] = useState("");
  const [value, setValue] = useState("");

  const selectedOption = useMemo(
    () => testOptions.find((option) => option.id === selectedTest),
    [selectedTest, testOptions]
  );

  const placeholder = selectedOption?.id.toLowerCase().includes("bodyweight") ? "e.g., 78.5" : "e.g., 24:32";

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
        </div>

        <div className="px-4 md:px-8 mb-6">
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Retest Timeline</span>
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
                <div key={`${item.week}-${item.date}`} className="relative flex flex-col items-center z-10">
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

        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Core Benchmarks</h2>
            <button
              onClick={() => setShowAddTest(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Test
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {benchmarks.map((benchmark) => (
              <BenchmarkCard key={benchmark.id} benchmark={benchmark} onViewHistory={() => setSelectedBenchmark(benchmark)} />
            ))}
          </div>
        </div>

        <div className="px-4 md:px-8 mt-8 pb-8">
          <h2 className="font-semibold text-foreground mb-4">Recent Tests</h2>
          <div className="space-y-3">
            {recentTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    {test.icon}
                  </div>
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
                  {testOptions.map((test) => (
                    <button
                      key={test.id}
                      onClick={() => setSelectedTest(test.id)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border transition-colors",
                        selectedTest === test.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {test.icon}
                      <span className="text-sm font-medium">{test.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Result</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {addTestError ? <p className="text-sm text-red-300">{addTestError}</p> : null}
              {addTestSuccess ? <p className="text-sm text-emerald-300">{addTestSuccess}</p> : null}

              <button
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedTest || !value || addTestSaving}
                onClick={async () => {
                  await onSaveTest(selectedTest, value);
                  if (!addTestError) {
                    setSelectedTest("");
                    setValue("");
                    setShowAddTest(false);
                  }
                }}
              >
                {addTestSaving ? "Saving..." : "Save Test Result"}
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
                <h2 className="text-lg font-semibold text-foreground">{selectedBenchmark.title} History</h2>
              </div>
              <button onClick={() => setSelectedBenchmark(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedBenchmark.history.map((entry, index) => (
                <div
                  key={entry.date}
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
