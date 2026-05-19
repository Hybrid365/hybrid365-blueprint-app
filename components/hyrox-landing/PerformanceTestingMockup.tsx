import { IPhoneFrame } from "./IPhoneFrame"
import { MockBottomNav, MockStatusBar } from "./mockup/MockScreenChrome"
import { cn } from "@/lib/utils"

type Benchmark = {
  title: string
  icon: string
  previous: string
  current: string
  target: string
  delta: string
  progress: number
  accent?: "blue" | "purple"
}

const BENCHMARKS: Benchmark[] = [
  {
    title: "5km Run",
    icon: "〰",
    previous: "21:45",
    current: "20:30",
    target: "20:00",
    delta: "-1:15",
    progress: 72,
    accent: "blue",
  },
  {
    title: "1km SkiErg",
    icon: "⏱",
    previous: "3:55",
    current: "3:48",
    target: "3:45",
    delta: "-7 sec",
    progress: 78,
    accent: "purple",
  },
  {
    title: "1km Row",
    icon: "⏱",
    previous: "3:42",
    current: "3:35",
    target: "3:30",
    delta: "-7 sec",
    progress: 80,
    accent: "blue",
  },
]

function BenchmarkCard({ b }: { b: Benchmark }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-md text-[10px]",
              b.accent === "purple" ? "bg-violet-500/20 text-violet-300" : "bg-sky-500/20 text-sky-300"
            )}
          >
            {b.icon}
          </span>
          <span className="text-[10px] font-bold text-white">{b.title}</span>
        </div>
        <span className="text-[9px] font-bold text-emerald-400">↗ {b.delta}</span>
      </div>
      <div className="grid grid-cols-3 gap-1 text-center">
        <div>
          <p className="text-[7px] uppercase text-white/35">Previous</p>
          <p className="text-[9px] font-semibold text-white/50">{b.previous}</p>
        </div>
        <div>
          <p className="text-[7px] uppercase text-white/35">Current</p>
          <p className="rounded-md border border-[#f4d23c]/40 bg-[#f4d23c]/10 py-0.5 text-[9px] font-bold text-[#f4d23c]">
            {b.current}
          </p>
        </div>
        <div>
          <p className="text-[7px] uppercase text-white/35">Target</p>
          <p className="text-[9px] font-semibold text-[#f4d23c]/90">{b.target}</p>
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-[#f4d23c]" style={{ width: `${b.progress}%` }} />
        </div>
        <span className="text-[8px] text-white/40">{b.progress}%</span>
      </div>
    </div>
  )
}

type Props = {
  size?: "sm" | "md" | "lg"
  className?: string
  density?: "default" | "compact"
}

export function PerformanceTestingMockup({ size = "md", className, density = "default" }: Props) {
  return (
    <IPhoneFrame size={size} className={className} density={density}>
      <div className="flex h-full min-h-0 flex-col bg-black">
        <MockStatusBar />
        <div className="flex-1 overflow-hidden px-3 pb-2 pt-1">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h3 className="text-[11px] font-bold leading-tight text-white">Performance Testing</h3>
              <p className="text-[8px] text-white/45">Team Athlete 01 · 7 benchmarks tracked</p>
            </div>
            <span className="rounded-full border border-[#f4d23c]/35 bg-[#f4d23c]/10 px-2 py-0.5 text-[8px] font-bold text-[#f4d23c]">
              Week 4
            </span>
          </div>

          <div className="mb-2.5 flex items-center justify-between rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-1.5">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[9px] text-emerald-400">
                ◎
              </span>
              <span className="text-[9px] font-semibold text-emerald-300">6 of 7 benchmarks improved</span>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[7px] font-bold text-emerald-400">
              On Track
            </span>
          </div>

          <p className="mb-1.5 text-[9px] font-bold text-white/70">Running Benchmarks</p>
          <div className="mb-2 space-y-1.5">
            <BenchmarkCard b={BENCHMARKS[0]!} />
          </div>

          <p className="mb-1.5 text-[9px] font-bold text-white/70">Station Benchmarks</p>
          <div className="space-y-1.5">
            <BenchmarkCard b={BENCHMARKS[1]!} />
            <BenchmarkCard b={BENCHMARKS[2]!} />
          </div>
        </div>
        <MockBottomNav active="progress" />
      </div>
    </IPhoneFrame>
  )
}
