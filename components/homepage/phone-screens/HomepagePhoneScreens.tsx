/**
 * Export-only simplified React screens — NOT used on the live homepage.
 * Homepage display uses native-resolution PNG crops from public/images/homepage/ui-screens/.
 */
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import type { PhoneScreenId } from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneScreenShell } from "./HomepagePhoneScreenShell";

function ScreenEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[8px] font-black uppercase tracking-wider text-[#f4d23c]">
      {children}
    </p>
  );
}

function ScreenTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-0.5 text-sm font-bold leading-tight text-white">{children}</h3>;
}

function ProgrammeScreen() {
  const days = [
    { day: "Mon", title: "Upper Strength", tag: "Strength", done: true },
    { day: "Tue", title: "Threshold Run", tag: "Run", active: true },
    { day: "Wed", title: "Hybrid Conditioning", tag: "Engine" },
    { day: "Thu", title: "Lower Strength", tag: "Strength" },
    { day: "Fri", title: "Recovery Run", tag: "Run" },
    { day: "Sat", title: "Long Hybrid", tag: "Hybrid" },
  ];

  return (
    <HomepagePhoneScreenShell activeNav="programme">
      <ScreenEyebrow>Week 4 · Build phase</ScreenEyebrow>
      <ScreenTitle>Your Programme</ScreenTitle>
      <p className="text-[8px] text-white/45">6 sessions · 7.5 hrs planned</p>
      <div className="mt-2.5 space-y-1">
        {days.map((s) => (
          <div
            key={s.day}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2 py-1.5",
              s.active
                ? "border-[#f4d23c]/35 bg-[#f4d23c]/[0.08]"
                : "border-white/[0.08] bg-white/[0.03]"
            )}
          >
            <span className="w-7 text-[8px] font-black text-[#f4d23c]">{s.day}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[9px] font-bold text-white">{s.title}</p>
              <p className="text-[7px] text-white/40">{s.tag}</p>
            </div>
            {s.done ? (
              <span className="text-[8px] font-bold text-emerald-400">✓</span>
            ) : s.active ? (
              <span className="rounded-full bg-[#f4d23c] px-1.5 py-0.5 text-[7px] font-black text-[#050505]">
                Today
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </HomepagePhoneScreenShell>
  );
}

function ThresholdRunScreen() {
  return (
    <HomepagePhoneScreenShell activeNav="programme">
      <ScreenEyebrow>Tuesday · Week 4</ScreenEyebrow>
      <ScreenTitle>Threshold Run</ScreenTitle>
      <p className="text-[8px] text-white/45">65 min · Aerobic build · RPE 7–8</p>
      <div className="mt-2.5 rounded-xl border border-[#f4d23c]/30 bg-[#f4d23c]/[0.07] p-2.5">
        <p className="text-[10px] font-bold text-white">Aerobic threshold intervals</p>
        <p className="mt-1 text-[8px] leading-snug text-white/55">
          4 × 8 min @ threshold · 2 min float recoveries
        </p>
        <p className="mt-2 rounded-lg bg-black/40 px-2 py-1 text-[8px] text-[#f4d23c]">
          Coach note: Hold controlled effort — finish strong, not destroyed.
        </p>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {[
          { label: "Target pace", value: "4:28/km" },
          { label: "Total volume", value: "9.2 km" },
          { label: "Warm-up", value: "12 min" },
          { label: "Main set", value: "32 min" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2"
          >
            <p className="text-[7px] font-bold uppercase text-white/40">{item.label}</p>
            <p className="text-[10px] font-black text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </HomepagePhoneScreenShell>
  );
}

function ProgressOverviewScreen() {
  return (
    <HomepagePhoneScreenShell activeNav="progress">
      <ScreenEyebrow>Performance overview</ScreenEyebrow>
      <ScreenTitle>Your dashboard</ScreenTitle>
      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
        {[
          { label: "Race readiness", value: "82%", sub: "+8% this month" },
          { label: "Completion", value: "92%", sub: "This block" },
          { label: "5K trend", value: "16:42", sub: "-18s" },
          { label: "Consistency", value: "11 wks", sub: "Streak" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2"
          >
            <p className="text-[7px] font-bold uppercase text-white/40">{item.label}</p>
            <p className="text-sm font-black text-white">{item.value}</p>
            <p className="text-[8px] text-[#f4d23c]">{item.sub}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full w-[72%] rounded-full bg-[#f4d23c]" />
      </div>
      <p className="mt-1 text-[8px] text-white/45">Block progress · Week 4 of 12</p>
    </HomepagePhoneScreenShell>
  );
}

function PerformanceTestingScreen() {
  const benchmarks = [
    { title: "5km Run", current: "20:30", target: "20:00", delta: "-1:15" },
    { title: "1km SkiErg", current: "3:48", target: "3:45", delta: "-7 sec" },
  ];

  return (
    <HomepagePhoneScreenShell activeNav="progress">
      <ScreenTitle>Performance Testing</ScreenTitle>
      <p className="text-[8px] text-white/45">7 benchmarks tracked · Week 4</p>
      <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-1.5">
        <span className="text-[9px] font-semibold text-emerald-300">6 of 7 improved</span>
        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[7px] font-bold text-emerald-400">
          On Track
        </span>
      </div>
      <div className="mt-2 space-y-1.5">
        {benchmarks.map((b) => (
          <div
            key={b.title}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white">{b.title}</p>
              <span className="text-[9px] font-bold text-emerald-400">↗ {b.delta}</span>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-1 text-center">
              <div>
                <p className="text-[7px] uppercase text-white/35">Current</p>
                <p className="text-[9px] font-bold text-[#f4d23c]">{b.current}</p>
              </div>
              <div>
                <p className="text-[7px] uppercase text-white/35">Target</p>
                <p className="text-[9px] font-semibold text-white/70">{b.target}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </HomepagePhoneScreenShell>
  );
}

function Hybrid365TeamScreen() {
  return (
    <HomepagePhoneScreenShell activeNav="team">
      <ScreenEyebrow>Hybrid365 Team</ScreenEyebrow>
      <ScreenTitle>Coached individually. Built as a team.</ScreenTitle>
      <p className="mt-1 text-[8px] leading-snug text-white/50">
        A standard — not a vibe. Standards, accountability and race-day performance.
      </p>
      <div className="mt-3 space-y-1.5">
        {[
          "Structured programming — not random workouts",
          "Weekly coach check-ins and feedback",
          "Benchmarks tracked against targets",
          "Team environment with individual coaching",
        ].map((trait, i) => (
          <div
            key={trait}
            className="flex gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5"
          >
            <span className="text-[8px] font-black tabular-nums text-[#f4d23c]/70">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="text-[8px] leading-snug text-white/70">{trait}</p>
          </div>
        ))}
      </div>
    </HomepagePhoneScreenShell>
  );
}

function YourJourneyScreen() {
  const steps = [
    { title: "Athlete Assessment", week: "Week 0", state: "done" as const },
    { title: "Testing Day", week: "Week 1", state: "done" as const },
    { title: "Programme Build", week: "Week 1", state: "done" as const },
    { title: "Weekly Check-Ins", week: "Ongoing", state: "active" as const },
    { title: "Race Day", week: "Week 12", state: "future" as const },
  ];

  return (
    <HomepagePhoneScreenShell activeNav="home">
      <ScreenTitle>Your Journey</ScreenTitle>
      <p className="text-[8px] text-white/45">From testing day to race day</p>
      <div className="mt-2 rounded-xl border border-[#f4d23c]/30 bg-gradient-to-r from-[#f4d23c]/[0.08] to-transparent p-2">
        <p className="text-[8px] font-black uppercase text-[#f4d23c]">Race day</p>
        <p className="text-xs font-bold text-white">HYROX London</p>
        <p className="text-[8px] text-white/45">8 weeks to go</p>
      </div>
      <div className="mt-2 space-y-1">
        {steps.map((step) => (
          <div
            key={step.title}
            className={cn(
              "flex items-center justify-between rounded-lg border px-2 py-1.5",
              step.state === "active"
                ? "border-[#f4d23c]/35 bg-[#f4d23c]/[0.08]"
                : "border-white/[0.08] bg-white/[0.03]"
            )}
          >
            <p
              className={cn(
                "text-[9px] font-bold",
                step.state === "active"
                  ? "text-[#f4d23c]"
                  : step.state === "done"
                    ? "text-white"
                    : "text-white/40"
              )}
            >
              {step.title}
            </p>
            <span className="text-[7px] text-white/40">{step.week}</span>
          </div>
        ))}
      </div>
    </HomepagePhoneScreenShell>
  );
}

function ThresholdProgressionChart() {
  const paces = [5.12, 5.05, 4.98, 5.02, 4.92, 4.88, 4.85, 4.82];
  const minY = 4.7;
  const maxY = 5.2;
  const w = 100;
  const h = 44;
  const pad = 4;

  const points = paces.map((pace, i) => {
    const x = pad + (i / (paces.length - 1)) * (w - pad * 2);
    const y = pad + ((pace - minY) / (maxY - minY)) * (h - pad * 2);
    return { x, y, i };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-2">
      <p className="mb-1 text-[9px] font-bold text-white">Threshold pace trend</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[52px] w-full" preserveAspectRatio="none" aria-hidden>
        <path
          d={pathD}
          fill="none"
          stroke="#f4d23c"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {points.map((p) => (
          <circle key={p.i} cx={p.x} cy={p.y} r="1.6" fill="#f4d23c" />
        ))}
      </svg>
      <div className="mt-0.5 flex justify-between text-[6px] text-white/35">
        {["W1", "W3", "W5", "W7", "W9", "W11", "Now"].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function ThresholdProgressionScreen() {
  return (
    <HomepagePhoneScreenShell activeNav="progress">
      <ScreenTitle>Threshold Progression</ScreenTitle>
      <p className="text-[8px] text-white/45">Team Athlete 01 · 12-week build</p>
      <div className="mt-2 rounded-xl border border-[#f4d23c]/25 bg-[#f4d23c]/[0.06] p-2">
        <p className="text-[7px] font-bold uppercase text-[#f4d23c]">Current threshold</p>
        <p className="text-base font-black text-white">4:48 / km</p>
        <p className="text-[8px] font-semibold text-emerald-400">↗ 24 sec faster since Week 1</p>
      </div>
      <div className="mt-2">
        <ThresholdProgressionChart />
      </div>
    </HomepagePhoneScreenShell>
  );
}

function WeeklyRunVolumeScreen() {
  return (
    <HomepagePhoneScreenShell activeNav="progress">
      <ScreenTitle>Weekly Run Volume</ScreenTitle>
      <p className="text-[8px] text-white/45">12-week progressive plan</p>
      <div className="mt-2 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-2">
        <p className="text-[7px] font-bold uppercase text-sky-400">Current week</p>
        <p className="text-base font-black text-white">48 km</p>
        <p className="text-[8px] font-semibold text-emerald-400">↗ +35% from Week 1</p>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1">
        {[
          { label: "Start", value: "25km" },
          { label: "Peak", value: "50km" },
          { label: "Total", value: "443km" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-center"
          >
            <p className="text-[6px] uppercase text-white/35">{s.label}</p>
            <p className="text-[9px] font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>
    </HomepagePhoneScreenShell>
  );
}

function WeightTrackingScreen() {
  return (
    <HomepagePhoneScreenShell activeNav="progress">
      <ScreenTitle>Weight Tracking</ScreenTitle>
      <p className="text-[8px] text-white/45">Week 4 · Target range 77.5–79.0kg</p>
      <div className="mt-2 rounded-xl border border-[#f4d23c]/30 bg-gradient-to-r from-[#f4d23c]/[0.08] to-transparent p-2">
        <p className="text-[7px] font-bold uppercase text-[#f4d23c]">Current weight</p>
        <p className="text-base font-black text-white">78.2 kg</p>
        <span className="mt-1 inline-block rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[7px] font-bold text-emerald-400">
          Within range · ↓ 1.6kg
        </span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1">
        {[
          { label: "Start", value: "79.8kg" },
          { label: "Current", value: "78.2kg" },
          { label: "Target", value: "78.0kg" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-center"
          >
            <p className="text-[6px] uppercase text-white/35">{s.label}</p>
            <p className="text-[9px] font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>
    </HomepagePhoneScreenShell>
  );
}

function WeeklyCheckInScreen() {
  return (
    <HomepagePhoneScreenShell activeNav="checkin">
      <ScreenEyebrow>Weekly check-in</ScreenEyebrow>
      <ScreenTitle>Coach review</ScreenTitle>
      <div className="mt-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5">
        <p className="text-[9px] font-bold text-white">How did Week 4 feel?</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {["Fatigue", "Sessions", "Sleep", "Notes"].map((f) => (
            <span
              key={f}
              className="rounded-full border border-white/15 px-1.5 py-0.5 text-[7px] text-white/55"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-2 rounded-xl border border-[#f4d23c]/25 bg-[#f4d23c]/[0.06] p-2.5">
        <p className="text-[8px] font-black uppercase text-[#f4d23c]">Coach feedback</p>
        <p className="mt-1 text-[8px] leading-snug text-white/70">
          Strong week. Threshold pace is improving — hold the same structure in Week 5.
        </p>
      </div>
    </HomepagePhoneScreenShell>
  );
}

function TeamAthleteOverviewScreen() {
  return (
    <HomepagePhoneScreenShell activeNav="home">
      <ScreenEyebrow>Hybrid365 Team</ScreenEyebrow>
      <ScreenTitle>Team Athlete 01</ScreenTitle>
      <div className="mt-1 flex flex-wrap gap-1">
        <span className="rounded-full border border-[#f4d23c]/40 px-1.5 py-0.5 text-[7px] font-bold text-[#f4d23c]">
          Hyrox Pro Build
        </span>
        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[7px] font-bold text-emerald-400">
          On Track
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {[
          { label: "Race readiness", value: "82%" },
          { label: "Completion", value: "85%" },
          { label: "Bodyweight", value: "78.2kg" },
          { label: "Consistency", value: "87%" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2"
          >
            <p className="text-[7px] font-bold uppercase text-white/40">{item.label}</p>
            <p className="text-sm font-black text-white">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2">
        <p className="text-[9px] font-bold text-white">Next session</p>
        <p className="mt-0.5 text-[8px] text-white/45">Hyrox Conditioning · 55 min · Today</p>
      </div>
    </HomepagePhoneScreenShell>
  );
}

const SCREEN_COMPONENTS: Record<PhoneScreenId, () => ReactElement> = {
  programme: ProgrammeScreen,
  "threshold-run": ThresholdRunScreen,
  "progress-overview": ProgressOverviewScreen,
  "performance-testing": PerformanceTestingScreen,
  "hybrid365-team": Hybrid365TeamScreen,
  "your-journey": YourJourneyScreen,
  "threshold-progression": ThresholdProgressionScreen,
  "weekly-run-volume": WeeklyRunVolumeScreen,
  "weight-tracking": WeightTrackingScreen,
  "weekly-check-in": WeeklyCheckInScreen,
  "team-athlete-overview": TeamAthleteOverviewScreen,
};

export function HomepagePhoneScreenById({ id }: { id: PhoneScreenId }) {
  const Screen = SCREEN_COMPONENTS[id];
  return <Screen />;
}

export function HomepagePhoneScreenExportGrid() {
  return (
    <div className="grid grid-cols-1 gap-8 bg-black p-8">
      {(Object.keys(SCREEN_COMPONENTS) as PhoneScreenId[]).map((id) => (
        <div key={id} id={`export-${id}`} className="w-[390px] bg-black">
          <HomepagePhoneScreenById id={id} />
        </div>
      ))}
    </div>
  );
}
