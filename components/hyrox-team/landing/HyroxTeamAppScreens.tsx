import { HYROX_ONE_TO_ONE_COACHING_LOOP } from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import type { HyroxTeamAppScreenId } from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import { sessionTypeStyle } from "@/components/hyrox-team/HyroxDashboardUi";
import { IPhoneFrame } from "@/components/hyrox-landing/IPhoneFrame";

const PROGRAMME = [
  { day: "Mon", name: "Threshold run", meta: "5 × 5 min", type: "Run", key: true },
  { day: "Tue", name: "Lower strength", meta: "Squat · hinge · lunge", type: "Strength", key: false },
  { day: "Wed", name: "Station capacity", meta: "Wall balls · sled push", type: "Hybrid", key: true },
  { day: "Thu", name: "Easy aerobic", meta: "40 min conversational", type: "Aerobic", key: false },
  { day: "Sat", name: "Hyrox conditioning", meta: "Run + stations", type: "Hybrid", key: false },
] as const;

const WORKLOAD = [
  { label: "Threshold", value: "25 → 30 min" },
  { label: "Weekly run", value: "68.2 km" },
  { label: "Wall balls", value: "180 reps" },
  { label: "Sled push", value: "160 m" },
] as const;

const TREND = [18, 22, 20, 25, 24, 30];

function PhoneChrome({ children }: { children: React.ReactNode }) {
  return (
    <IPhoneFrame size="lg" className="!w-full !max-w-none text-[10px]">
      <div className="flex h-full flex-col bg-zinc-950 px-3 pb-3 pt-7 text-white">{children}</div>
    </IPhoneFrame>
  );
}

function ScreenLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-yellow-400/90">{children}</p>
  );
}

function ProgrammeScreen() {
  return (
    <PhoneChrome>
      <ScreenLabel>Week 6 · Build</ScreenLabel>
      <p className="mt-1 text-[15px] font-bold leading-tight">Your programme</p>
      <p className="mt-1 text-[10px] text-zinc-500">Example week · illustrative</p>
      <ul className="mt-3 space-y-1.5">
        {PROGRAMME.map((session) => (
          <li key={session.day} className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold text-yellow-400/80">{session.day}</p>
              {session.key ? (
                <span className="text-[8px] font-bold uppercase tracking-wide text-yellow-300">Key</span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[12px] font-semibold leading-tight">{session.name}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`rounded-full border px-1.5 py-px text-[8px] ${sessionTypeStyle(session.type)}`}>
                {session.type}
              </span>
              <span className="text-[9px] text-zinc-500">{session.meta}</span>
            </div>
          </li>
        ))}
      </ul>
    </PhoneChrome>
  );
}

function SessionScreen() {
  return (
    <PhoneChrome>
      <ScreenLabel>Session</ScreenLabel>
      <p className="mt-1 text-[15px] font-bold leading-tight">Threshold run</p>
      <p className="mt-1 text-[10px] text-zinc-500">Example · illustrative</p>
      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
        {[
          ["Duration", "48 min"],
          ["Target", "RPE 7–8"],
          ["Focus", "Threshold"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-1 py-2">
            <p className="text-[8px] uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="mt-0.5 text-[10px] font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-2.5 space-y-2">
        <div className="rounded-xl border border-yellow-500/25 bg-yellow-400/[0.06] px-2.5 py-2">
          <p className="text-[8px] font-bold uppercase tracking-wide text-yellow-400">Objective</p>
          <p className="mt-1 text-[11px] leading-snug text-zinc-200">
            Aerobic durability. Hold threshold without fading the last rep.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 py-2">
          <p className="text-[8px] font-bold uppercase tracking-wide text-zinc-500">Main set</p>
          <p className="mt-1 text-[11px] leading-snug text-zinc-200">5 × 5 min @ threshold · 90s float</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 py-2">
          <p className="text-[8px] font-bold uppercase tracking-wide text-zinc-500">Coach note</p>
          <p className="mt-1 text-[11px] leading-snug text-zinc-300">
            Smooth early. The last interval should look like the first.
          </p>
        </div>
      </div>
    </PhoneChrome>
  );
}

function WorkloadScreen() {
  const max = Math.max(...TREND);
  return (
    <PhoneChrome>
      <ScreenLabel>Progress</ScreenLabel>
      <p className="mt-1 text-[15px] font-bold leading-tight">This week</p>
      <p className="mt-1 text-[10px] text-zinc-500">Example workload · illustrative</p>
      <ul className="mt-3 space-y-1.5">
        {WORKLOAD.map((row) => (
          <li
            key={row.label}
            className="flex items-baseline justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 py-2"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{row.label}</span>
            <span className="text-[12px] font-bold text-white">{row.value}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 py-2.5">
        <p className="text-[8px] font-bold uppercase tracking-wide text-zinc-500">Threshold minutes</p>
        <div className="mt-2 flex h-16 items-end gap-1.5">
          {TREND.map((value, i) => (
            <div key={`trend-${i}`} className="flex h-full flex-1 items-end">
              <div
                className={`w-full rounded-sm ${i === TREND.length - 1 ? "bg-yellow-400" : "bg-zinc-600"}`}
                style={{ height: `${Math.round((value / max) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[9px] text-zinc-500">25 min → 30 min across the block</p>
      </div>
    </PhoneChrome>
  );
}

const SCREENS = {
  programme: ProgrammeScreen,
  session: SessionScreen,
  workload: WorkloadScreen,
} as const;

export function HyroxTeamAppScreen({ id }: { id: HyroxTeamAppScreenId }) {
  const Screen = SCREENS[id];
  return <Screen />;
}

export function HyroxTeamCoachingDecision() {
  const proof = HYROX_ONE_TO_ONE_COACHING_LOOP;
  return (
    <div className="mt-10 rounded-[1.35rem] border border-white/[0.08] bg-white/[0.03] p-4 sm:p-6">
      <p className="max-w-xl text-sm font-medium leading-relaxed text-white/70 sm:text-base">{proof.message}</p>
      <div className="mt-5 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-yellow-400/90">
            {proof.session.title}
          </p>
          <p className="mt-2 text-lg font-bold tracking-tight text-white">{proof.session.facts.join(" · ")}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {proof.recovery.map((item) => (
              <div key={item.label} className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-2 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{item.label}</p>
                <p className="mt-1 text-xl font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-zinc-600">Example feedback · illustrative</p>
        </div>
        <div className="rounded-2xl border border-yellow-500/25 bg-yellow-400/[0.06] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-yellow-300">{proof.decision.label}</p>
          <p className="mt-2 text-base font-semibold leading-snug text-white">{proof.decision.body}</p>
        </div>
      </div>
    </div>
  );
}
