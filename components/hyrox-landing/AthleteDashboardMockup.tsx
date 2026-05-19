import { IPhoneFrame } from "./IPhoneFrame"
import { MockBottomNav, MockStatusBar } from "./mockup/MockScreenChrome"
function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: string
  sub: string
  icon: string
}) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[7px] font-bold uppercase tracking-wide text-white/40">{label}</span>
        <span className="text-[10px] opacity-70">{icon}</span>
      </div>
      <p className="text-sm font-black leading-none text-white">{value}</p>
      <p className="mt-0.5 text-[8px] text-white/40">{sub}</p>
    </div>
  )
}

type Props = {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AthleteDashboardMockup({ size = "md", className }: Props) {
  return (
    <IPhoneFrame size={size} className={className}>
      <div className="flex h-full min-h-0 flex-col bg-black">
        <MockStatusBar />
        <div className="flex-1 overflow-hidden px-3 pb-2 pt-1">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <p className="text-[8px] font-black uppercase tracking-wider text-[#f4d23c]">
                Hybrid365 Team
              </p>
              <h3 className="text-sm font-bold text-white">Team Athlete 01</h3>
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="rounded-full border border-[#f4d23c]/40 px-1.5 py-0.5 text-[7px] font-bold text-[#f4d23c]">
                  Hyrox Pro Build
                </span>
                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[7px] font-bold text-emerald-400">
                  On Track
                </span>
              </div>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4d23c] text-xs font-black text-[#050505]">
              01
            </span>
          </div>

          <div className="mb-2 flex items-center gap-2 rounded-xl border border-[#f4d23c]/25 bg-[#f4d23c]/[0.06] p-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4d23c]/20 text-sm">
              🏆
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[7px] font-black uppercase text-[#f4d23c]">Race day</p>
              <p className="truncate text-[10px] font-bold text-white">HYROX London</p>
              <p className="text-[8px] text-white/45">June 15, 2024</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black leading-none text-[#f4d23c]">8</p>
              <p className="text-[7px] text-white/45">weeks out</p>
            </div>
          </div>

          <div className="mb-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[7px] font-black uppercase text-[#f4d23c]">Programme progress</p>
                <p className="text-[10px] font-bold text-white">Week 4 of 12</p>
                <p className="text-[8px] text-white/45">Aerobic Build Phase</p>
              </div>
              <div className="relative flex h-11 w-11 items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90" aria-hidden>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#f4d23c"
                    strokeWidth="3"
                    strokeDasharray="88"
                    strokeDashoffset="59"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[9px] font-black text-[#f4d23c]">33%</span>
              </div>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full w-1/3 rounded-full bg-[#f4d23c]" />
            </div>
          </div>

          <div className="mb-2 grid grid-cols-2 gap-1.5">
            <StatCard label="Race readiness" value="82%" sub="+8% this month" icon="◎" />
            <StatCard label="Weekly completion" value="85%" sub="5/6 sessions" icon="🔥" />
            <StatCard label="Bodyweight" value="78.2kg" sub="Within range" icon="⚖" />
            <StatCard label="Consistency" value="87%" sub="12-week avg" icon="↗" />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[9px] font-bold text-white">Next Session</p>
              <span className="text-[8px] font-bold text-[#f4d23c]">View Programme ›</span>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2">
              <div className="flex items-start gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f4d23c]/15 text-[#f4d23c]">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                    <path d="M4 12h4l2-5 4 10 2-5h4" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[10px] font-bold text-white">Hyrox Conditioning</p>
                    <span className="rounded-full bg-[#f4d23c] px-1.5 py-0.5 text-[7px] font-black text-[#050505]">
                      Today
                    </span>
                  </div>
                  <p className="text-[8px] text-white/45">Thursday · 55 min · RPE 8</p>
                </div>
              </div>
              <p className="mt-1.5 rounded-lg bg-[#f4d23c]/10 px-2 py-1 text-[8px] leading-snug text-[#f4d23c]">
                Focus: Station simulation with race pace transitions.
              </p>
            </div>
          </div>
        </div>
        <MockBottomNav active="home" />
      </div>
    </IPhoneFrame>
  )
}
