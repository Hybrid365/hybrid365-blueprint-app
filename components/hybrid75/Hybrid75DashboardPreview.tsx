import {
  Activity,
  BarChart3,
  Calendar,
  ChevronRight,
  Dumbbell,
  Lock,
  Target,
  Trophy,
  Wind,
  Zap,
} from "lucide-react";

const WEEK_DAYS = [
  { day: "Mon", title: "Upper Strength A", stress: "S", active: true },
  { day: "Tue", title: "5 x 5 min Threshold", stress: "H", active: false },
  { day: "Wed", title: "Upper Strength B", stress: "S", active: false },
  { day: "Thu", title: "Hybrid Leg Endurance", stress: "L", active: false },
  { day: "Fri", title: "Easy Run + Mobility", stress: "M", active: false },
  { day: "Sat", title: "Hybrid Hard Challenge", stress: "C", active: false },
  { day: "Sun", title: "Easy Long Run", stress: "E", active: false },
] as const;

const STRESS_COLORS: Record<string, string> = {
  S: "bg-emerald-500/25 text-emerald-300",
  H: "bg-red-500/25 text-red-300",
  L: "bg-orange-500/25 text-orange-300",
  M: "bg-sky-500/25 text-sky-300",
  C: "bg-[#F4D23C]/25 text-[#F4D23C]",
  E: "bg-zinc-600/40 text-zinc-300",
};

