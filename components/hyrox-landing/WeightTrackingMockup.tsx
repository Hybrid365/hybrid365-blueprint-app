import { IPhoneFrame } from "./IPhoneFrame"
import { MockBottomNav, MockStatusBar } from "./mockup/MockScreenChrome"

const WEIGH_INS = [80.2, 79.8, 79.4, 79.1, 78.7, 78.2]

function WeightChart() {
  const minY = 77
  const maxY = 81
  const w = 100
  const h = 40
  const pad = 4

  const points = WEIGH_INS.map((kg, i) => {
    const x = pad + (i / (WEIGH_INS.length - 1)) * (w - pad * 2)
    const y = pad + (1 - (kg - minY) / (maxY - minY)) * (h - pad * 2)
    return { x, y }
  })

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[9px] font-bold text-white">Weekly Weigh-In</span>
        <span className="text-[7px] font-semibold text-[#f4d23c]">6 Weeks ›</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[48px] w-full" preserveAspectRatio="none" aria-hidden>
        {[77, 78, 79, 80, 81].map((v) => {
          const y = pad + (1 - (v - minY) / (maxY - minY)) * (h - pad * 2)
          return (
            <line key={v} x1={pad} x2={w - pad} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          )
        })}
        <rect
          x={pad}
          y={pad + (1 - (79 - minY) / (maxY - minY)) * (h - pad * 2)}
          width={w - pad * 2}
          height={((79 - 78) / (maxY - minY)) * (h - pad * 2)}
          fill="rgba(255,255,255,0.04)"
        />
        <line
          x1={pad}
          x2={w - pad}
          y1={pad + (1 - (78 - minY) / (maxY - minY)) * (h - pad * 2)}
          y2={pad + (1 - (78 - minY) / (maxY - minY)) * (h - pad * 2)}
          stroke="rgba(244,210,60,0.25)"
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
        <path d={pathD} fill="none" stroke="#f4d23c" strokeWidth="1.5" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.6" fill="#f4d23c" />
        ))}
      </svg>
      <div className="mt-0.5 flex justify-between text-[6px] font-semibold text-white/35">
        {["W1", "W2", "W3", "W4", "W5", "W6"].map((l) => (
          <span key={l}>{l}</span>
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

export function WeightTrackingMockup({ size = "md", className, density = "default" }: Props) {
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
              <h3 className="text-[11px] font-bold leading-tight text-white">Weight Tracking</h3>
              <p className="text-[8px] text-white/45">Team Athlete 01 · Week 4</p>
            </div>
          </div>

          <div className="mb-2 rounded-xl border border-[#f4d23c]/30 bg-gradient-to-r from-[#f4d23c]/[0.08] to-transparent p-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4d23c]/15 text-sm">
                  ⚖
                </span>
                <div>
                  <p className="text-[7px] font-bold uppercase tracking-wide text-[#f4d23c]">Current weight</p>
                  <p className="text-base font-black leading-none text-white">78.2 kg</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[7px] font-bold text-emerald-400">
                      Within Range
                    </span>
                    <span className="text-[7px] text-white/40">Target: 77.5–79.0kg</span>
                  </div>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-bold text-emerald-400">
                ↓ -1.6kg
              </span>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-3 gap-1">
            {[
              { label: "Start", value: "79.8kg" },
              { label: "Current", value: "78.2kg", accent: true },
              { label: "Target", value: "78.0kg" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-center">
                <p className="text-[6px] uppercase text-white/35">{s.label}</p>
                <p className={`text-[9px] font-bold ${s.accent ? "text-[#f4d23c]" : "text-white"}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <WeightChart />

          <div className="mt-2 flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] p-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                ↘
              </span>
              <div>
                <p className="text-[6px] uppercase text-white/35">Current trend</p>
                <p className="text-[9px] font-bold text-white">Gradual Decrease</p>
              </div>
            </div>
            <p className="text-right text-[7px] font-semibold text-emerald-400">-0.27kg per week avg</p>
          </div>
        </div>
        <MockBottomNav active="progress" />
      </div>
    </IPhoneFrame>
  )
}
