"use client";

import { useState, useTransition } from "react";
import type { CanaryView } from "@/app/lib/track-canary/model";
import type { DayKey, EquipmentId, SessionLength, TrackIntake } from "@/app/lib/track-foundation/types";
import { minutesIn, trackSessionCard, weekAccent } from "@/app/lib/track-presentation/sessionVisual";
import { PrimarySessionCard } from "@/components/athlete-command-centre/visual-system/sessions/PrimarySessionCard";
import { SecondarySessionRow } from "@/components/athlete-command-centre/visual-system/sessions/SecondarySessionRow";
import { WorkoutTimeline } from "@/components/athlete-command-centre/visual-system/workout/WorkoutTimeline";
import { WeekDateNav } from "@/components/athlete-command-centre/visual-system/navigation/WeekDateNav";
import { VsSectionHeader } from "@/components/athlete-command-centre/visual-system/primitives/SectionHeader";
import { VsStat } from "@/components/athlete-command-centre/visual-system/primitives/Stat";
import {
  acceptAction,
  acceptNextWeekAction,
  activateProgrammeAction,
  addEvidenceAction,
  advanceClockAction,
  completeAssessmentAction,
  completeStationAssessmentAction,
  completeTrainingAction,
  createAssessmentAction,
  keepAction,
  saveCheckInAction,
  saveMorningAction,
  saveOnboardingAction,
  saveStationBatteryAction,
} from "@/app/track/actions";

const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const KIT: Array<{ id: EquipmentId; label: string }> = [
  { id: "gym", label: "Gym" },
  { id: "skierg", label: "SkiErg" },
  { id: "rower", label: "RowErg" },
  { id: "bike", label: "Bike" },
  { id: "sled", label: "Sled" },
  { id: "wall_ball", label: "Wall ball" },
  { id: "farmers", label: "Farmers" },
];