function PhoneScreenCard({
  children,
  accent = false,
  className = "",
}: {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        accent
          ? "border-[#F4D23C]/35 bg-gradient-to-br from-zinc-900 to-zinc-950"
          : "border-zinc-800/80 bg-zinc-950/90"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function TrackerRow({
  label,
  current,
  target,
  icon: Icon,
  pending = false,
}: {
  label: string;
  current: number;
  target: number;
  icon: React.ElementType;
  pending?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3 text-[#F4D23C]" />
          <span className="text-[11px] text-zinc-400">{label}</span>
        </div>
        <span className="text-[11px] font-semibold tabular-nums text-white">
          {pending ? "Pending" : `${current}/${target}`}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
        {!pending ? (
          <div
            className="h-full rounded-full bg-[#F4D23C]"
            style={{ width: `${Math.min(100, Math.round((current / target) * 100))}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      {/* Glow */}
      <div className="pointer-events-none absolute -inset-8 rounded-[4rem] bg-[radial-gradient(ellipse_at_center,rgba(244,210,60,0.15),transparent_65%)]" />

      {/* Device frame */}
      <div className="relative rounded-[2.75rem] border border-zinc-700/80 bg-zinc-900 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.04)_inset]">
        {/* Side buttons */}
        <div className="absolute -left-[2px] top-24 h-8 w-[3px] rounded-l bg-zinc-600" />
        <div className="absolute -left-[2px] top-36 h-12 w-[3px] rounded-l bg-zinc-600" />
        <div className="absolute -right-[2px] top-32 h-16 w-[3px] rounded-r bg-zinc-600" />

        {/* Screen */}
        <div className="relative overflow-hidden rounded-[2.25rem] bg-black">
          {/* Dynamic island */}
          <div className="absolute left-1/2 top-2 z-20 h-[22px] w-[90px] -translate-x-1/2 rounded-full bg-black" />

          {/* Status bar */}
          <div className="relative z-10 flex items-center justify-between px-5 pb-1 pt-3 text-[10px] font-medium text-white/80">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <span className="h-2 w-3 rounded-sm border border-white/60" />
              <span className="h-2 w-4 rounded-sm bg-white/80" />
            </div>
          </div>

          {/* App content — scrollable */}
          <div className="max-h-[520px] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* App header */}
            <div className="border-b border-zinc-800/80 bg-zinc-950 px-3 pb-2 pt-1">
              <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {["Overview", "This Week", "Challenge", "Progress"].map((tab, i) => (
                  <span
                    key={tab}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      i === 0 ? "bg-[#F4D23C] text-black" : "border border-zinc-700 text-zinc-500"
                    }`}
                  >
                    {tab}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 p-3 pb-5">
              {/* Hero banner */}
              <div className="rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-3">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F4D23C]/25 bg-[#F4D23C]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#F4D23C]">
                  <span className="h-1 w-1 rounded-full bg-[#F4D23C]" />
                  Hybrid 75
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500">
                  Hybrid<span className="text-[#F4D23C]">365</span>
                </p>
                <h3 className="mt-1 text-base font-extrabold leading-tight text-white">
                  Your <span className="text-[#F4D23C]">Challenge</span> Week
                </h3>
                <div className="mt-2 flex flex-wrap gap-1">
                  {["Hybrid", "5 days", "Intermediate"].map((chip) => (
                    <span key={chip} className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[9px] text-zinc-400">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              {/* Next Session */}
              <PhoneScreenCard accent>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#F4D23C]">Next Session</p>
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-medium text-zinc-300">Mon</span>
                      <span>Priority 1</span>
                    </div>
                    <p className="mt-1.5 text-sm font-bold leading-tight text-white">Upper Strength A</p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">Strength bias · upper push + core</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-300">
                    Easy
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-center gap-1 rounded-lg bg-[#F4D23C] py-2 text-[11px] font-bold text-black">
                  View session
                  <ChevronRight className="h-3 w-3" />
                </div>
              </PhoneScreenCard>

              {/* Challenge targets */}
              <PhoneScreenCard>
                <div className="mb-2 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-[#F4D23C]" />
                  <p className="text-[11px] font-semibold text-white">Challenge Targets</p>
                </div>
                <div className="space-y-2">
                  <TrackerRow label="Runs" current={0} target={3} icon={Activity} />
                  <TrackerRow label="Lifts" current={0} target={3} icon={Dumbbell} />
                  <TrackerRow label="Mobility" current={0} target={1} icon={Wind} />
                  <TrackerRow label="Hybrid Hard" current={0} target={1} icon={Zap} pending />
                </div>
              </PhoneScreenCard>

              {/* Weekly schedule */}
              <PhoneScreenCard>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#F4D23C]" />
                    <p className="text-[11px] font-semibold text-white">This Week</p>
                  </div>
                  <span className="text-[9px] text-zinc-500">Mon → Sun</span>
                </div>
                <div className="space-y-1.5">
                  {WEEK_DAYS.map((item) => (
                    <div
                      key={item.day}
                      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                        item.active ? "border-[#F4D23C]/40 bg-[#F4D23C]/5" : "border-zinc-800/80 bg-black/50"
                      }`}
                    >
                      <span className="w-7 text-[10px] font-bold text-zinc-500">{item.day}</span>
                      <span className={`rounded px-1 py-0.5 text-[8px] font-bold ${STRESS_COLORS[item.stress]}`}>
                        {item.stress}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[10px] text-zinc-200">{item.title}</span>
                      {item.active ? (
                        <span className="text-[8px] font-bold uppercase text-[#F4D23C]">Next</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </PhoneScreenCard>

              {/* Hybrid Hard Challenge */}
              <PhoneScreenCard accent>
                <div className="flex gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4D23C]/15">
                    <Zap className="h-4 w-4 text-[#F4D23C]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#F4D23C]">Saturday</p>
                    <p className="text-[11px] font-bold text-white">Hybrid Hard Weekly Challenge</p>
                    <p className="mt-0.5 text-[9px] leading-relaxed text-zinc-500">
                      Released in Telegram · post proof · submit score
                    </p>
                  </div>
                </div>
              </PhoneScreenCard>

              {/* Leaderboard */}
              <PhoneScreenCard>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-[#F4D23C]" />
                    <p className="text-[11px] font-semibold text-white">Leaderboard</p>
                  </div>
                  <span className="text-[9px] uppercase text-zinc-500">This week</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { rank: 1, name: "Athlete_01", pts: 142 },
                    { rank: 2, name: "Athlete_07", pts: 128 },
                    { rank: 3, name: "You", pts: 0, highlight: true },
                  ].map((row) => (
                    <div
                      key={row.rank}
                      className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${
                        row.highlight ? "border border-[#F4D23C]/25 bg-[#F4D23C]/5" : "bg-zinc-900/80"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                            row.rank === 1 ? "bg-[#F4D23C]/20 text-[#F4D23C]" : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {row.rank}
                        </span>
                        <span className={`text-[10px] ${row.highlight ? "font-semibold text-white" : "text-zinc-400"}`}>
                          {row.name}
                        </span>
                      </div>
                      <span className="text-[10px] tabular-nums text-zinc-500">{row.pts} pts</span>
                    </div>
                  ))}
                </div>
              </PhoneScreenCard>

              {/* Locked tracking */}
              <PhoneScreenCard className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-zinc-950/50" />
                <div className="relative">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-zinc-600" />
                    <p className="text-[11px] font-semibold text-zinc-500">16-Week Programme Tracking</p>
                    <Lock className="ml-auto h-3 w-3 text-zinc-600" />
                  </div>
                  <div className="mt-2 space-y-1.5 opacity-40">
                    <div className="h-5 rounded-md bg-zinc-800" />
                    <div className="h-5 rounded-md bg-zinc-800" />
                  </div>
                  <p className="mt-2 text-[9px] text-zinc-600">Unlock with full Hybrid365 membership</p>
                </div>
              </PhoneScreenCard>
            </div>
          </div>

          {/* Home indicator */}
          <div className="flex justify-center bg-black py-2">
            <div className="h-1 w-24 rounded-full bg-white/25" />
          </div>
        </div>
      </div>
    </div>
  );
}

const FEATURE_CALLOUTS = [
  { label: "Next Session", desc: "Know exactly what to do today" },
  { label: "Challenge Targets", desc: "Runs, lifts, mobility & proof" },
  { label: "Weekly Schedule", desc: "Full Mon–Sun structure" },
  { label: "Hybrid Hard", desc: "Weekly test + leaderboard" },
] as const;

export default function Hybrid75DashboardPreview() {
  return (
    <div className="relative">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-6 xl:gap-10">
        {/* Left callouts — desktop only */}
        <div className="hidden space-y-3 lg:block">
          {FEATURE_CALLOUTS.slice(0, 2).map((item) => (
            <div
              key={item.label}
              className="ml-auto max-w-[220px] rounded-2xl border border-white/10 bg-zinc-950/80 p-4 text-right"
            >
              <p className="text-sm font-semibold text-[#F4D23C]">{item.label}</p>
              <p className="mt-1 text-xs text-white/55">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Phone */}
        <PhoneMockup />

        {/* Right callouts — desktop only */}
        <div className="hidden space-y-3 lg:block">
          {FEATURE_CALLOUTS.slice(2).map((item) => (
            <div
              key={item.label}
              className="max-w-[220px] rounded-2xl border border-white/10 bg-zinc-950/80 p-4"
            >
              <p className="text-sm font-semibold text-[#F4D23C]">{item.label}</p>
              <p className="mt-1 text-xs text-white/55">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile feature pills */}
      <div className="mt-8 flex flex-wrap justify-center gap-2 lg:hidden">
        {FEATURE_CALLOUTS.map((item) => (
          <span
            key={item.label}
            className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-400"
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
