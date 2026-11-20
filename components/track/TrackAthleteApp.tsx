"use client";

import { useState, useTransition } from "react";
import type { CanaryView } from "@/app/lib/track-canary/model";
import type { DayKey, EquipmentId, SessionLength, TrackIntake } from "@/app/lib/track-foundation/types";
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
  const [screen, setScreen] = useState<"today" | "session" | "choice" | "week" | "progress" | "checkin" | "next" | "pain">("today");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const session = view.sessions.find((item) => item.id === sessionId) ?? view.sessions.find((item) => item.day === dayOf(view.clock));

  return (
    <main className="mx-auto min-h-screen w-full max-w-[390px] bg-black pb-24">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-black/95 px-4 py-3 backdrop-blur">
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f4d23c]">Track</p>
          <p className="text-xs text-zinc-400">{view.countdown}</p>
        </div>
        {view.phase === "home" && (
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px]">
            {view.homeDays.map((day) => (
              <div key={day.day} className={day.today ? "rounded-md bg-[#f4d23c] px-1 py-1 font-semibold text-black" : "rounded-md bg-zinc-900 px-1 py-1 text-zinc-400"}>
                {day.day.slice(0, 1)}
                <div className="truncate text-[9px] font-medium">{day.title.split(" ")[0]}</div>
              </div>
            ))}
          </div>
        )}
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
          <Today view={view} onSession={() => { setSessionId(session?.id ?? null); setScreen("session"); }} onChoice={() => setScreen("choice")} onPain={() => setScreen("pain")} pending={pending} start={start} />
        )}
        {view.phase === "home" && screen === "choice" && view.recommendation && (
          <Choice view={view} pending={pending} start={start} onDone={() => setScreen("week")} />
        )}
        {view.phase === "home" && screen === "week" && <Week view={view} onOpen={(id) => { setSessionId(id); setScreen("session"); }} />}
        {view.phase === "home" && screen === "session" && session && (
          <SessionDetail session={session} pending={pending} start={start} onDone={() => setScreen("today")} />
        )}
        {view.phase === "home" && screen === "progress" && <Progress view={view} pending={pending} start={start} />}
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
        <nav className="fixed bottom-0 left-1/2 flex w-full max-w-[390px] -translate-x-1/2 justify-between border-t border-zinc-800 bg-black px-4 py-3 text-xs">
          <button type="button" onClick={() => setScreen("today")}>Today</button>
          <button type="button" onClick={() => setScreen("week")}>Week</button>
          <button type="button" onClick={() => setScreen("progress")}>Progress</button>
          <button type="button" onClick={() => setScreen("checkin")}>Check-in</button>
          <button type="button" onClick={() => setScreen("next")}>Next</button>
        </nav>
      )}
    </main>
  );
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

function Today({ view, onSession, onChoice, onPain, pending, start }: { view: CanaryView; onSession: () => void; onChoice: () => void; onPain: () => void; pending: boolean; start: (fn: () => void) => void }) {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">{dayOf(view.clock)}</h1>
      <button type="button" onClick={onSession} className="w-full rounded-2xl bg-zinc-900 p-4 text-left">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Today</p>
        <p className="mt-1 text-xl">{view.todayTitle}</p>
      </button>
      {view.recommendation ? (
        <button type="button" onClick={onChoice} className="w-full rounded-2xl border border-[#f4d23c] p-4 text-left">
          <p className="text-xs uppercase tracking-wide text-[#f4d23c]">{view.recommendation.canChoose ? "Recovery lower than normal" : "Suggestion · week unchanged"}</p>
          <p className="mt-2 text-sm leading-6">{view.recommendation.also || view.recommendation.why}</p>
        </button>
      ) : (
        <Morning view={view} pending={pending} start={start} />
      )}
      {view.accepted && (
        <div className="rounded-2xl bg-zinc-950 p-4 text-sm leading-6">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Why</p>
          <p className="mt-1">{view.accepted.why}</p>
          <div className="mt-3 space-y-1">{view.accepted.changes.map((line) => <p key={line}>{line}</p>)}</div>
        </div>
      )}
      {view.painNote && <p className="text-sm leading-6 text-zinc-300">{view.painNote}</p>}
      <button type="button" onClick={onPain} className="text-sm text-zinc-500">Report pain</button>
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
      <div className="space-y-3 rounded-2xl bg-zinc-950 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Morning check-in saved · {saved.localDate.slice(0, 10)}</p>
        {scores.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm"><span>{label}</span><span>{value}</span></div>
        ))}
        <p className="text-sm text-zinc-400">Pain · {saved.pain ? "Yes" : "No"}</p>
      </div>
    );
  }
  if (!open) {
    return (
      <div className="space-y-3 rounded-2xl bg-zinc-950 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Morning check-in · {view.clock}</p>
        <p className="text-sm text-zinc-300">Not completed.</p>
        <button type="button" onClick={() => setOpen(true)} className="w-full rounded-xl bg-[#f4d23c] py-3 font-semibold text-black">Complete morning check-in</button>
      </div>
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
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">This week</h1>
      <p className="text-xs uppercase tracking-wide text-zinc-500">Week {view.currentWeek} of {view.programmeWeeks}</p>
      {view.homeDays.map((day) => {
        const session = view.sessions.find((item) => item.day === day.day);
        return (
          <button key={day.day} type="button" onClick={() => session && onOpen(session.id)} className="flex w-full items-center justify-between rounded-xl bg-zinc-900 px-4 py-3 text-left">
            <span className="text-zinc-500">{day.day}</span>
            <span className="text-right">{day.title}</span>
          </button>
        );
      })}
      {view.history.length > 0 && (
        <div className="pt-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Earlier</p>
          {view.history.map((item) => (
            <p key={`${item.day}${item.summary}`} className="mt-2 text-sm text-zinc-400">{item.day} · {item.summary}</p>
          ))}
        </div>
      )}
    </section>
  );
}