export default function TrackAthleteApp({ view }: { view: CanaryView }) {
  const [pending, start] = useTransition();
  const [screen, setScreen] = useState<"today" | "session" | "choice" | "week" | "progress" | "performance" | "checkin" | "next" | "pain">("today");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [dayId, setDayId] = useState(dayOf(view.clock));
  const session = view.sessions.find((item) => item.id === sessionId) ?? view.sessions.find((item) => item.day === dayId) ?? view.sessions.find((item) => item.day === dayOf(view.clock));
  const weekDays = view.homeDays.map((day) => ({
    id: day.day,
    dow: day.day,
    dateNumber: dateNumberFor(view.clock, day.day),
    isToday: day.today,
    sessionStatuses: day.title === "Rest" ? [] : [day.changed ? "partial" as const : "upcoming" as const],
  }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[var(--h365-background)] pb-24 text-[var(--h365-text)] lg:max-w-6xl">
      <header className="px-4 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="label-caps text-[var(--h365-accent)]">Hybrid365 Track</p>
            <h1 className="font-display text-4xl font-bold uppercase leading-none">{homeTitle(screen, view.phase)}</h1>
          </div>
          <p className="max-w-[9rem] text-right text-xs text-[var(--h365-text-muted)]">{view.countdown}</p>
        </div>
        {view.phase === "home" ? (
          <div className="sticky top-0 z-20 -mx-2 mt-3 border-b border-[var(--h365-border)] bg-[var(--h365-background)]/95 py-1 backdrop-blur">
            <WeekDateNav days={weekDays} selectedId={dayId} onSelect={(id) => { setDayId(id); setScreen("today"); }} />
          </div>
        ) : null}
      </header>

      <div className="px-4 pt-4">
        {view.phase === "onboard" && <Onboarding view={view} pending={pending} start={start} />}
        {view.phase === "evidence" && <Evidence view={view} pending={pending} start={start} known={view.known} />}
        {view.phase === "plan" && (
          <section className="space-y-4">
            <h1 className="text-2xl font-semibold">What we know</h1>
            <div className="rounded-2xl bg-zinc-900 p-4 text-sm leading-6">
              <p>We already know</p>
              {view.known.map((item) => <p key={item}>{item}</p>)}
              <p className="mt-3">We still need</p>
              {(view.needed.length ? view.needed : ["Ski", "Row"]).map((item) => <p key={item}>{item}</p>)}
            </div>
            <p className="text-sm text-zinc-400">Your 5K is recent, so it is not booked again.</p>
            <button type="button" disabled={pending} onClick={() => start(() => createAssessmentAction())} className="w-full rounded-xl bg-[#f4d23c] py-3 font-semibold text-black">Build assessment week</button>
          </section>
        )}
        {view.phase === "assessment" && (
          <Assessment view={view} pending={pending} start={start} onOpen={(id) => { setSessionId(id); setScreen("session"); }} />
        )}
        {view.phase === "ready" && (
          <section className="space-y-4">
            <h1 className="text-2xl font-semibold">You&apos;re ready</h1>
            <p className="text-sm leading-6 text-zinc-300">{view.activationOpen ? "We have what we need to build the first block. Ski, row and your race are on your profile." : "The first block is ready for coach review. It is not active, and nothing in the week can change yet."}</p>
            <button type="button" disabled={pending} onClick={() => start(() => activateProgrammeAction())} className="w-full rounded-xl bg-[#f4d23c] py-3 font-semibold text-black">{view.activationOpen ? "Build my programme" : "Prepare programme for review"}</button>
          </section>
        )}
        {view.phase === "home" && screen === "today" && (
          <Today view={view} dayId={dayId} onSession={() => { setSessionId(session?.id ?? null); setScreen("session"); }} onChoice={() => setScreen("choice")} onPain={() => setScreen("pain")} onCheckIn={() => setScreen("checkin")} onNext={() => setScreen("next")} pending={pending} start={start} />
        )}
        {view.phase === "home" && screen === "choice" && view.recommendation && (
          <Choice view={view} pending={pending} start={start} onDone={() => setScreen("week")} />
        )}
        {view.phase === "home" && screen === "week" && <Week view={view} onOpen={(id) => { setSessionId(id); setScreen("session"); }} />}
        {view.phase === "home" && screen === "session" && session && (
          <SessionDetail session={session} pending={pending} start={start} onDone={() => setScreen("today")} />
        )}
        {view.phase === "home" && screen === "progress" && <Progress view={view} pending={pending} start={start} />}
        {view.phase === "home" && screen === "performance" && <Performance view={view} />}
        {view.phase === "home" && screen === "checkin" && <CheckIn pending={pending} start={start} saved={view.checkIn} />}
        {view.phase === "home" && screen === "next" && <NextWeek view={view} pending={pending} start={start} />}
        {view.phase === "home" && screen === "pain" && (
          <section className="space-y-4">
            <h1 className="text-2xl font-semibold">Pain</h1>
            <p className="text-sm leading-6 text-zinc-300">{view.painNote ?? "Tell us if something hurts. We won't change the week from this alone, and it isn't a diagnosis."}</p>
            <button type="button" disabled={pending} onClick={() => start(async () => { await saveMorningAction({ sleep: 8, energy: 8, recovery: 8, soreness: 3, readiness: 7, pain: true }); setScreen("today"); })} className="w-full rounded-xl bg-white py-3 font-semibold text-black">Report pain</button>
          </section>
        )}
      </div>

      {view.phase === "home" && (
        <nav className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-[430px] -translate-x-1/2 justify-between border-t border-[var(--h365-border)] bg-[var(--h365-background)]/95 px-2 py-2 lg:max-w-6xl">
          {(
            [
              ["today", "Home"],
              ["week", "Week"],
              ["progress", "Progress"],
              ["performance", "Performance"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setScreen(id)} className={`min-h-11 flex-1 text-[11px] font-bold uppercase tracking-[0.14em] ${screen === id || (id === "today" && screen === "session") ? "text-[var(--h365-accent)]" : "text-[var(--h365-text-muted)]"}`}>
              <span className={screen === id || (id === "today" && screen === "session") ? "border-b-2 border-[var(--h365-accent)] pb-1" : ""}>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </main>
  );
}

function homeTitle(screen: string, phase: string): string {
  if (phase !== "home") return "Track";
  if (screen === "week") return "Week";
  if (screen === "progress") return "Progress";
  if (screen === "performance") return "Performance";
  if (screen === "checkin") return "Check-in";
  if (screen === "next") return "Next week";
  return "Today";
}

function dateNumberFor(clock: string, day: string): number {
  const base = new Date(`${clock}T00:00:00Z`);
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const delta = order.indexOf(day) - order.indexOf(names[base.getUTCDay()] ?? "Mon");
  const next = new Date(base);
  next.setUTCDate(base.getUTCDate() + delta);
  return next.getUTCDate();
}

function dayOf(iso: string): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(`${iso}T00:00:00Z`).getUTCDay()] ?? "Mon";
}

function Onboarding({ view, pending, start }: { view: CanaryView; pending: boolean; start: (fn: () => void) => void }) {
  const [days, setDays] = useState<DayKey[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  const [kit, setKit] = useState<EquipmentId[]>(["gym", "skierg", "rower", "bike", "sled", "wall_ball", "farmers"]);
  const [length, setLength] = useState<SessionLength>("60_90");
  const [pain, setPain] = useState(false);
  function toggle<T extends string>(list: T[], value: T, set: (next: T[]) => void) {
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }
  function save() {
    const intake: TrackIntake = {
      athleteId: view.name,
      displayName: view.name,
      goal: "hyrox",
      event: view.activationOpen
        ? { hasEvent: true, eventType: "Hyrox Pro", eventName: "HYROX London", eventDate: "2027-03-20", division: "Pro" }
        : { hasEvent: true, eventType: "Hyrox Pro", eventName: "HYROX Manchester", eventDate: "2027-05-15", division: "Pro" },
      availability: {
        daysPerWeek: days.length,
        availableDays: days,
        unavailableDays: DAYS.filter((day) => !days.includes(day)),
        doublesPossible: false,
        doubleDays: [],
        sessionLength: length,
        weekendAvailable: days.includes("Sat") || days.includes("Sun"),
      },
      background: { runDaysPerWeek: 5, runKmPerWeek: 45, strengthDaysPerWeek: 2, hyroxSessionsPerWeek: 2, bikeOrErgNote: "Ski, row and bike available", trainingAge: "experienced" },
      equipment: kit,
      equipmentConfirmed: true,
      pain: { hasConcern: pain, areas: pain ? ["knee"] : [], severity: pain ? "meaningful_unresolved" : "none", affectsTraining: pain, note: null },
    };
    start(() => saveOnboardingAction(intake));
  }
  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500">{view.name}</p>
        <h1 className="mt-1 text-2xl font-semibold">Set up your training</h1>
      </div>
      <Field label="Goal"><p className="rounded-xl bg-zinc-900 px-4 py-3">HYROX</p></Field>
      <Field label="Event"><p className="rounded-xl bg-zinc-900 px-4 py-3">{view.activationOpen ? "HYROX London · Pro · 20 Mar 2027" : "HYROX Manchester · Pro · 15 May 2027"}</p></Field>
      <Field label="Days you can train">
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button key={day} type="button" onClick={() => toggle(days, day, setDays)} className={days.includes(day) ? "rounded-full bg-[#f4d23c] px-3 py-1 text-sm font-semibold text-black" : "rounded-full bg-zinc-900 px-3 py-1 text-sm"}>{day}</button>
          ))}
        </div>
      </Field>
      <Field label="Session length">
        <div className="flex gap-2">
          {(["45_60", "60_90"] as SessionLength[]).map((value) => (
            <button key={value} type="button" onClick={() => setLength(value)} className={length === value ? "rounded-full bg-white px-3 py-1 text-sm font-semibold text-black" : "rounded-full bg-zinc-900 px-3 py-1 text-sm"}>{value === "45_60" ? "45–60 min" : "60–90 min"}</button>
          ))}
        </div>
      </Field>
      <Field label="Equipment">
        <div className="flex flex-wrap gap-2">
          {KIT.map((item) => (
            <button key={item.id} type="button" onClick={() => toggle(kit, item.id, setKit)} className={kit.includes(item.id) ? "rounded-full bg-zinc-100 px-3 py-1 text-sm text-black" : "rounded-full bg-zinc-900 px-3 py-1 text-sm"}>{item.label}</button>
          ))}
        </div>
      </Field>
      <Field label="Training background"><p className="text-sm text-zinc-300">Experienced. About 45 km running, two strength days, ski, row and bike.</p></Field>
      <Field label="Pain">
        <button type="button" onClick={() => setPain((value) => !value)} className="rounded-full bg-zinc-900 px-3 py-1 text-sm">{pain ? "Yes" : "No pain"}</button>
      </Field>
      <button type="button" disabled={pending} onClick={save} className="w-full rounded-xl bg-[#f4d23c] py-3 font-semibold text-black">Save and continue</button>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>{children}</div>;
}

function Evidence({ view, pending, start, known }: { view: CanaryView; pending: boolean; start: (fn: () => void) => void; known: string[] }) {
  const choice = view.evidenceChoices;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Recent results</h1>
      <p className="text-sm text-zinc-400">We already know {known.length ? known.join(" and ") : "nothing yet"}.</p>
      <button type="button" disabled={pending || known.includes("5K")} onClick={() => start(() => addEvidenceAction({ testId: "run_5k", resultValue: choice.fiveK, date: choice.fiveKDate, source: "official_race" }))} className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-left">5K · {choice.fiveK} · {choice.fiveKDate} · official</button>
      <button type="button" disabled={pending || known.includes("HYROX")} onClick={() => start(() => addEvidenceAction({ testId: "hyrox_race", resultValue: choice.hyrox, date: choice.hyroxDate, source: "official_race" }))} className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-left">{choice.hyroxLabel} · {choice.hyrox} · {choice.hyroxDate}</button>
      {known.length >= 2 && <p className="text-sm text-zinc-400">Both results are saved. The race time does not fill in missing stations.</p>}
    </section>
  );
}

function Assessment({ view, pending, start, onOpen }: { view: CanaryView; pending: boolean; start: (fn: () => void) => void; onOpen: (id: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [result, setResult] = useState("8:12");
  const [stations, setStations] = useState({ wall: "65", push: "40", pull: "40", farmers: "60", bbj: "70" });
  const session = view.sessions.find((item) => item.id === open);
  const stationSession = session?.testId === "hyrox_station_battery";
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Assessment week</h1>
      <p className="text-sm text-zinc-400">We already know {view.known.join(" · ") || "your results"}. Still useful: {view.needed.join(", ") || "nothing critical"}.</p>
      {view.sessions.map((item) => (
        <button key={item.id} type="button" onClick={() => { setOpen(item.id); onOpen(item.id); }} className="flex w-full items-center justify-between rounded-xl bg-zinc-900 px-4 py-3 text-left">
          <span>{item.day}</span>
          <span>{item.title}{item.status === "completed" ? " · done" : ""}</span>
        </button>
      ))}
      {session && session.status !== "completed" && !session.summary.includes("Already covered") && (
        <div className="space-y-3 rounded-2xl border border-zinc-800 p-4">
          <p className="font-medium">{session.title}</p>
          {session.blocks.slice(0, 4).map((line) => <p key={line} className="text-sm text-zinc-300">{line}</p>)}
          {stationSession ? (
            <div className="space-y-2">
              {([
                ["wall", "Wall balls (reps)"],
                ["push", "Sled push (m)"],
                ["pull", "Sled pull (m)"],
                ["farmers", "Farmers (m)"],
                ["bbj", "Burpee broad jump (m)"],
              ] as const).map(([key, label]) => (
                <label key={key} className="block text-sm text-zinc-400">
                  {label}
                  <input value={stations[key]} onChange={(event) => setStations((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full rounded-xl bg-zinc-900 px-3 py-2 text-white" />
                </label>
              ))}
              <button type="button" disabled={pending} onClick={() => start(() => completeStationAssessmentAction({ sessionId: session.id, wallBallReps: stations.wall, sledPushMetres: stations.push, sledPullMetres: stations.pull, farmersMetres: stations.farmers, bbjMetres: stations.bbj, rpe: 7 }))} className="w-full rounded-xl bg-white py-3 font-semibold text-black">Save station results</button>
            </div>
          ) : (
            <>
              <input value={result} onChange={(event) => setResult(event.target.value)} className="w-full rounded-xl bg-zinc-900 px-3 py-2" aria-label="Result" />
              <button type="button" disabled={pending} onClick={() => start(() => completeAssessmentAction({ sessionId: session.id, resultValue: result, rpe: 8 }))} className="w-full rounded-xl bg-white py-3 font-semibold text-black">Save result</button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Today({ view, dayId, onSession, onChoice, onPain, onCheckIn, onNext, pending, start }: { view: CanaryView; dayId: string; onSession: () => void; onChoice: () => void; onPain: () => void; onCheckIn: () => void; onNext: () => void; pending: boolean; start: (fn: () => void) => void }) {
  const today = view.sessions.find((item) => item.day === dayId);
  const card = today
    ? trackSessionCard({ id: today.id, title: today.title, summary: today.summary, pace: today.pace, effort: today.effort, blocks: today.blocks, status: today.status, kind: today.kind })
    : null;
  return (
    <section className="space-y-3 lg:grid lg:grid-cols-[1.3fr_0.7fr] lg:items-start lg:gap-6">
      <div className="space-y-3">
        {card ? <PrimarySessionCard session={card} onOpen={onSession} /> : <p className="font-display text-3xl font-bold uppercase">Rest</p>}
      </div>
      <div className="space-y-3">
        {view.recommendation ? (
          <button type="button" onClick={onChoice} className="w-full rounded-xl bg-[var(--h365-surface)] p-4 text-left">
            <p className="label-caps text-[var(--h365-accent)]">{view.recommendation.canChoose ? "Recovery lower than normal" : "Suggestion · week unchanged"}</p>
            <p className="mt-2 text-sm leading-6">{view.recommendation.also || view.recommendation.why}</p>
          </button>
        ) : (
          <Morning view={view} pending={pending} start={start} />
        )}
        {view.accepted ? (
          <div className="rounded-xl bg-[var(--h365-surface)] p-4 text-sm">
            <p className="label-caps text-[var(--h365-text-muted)]">Why</p>
            <p className="mt-1">{view.accepted.why}</p>
          </div>
        ) : null}
        <div className="flex gap-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--h365-text-muted)]">
          <button type="button" onClick={onCheckIn}>Weekly check-in</button>
          <button type="button" onClick={onNext}>Next week</button>
          <button type="button" onClick={onPain}>Report pain</button>
        </div>
      </div>
    </section>
  );
}

function Morning({ view, pending, start }: { view: CanaryView; pending: boolean; start: (fn: () => void) => void }) {
  const [open, setOpen] = useState(false);
  const saved = view.morning;
  if (saved) {
    const scores = [
      ["Sleep", saved.sleep],
      ["Energy", saved.energy],
      ["Recovery", saved.recovery],
      ["Soreness", saved.soreness],
      ["Readiness", saved.readiness],
    ] as const;
    return (
      <div className="rounded-xl bg-[var(--h365-surface)] px-4 py-3">
        <p className="label-caps text-[var(--h365-text-muted)]">Morning readiness · {saved.localDate.slice(0, 10)}</p>
        <p className="mt-1 text-sm font-semibold">{scores.map(([label, value]) => `${label} ${value}`).join(" · ")}</p>
        <p className="mt-1 text-xs text-[var(--h365-text-muted)]">Pain {saved.pain ? "yes" : "no"} · programme unchanged</p>
      </div>
    );
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-between rounded-xl bg-[var(--h365-surface)] px-4 py-3 text-left">
        <span>
          <span className="label-caps text-[var(--h365-text-muted)]">Morning readiness</span>
          <span className="mt-1 block text-sm font-semibold">Not checked in</span>
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--h365-accent)]">Check in</span>
      </button>
    );
  }
  return <MorningForm pending={pending} start={start} locked={!view.activationOpen} onClose={() => setOpen(false)} />;
}

function MorningForm({ pending, start, locked, onClose }: { pending: boolean; start: (fn: () => void) => void; locked: boolean; onClose: () => void }) {
  const [sleep, setSleep] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [recovery, setRecovery] = useState(7);
  const [soreness, setSoreness] = useState(3);
  const [readiness, setReadiness] = useState(7);
  const [pain, setPain] = useState(false);
  const fields = [
    ["Sleep", sleep, setSleep],
    ["Energy", energy, setEnergy],
    ["Recovery", recovery, setRecovery],
    ["Soreness", soreness, setSoreness],
    ["Readiness", readiness, setReadiness],
  ] as const;
  return (
    <div className="space-y-3 rounded-2xl bg-zinc-950 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">Morning check-in · not saved</p>
      {fields.map(([label, value, set]) => (
        <label key={label} className="block text-sm">
          <span className="flex justify-between"><span>{label}</span><span>{value}</span></span>
          <input type="range" min={1} max={10} value={value} onChange={(event) => set(Number(event.target.value))} className="mt-1 w-full" />
        </label>
      ))}
      <label className="flex items-center justify-between text-sm">
        <span>Pain</span>
        <input type="checkbox" checked={pain} onChange={(event) => setPain(event.target.checked)} />
      </label>
      <p className="text-sm text-zinc-400">These scores are not saved until you submit.</p>
      {locked && <p className="text-sm text-zinc-400">Saving readiness leaves the programme unchanged.</p>}
      <button type="button" disabled={pending} onClick={() => start(() => saveMorningAction({ sleep, energy, recovery, soreness, readiness, pain }))} className="w-full rounded-xl bg-[#f4d23c] py-3 font-semibold text-black">Save morning check-in</button>
      <button type="button" onClick={onClose} className="w-full text-sm text-zinc-500">Cancel</button>
      {!locked && <button type="button" disabled={pending} onClick={() => start(() => advanceClockAction())} className="w-full text-sm text-zinc-500">Next morning</button>}
    </div>
  );
}

function Choice({ view, pending, start, onDone }: { view: CanaryView; pending: boolean; start: (fn: () => void) => void; onDone: () => void }) {
  const rec = view.recommendation;
  if (!rec) return null;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Today</h1>
      <p className="text-sm leading-6 text-zinc-300">{rec.why}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-zinc-900 p-3"><p className="text-xs uppercase text-zinc-500">Today</p><p className="mt-2">{rec.todayTitle}</p></div>
        <div className="rounded-2xl bg-zinc-900 p-3"><p className="text-xs uppercase text-[#f4d23c]">Recommended</p><p className="mt-2">{rec.recommended}</p></div>
      </div>
      <p className="text-sm leading-6 text-zinc-400">{rec.also}</p>
      {rec.canChoose ? (
        <>
          <button type="button" disabled={pending} onClick={() => start(async () => { await acceptAction(); onDone(); })} className="w-full rounded-xl bg-[#f4d23c] py-3 font-semibold text-black">Accept changes</button>
          <button type="button" disabled={pending} onClick={() => start(async () => { await keepAction(); onDone(); })} className="w-full rounded-xl border border-zinc-700 py-3 font-semibold">Keep original plan</button>
        </>
      ) : (
        <p className="rounded-xl bg-zinc-900 px-4 py-3 text-sm leading-6 text-zinc-300">This suggestion is read-only. The week stays as written.</p>
      )}
    </section>
  );
}

function Week({ view, onOpen }: { view: CanaryView; onOpen: (id: string) => void }) {
  return (
    <section className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
      <p className="label-caps text-[var(--h365-text-muted)]">Week {view.currentWeek} of {view.programmeWeeks}</p>
      {view.homeDays.map((day) => {
        const session = view.sessions.find((item) => item.day === day.day);
        if (!session) {
          return <p key={day.day} className="px-1 py-2 text-sm text-[var(--h365-text-muted)]">{day.day} · Rest</p>;
        }
        const card = trackSessionCard({ id: session.id, title: session.title, summary: session.summary, pace: session.pace, effort: session.effort, blocks: session.blocks, status: session.status, kind: session.kind });
        return (
          <SecondarySessionRow
            key={session.id}
            session={card}
            showTimeline
            className={weekAccent(card.categoryLabel)}
            onOpen={() => onOpen(session.id)}
          />
        );
      })}
    </section>
  );
}

function SessionDetail({ session, pending, start, onDone }: { session: CanaryView["sessions"][number]; pending: boolean; start: (fn: () => void) => void; onDone: () => void }) {
  const card = trackSessionCard({ id: session.id, title: session.title, summary: session.summary, pace: session.pace, effort: session.effort, blocks: session.blocks, status: session.status, kind: session.kind });
  const [selected, setSelected] = useState(card.timeline?.segments[0]?.id ?? "");
  const hyrox = /compromised|race-style/i.test(session.title);
  return (
    <section className="space-y-4">
      <PrimarySessionCard session={card} />
      {card.timeline ? <WorkoutTimeline timeline={card.timeline} selectedId={selected} onSelect={setSelected} /> : null}
      <div className="space-y-2">{session.blocks.slice(0, 6).map((line) => <p key={line} className="text-sm leading-relaxed text-[var(--h365-text)]/85">{line}</p>)}</div>
      {session.status !== "completed" && session.kind === "training" && (
        <button type="button" disabled={pending} onClick={() => start(async () => {
          const threshold = /threshold/i.test(session.title);
          await completeTrainingAction({
            sessionId: session.id,
            completion: "completed",
            rpe: 7,
            feel: "expected",
            pain: false,
            actuals: hyrox ? { note: "Stations as planned" } : threshold ? { minutes: 25, note: "threshold" } : { note: "logged" },
          });
          onDone();
        })} className="h-12 w-full rounded-lg bg-[var(--h365-accent)] text-sm font-bold text-black">Completed · RPE 7 · as expected · no pain</button>
      )}
    </section>
  );
}

function Progress({ view, pending, start }: { view: CanaryView; pending: boolean; start: (fn: () => void) => void }) {
  const stations = view.stations.filter((station) => station.evidence === "YES" && station.graph === "YES");
  return (
    <section className="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <div className="space-y-3">
        <VsSectionHeader eyebrow={`Week ${view.currentWeek} of ${view.programmeWeeks}`} title="Training load" />
        {view.workload.length === 0 ? <p className="text-sm text-[var(--h365-text-muted)]">Workload appears once the week is active.</p> : null}
        {view.workload.map((card) => (
          <LoadRow key={card.label} label={card.label} planned={card.planned} completed={card.completed} />
        ))}
      </div>
      {stations.length > 0 ? (
        <div>
          <VsSectionHeader title="Stations" />
          <ul className="mt-3 space-y-2">
            {stations.map((station) => (
              <li key={station.label} className="text-sm">
                <span className="font-semibold">{station.label}</span>
                <span className="text-[var(--h365-text-muted)]"> · {station.note}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {view.stationNeeded ? <StationForm pending={pending} start={start} /> : null}
    </section>
  );
}

function Performance({ view }: { view: CanaryView }) {
  return (
    <section className="space-y-5">
      <VsSectionHeader title="Athlete profile" meta={`Week ${view.currentWeek}`} />
      <div className="grid grid-cols-2 gap-4">
        {view.performance.map((item) => (
          <div key={item.label}>
            <VsStat label={item.label} value={item.display} accent />
            {item.provenance ? <p className="mt-1 text-[11px] text-[var(--h365-text-muted)]">{item.provenance}</p> : null}
          </div>
        ))}
      </div>
      {view.impact.length > 0 ? (
        <div>
          <VsSectionHeader title="Progression" />
          <ol className="mt-3 space-y-2">
            {view.impact.map((line) => (
              <li key={line.label} className="font-display text-2xl font-bold uppercase leading-none">
                {line.label}
                <span className="mt-1 block text-base text-[var(--h365-text-muted)]">{line.current} → {line.next}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}

function LoadRow({ label, planned, completed }: { label: string; planned: string; completed: string | null }) {
  const plan = minutesIn(planned);
  const done = completed ? minutesIn(completed) : null;
  const max = Math.max(plan ?? 0, done ?? 0);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="label-caps text-[var(--h365-text-muted)]">{label}</p>
        <p className="text-xs text-[var(--h365-text)]">{planned}{completed ? ` · done ${completed}` : " · not logged"}</p>
      </div>
      {plan != null && max > 0 ? (
        <div className="mt-2 h-2 bg-[var(--h365-border)]">
          <div className="h-2 bg-[var(--h365-accent)]" style={{ width: `${Math.min(100, (plan / max) * 100)}%` }} />
        </div>
      ) : null}
      {done != null && max > 0 ? (
        <div className="mt-1 h-2 bg-[var(--h365-border)]">
          <div className="h-2 bg-[var(--h365-text)]/70" style={{ width: `${Math.min(100, (done / max) * 100)}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function CheckIn({ pending, start, saved }: { pending: boolean; start: (fn: () => void) => void; saved: CanaryView["checkIn"] }) {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">This week</h1>
      {saved && <p className="text-sm text-zinc-400">Latest check-in · recovery {saved.recovery} · motivation {saved.motivation}</p>}
      <button type="button" disabled={pending} onClick={() => start(() => saveCheckInAction({ recovery: 8, motivation: 8, lifeStress: 3, manageable: 8, soreness: false, availability: false, travel: false, event: false }))} className="w-full rounded-xl bg-[#f4d23c] py-3 font-semibold text-black">Save check-in</button>
      <p className="text-sm leading-6 text-zinc-400">Recovery good, motivation good, life stress low, training feels manageable. No new soreness, travel, or race change.</p>
    </section>
  );
}

function StationForm({ pending, start }: { pending: boolean; start: (fn: () => void) => void }) {
  const [wallBallReps, setWall] = useState("80");
  const [sledPushMetres, setPush] = useState("50");
  const [sledPullMetres, setPull] = useState("50");
  const [farmersMetres, setFarmers] = useState("80");
  const [bbjMetres, setBbj] = useState("80");
  const fields = [
    ["Wall-ball reps", wallBallReps, setWall],
    ["Sled push metres", sledPushMetres, setPush],
    ["Sled pull metres", sledPullMetres, setPull],
    ["Farmers metres", farmersMetres, setFarmers],
    ["Burpee broad jump metres", bbjMetres, setBbj],
  ] as const;
  return (
    <div className="space-y-3 rounded-2xl border border-zinc-800 p-4">
      <p className="font-medium">Station assessment</p>
      <p className="text-sm leading-6 text-zinc-400">Your race time does not show these. One session, with rest between stations.</p>
      {fields.map(([label, value, set]) => (
        <label key={label} className="block text-sm">
          {label}
          <input value={value} onChange={(event) => set(event.target.value)} className="mt-1 w-full rounded-xl bg-zinc-900 px-3 py-2" />
        </label>
      ))}
      <button type="button" disabled={pending} onClick={() => start(() => saveStationBatteryAction({ wallBallReps, sledPushMetres, sledPullMetres, farmersMetres, bbjMetres }))} className="w-full rounded-xl bg-white py-3 font-semibold text-black">Save station results</button>
    </div>
  );
}

function NextWeek({ view, pending, start }: { view: CanaryView; pending: boolean; start: (fn: () => void) => void }) {
  const next = view.nextWeek;
  return (
    <section className="space-y-4">
      <p className="text-xs uppercase tracking-wide text-[#f4d23c]">Next week</p>
      <h1 className="text-2xl font-semibold">{next.accepted ? "Next week is set" : "Next week is ready"}</h1>
      <p className="text-sm text-zinc-400">{next.starts ? `This week stays as it is until ${next.starts}.` : "This week stays as it is."}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-zinc-900 p-3">
          <p className="text-xs uppercase text-zinc-500">This week</p>
          <p className="mt-2">{next.from}</p>
          {next.minutesFrom && <p className="text-sm text-zinc-400">{next.minutesFrom}</p>}
        </div>
        <div className="rounded-2xl bg-zinc-900 p-3">
          <p className="text-xs uppercase text-[#f4d23c]">Next week</p>
          <p className="mt-2">{next.to}</p>
          {next.minutesTo && <p className="text-sm text-zinc-400">{next.minutesTo}</p>}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500">Why</p>
        <p className="mt-1 text-sm leading-6 text-zinc-300">{next.why}</p>
      </div>
      {view.impact.map((line) => (
        <p key={line.label} className="text-sm text-zinc-300">{line.label} · {line.current} → {line.next}</p>
      ))}
      {view.activationOpen && next.acceptLabel && (
        <button type="button" disabled={pending} onClick={() => start(() => acceptNextWeekAction("recommended"))} className="w-full rounded-xl bg-[#f4d23c] py-3 font-semibold text-black">{next.acceptLabel}</button>
      )}
      {view.activationOpen && next.keepLabel && (
        <button type="button" disabled={pending} onClick={() => start(() => acceptNextWeekAction("keep"))} className="w-full rounded-xl border border-zinc-700 py-3 font-semibold">{next.keepLabel}</button>
      )}
      {!view.activationOpen && <p className="rounded-xl bg-zinc-900 px-4 py-3 text-sm leading-6 text-zinc-300">Next week stays written. Applying it is closed for this canary.</p>}
      {view.nextTitles.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Next week plan</p>
          {view.nextTitles.map((day) => (
            <p key={day.day} className="flex justify-between text-sm"><span className="text-zinc-500">{day.day}</span><span>{day.title}</span></p>
          ))}
        </div>
      )}
    </section>
  );
}
