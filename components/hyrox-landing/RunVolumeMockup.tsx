import { IPhoneFrame } from "./IPhoneFrame"
import { MockBottomNav, MockStatusBar } from "./mockup/MockScreenChrome"

/** 12-week km values — W4 & W8 deload, W12 race */
const WEEKLY_KM = [25, 28, 32, 26, 35, 38, 42, 34, 45, 50, 46, 48]
const CHART_LABELS = ["W1", "W3", "W5", "W7", "W9", "W11", "Race"]

function RunVolumeChart() {
  const minY = 20
  const maxY = 55
  const w = 100
  const h = 44
  const padX = 4
  const padY = 4

  const points = WEEKLY_KM.map((km, i) => {
    const x = padX + (i / (WEEKLY_KM.length - 1)) * (w - padX * 2)
    const y = padY + (1 - (km - minY) / (maxY - minY)) * (h - padY * 2)
    return { x, y, km, i }
  })

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")

  return (
    <div className="relative rounded-lg border border-white/[0.08] bg-white/[0.02] p-2 pt-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[9px] font-bold text-white">12-Week Progression</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[52px] w-full" preserveAspectRatio="none" aria-hidden>
        {[20, 30, 40, 50].map((v) => {
          const y = padY + (1 - (v - minY) / (maxY - minY)) * (h - padY * 2)
          return (
            <line key={v} x1={padX} x2={w - padX} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          )
        })}
        <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => (
          <circle
            key={p.i}
            cx={p.x}
            cy={p.y}
            r={p.i === points.length - 1 ? 2.2 : 1.6}
            fill={p.i === points.length - 1 ? "#f4d23c" : "#38bdf8"}
            stroke={p.i === points.length - 1 ? "#f4d23c" : "#38bdf8"}
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[6px] font-semibold text-white/35">
        {CHART_LABELS.map((l) => (
          <span key={l} className={l === "Race" ? "text-[#f4d23c]" : undefined}>
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}

type Props = {
  size?: "sm" | "md" | "lg"
  className?: string
  density?: "default" | "compact"
}

export function RunVolumeMockup({ size = "md", className, density = "default" }: Props) {
  return (
    <IPhoneFrame size={size} className={className} density={density}>
      <div className="flex h-full min-h-0 flex-col bg-black">
        <MockStatusBar />
        <div className="flex flex-1 flex-col overflow-hidden px-3 pb-1 pt-1">
          <div className="mb-2 flex items-start gap-1.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[8px] text-white/50">
              ←
            </span>
            <div>
              <h3 className="text-[11px] font-bold leading-tight text-white">Weekly Run Volume</h3>
              <p className="text-[8px] text-white/45">Team Athlete 01 · 12-week plan</p>
            </div>
          </div>

          <div className="mb-2 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[7px] font-bold uppercase tracking-wide text-sky-400">Current weekly volume</p>
                <p className="text-base font-black leading-none text-white">48 km</p>
                <p className="mt-0.5 text-[8px] font-semibold text-emerald-400">↗ +35% from Week 1</p>
              </div>
              <div className="text-right">
                <p className="text-[7px] text-white/40">Peak volume</p>
                <p className="text-[11px] font-bold text-sky-300">50 km</p>
                <p className="text-[7px] text-white/35">Week 10</p>
              </div>
            </div>
          </div>

          <RunVolumeChart />

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[6px] text-white/40">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              Build week
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-600/80" />
              Deload
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f4d23c]" />
              Race week
            </span>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1">
            {[
              { label: "Start", value: "25km" },
              { label: "Peak", value: "50km", accent: true },
              { label: "Total", value: "443km" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-center">
                <p className="text-[6px] uppercase text-white/35">{s.label}</p>
                <p className={`text-[9px] font-bold ${s.accent ? "text-sky-300" : "text-white"}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <p className="mt-2 text-center text-[7px] italic leading-snug text-white/35">
            Progressive volume. Managed fatigue. Built for race day.
          </p>
        </div>
        <MockBottomNav active="progress" />
      </div>
    </IPhoneFrame>
  )
}