function SessionDetail({ session, pending, start, onDone }: { session: CanaryView["sessions"][number]; pending: boolean; start: (fn: () => void) => void; onDone: () => void }) {
  const hyrox = /compromised|race-style/i.test(session.title);
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{session.title}</h1>
      {session.summary && <p className="text-sm leading-6 text-zinc-300">{session.summary}</p>}
      {session.pace && <p className="text-sm">Target pace {session.pace}</p>}
      {session.effort && <p className="text-sm text-zinc-400">{session.effort}</p>}
      <div className="space-y-2">{session.blocks.slice(0, 6).map((line) => <p key={line} className="rounded-xl bg-zinc-900 px-4 py-3 text-sm">{line}</p>)}</div>
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
        })} className="w-full rounded-xl bg-white py-3 font-semibold text-black">Completed · RPE 7 · as expected · no pain</button>
      )}
    </section>
  );
}

function Progress({ view, pending, start }: { view: CanaryView; pending: boolean; start: (fn: () => void) => void }) {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Progress</h1>
      <p className="text-xs uppercase tracking-wide text-zinc-500">This week · week {view.currentWeek}</p>
      {view.workload.length === 0 && <p className="text-sm text-zinc-400">Workload appears once the week is active.</p>}
      {view.workload.map((card) => (
        <div key={card.label} className="rounded-2xl bg-zinc-900 p-4">
          <p className="text-xs uppercase text-zinc-500">{card.label}</p>
          <p className="mt-1">Planned {card.planned}</p>
          <p className="text-sm text-zinc-400">{card.completed ? `Done ${card.completed}` : "Not logged yet"}</p>
        </div>
      ))}
      {view.previousCompleted.length > 0 && (
        <div className="rounded-2xl bg-zinc-900 p-4">
          <p className="text-xs uppercase text-zinc-500">Previous week · completed</p>
          {view.previousCompleted.map((title) => <p key={title} className="mt-2 text-sm">{title}</p>)}
        </div>
      )}
      {view.impact.length > 0 && (
        <div className="rounded-2xl bg-zinc-900 p-4">
          <p className="text-xs uppercase text-zinc-500">This week and next week</p>
          {view.impact.map((line) => (
            <p key={line.label} className="mt-2 text-sm">{line.label} · {line.current} → {line.next}</p>
          ))}
        </div>
      )}
      {view.stationNeeded && <StationForm pending={pending} start={start} />}
      <h2 className="pt-2 text-lg font-semibold">Performance</h2>
      {view.performance.map((item) => (
        <div key={item.label} className="rounded-2xl bg-zinc-900 p-4">
          <p className="text-xs uppercase text-zinc-500">{item.label}</p>
          <p className="mt-1 text-lg">{item.display}</p>
          {item.provenance && <p className="mt-1 text-xs text-zinc-500">{item.provenance}</p>}
        </div>
      ))}
    </section>
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
