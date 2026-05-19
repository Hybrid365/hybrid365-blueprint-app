import { IPhoneFrame } from "./IPhoneFrame"
import { MockBottomNav, MockStatusBar } from "./mockup/MockScreenChrome"
import { cn } from "@/lib/utils"

type TimelineItem = {
  title: string
  description: string
  week: string
  state: "done" | "active" | "future"
}

const TIMELINE: TimelineItem[] = [
  {
    title: "Athlete Assessment",
    description: "Goals, history, availability and baseline fitness discussed.",
    week: "Week 0",
    state: "done",
  },
  {
    title: "Testing Day",
    description: "Full benchmark testing: 5km run, SkiErg, Row, Sleds, Wall Balls.",
    week: "Week 1",
    state: "done",
  },
  {
    title: "Programme Build",
    description: "12-week personalised programme created based on test results.",
    week: "Week 1",
    state: "done",
  },
  {
    title: "Weekly Check-Ins",
    description: "Ongoing adjustments based on feedback, RPE, and recovery.",
    week: "Ongoing",
    state: "active",
  },
  {
    title: "Mid-Block Review",
    description: "Full re-test of benchmarks. Assess progress and adjust targets.",
    week: "Week 6",
    state: "future",
  },
  {
    title: "Simulation Day",
    description: "Race-pace station work and compromised running rehearsal.",
    week: "Week 10",
    state: "future",
  },
]

function TimelineMarker({ state }: { state: TimelineItem["state"] }) {
  if (state === "done") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f4d23c] text-[10px] font-black text-[#050505]">
        ✓
      </span>
    )
  }
  if (state === "active") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#f4d23c] bg-[#f4d23c]/15 text-[#f4d23c]">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M4 12h4l2-5 4 10 2-5h4" />
        </svg>
      </span>
    )
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/30">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="8" r="3" />
        <path d="M6 18h12" />
      </svg>
    </span>
  )
}

type Props = {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AthleteJourneyMockup({ size = "md", className }: Props) {
  return (
    <IPhoneFrame size={size} className={className}>
      <div className="flex h-full min-h-0 flex-col bg-black">
        <MockStatusBar />
        <div className="flex-1 overflow-hidden px-3 pb-2 pt-1">
          <div className="mb-2 flex items-start gap-2">
            <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50">
              ←
            </span>
            <div>
              <h3 className="text-sm font-bold leading-tight text-white">Your Journey</h3>
              <p className="text-[9px] text-white/45">From Testing Day to Race Day</p>
            </div>
          </div>

          <div className="mb-3 rounded-xl border border-[#f4d23c]/30 bg-gradient-to-r from-[#f4d23c]/[0.08] to-transparent p-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[8px] font-black uppercase tracking-wider text-[#f4d23c]">Race day</p>
                <p className="text-xs font-bold text-white">HYROX London</p>
                <p className="text-[9px] text-white/45">June 15, 2024</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black leading-none text-[#f4d23c]">8</p>
                <p className="text-[8px] text-white/50">weeks to go</p>
              </div>
            </div>
          </div>

          <div className="relative space-y-0">
            <div
              className="absolute bottom-2 left-[13px] top-2 w-px bg-gradient-to-b from-[#f4d23c] via-[#f4d23c]/50 to-white/10"
              aria-hidden
            />
            {TIMELINE.map((item) => (
              <div key={item.title} className="relative flex gap-2 py-1.5">
                <TimelineMarker state={item.state} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <p
                      className={cn(
                        "text-[10px] font-bold leading-tight",
                        item.state === "active"
                          ? "text-[#f4d23c]"
                          : item.state === "done"
                            ? "text-white"
                            : "text-white/40"
                      )}
                    >
                      {item.title}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[7px] font-bold",
                        item.state === "active"
                          ? "border border-[#f4d23c]/40 text-[#f4d23c]"
                          : item.state === "done"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-white/[0.06] text-white/35"
                      )}
                    >
                      {item.week}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 text-[8px] leading-snug",
                      item.state === "future" ? "text-white/30" : "text-white/45"
                    )}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <MockBottomNav active="home" />
      </div>
    </IPhoneFrame>
  )
}
