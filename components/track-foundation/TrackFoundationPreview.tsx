"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CORE_JOURNEY_STEPS, journeyContinueTarget } from "@/app/lib/track-production/journeyContinue";
import { evaluateTrackFoundation } from "@/app/lib/track-foundation/pipeline";
import { fixtureById, TRACK_FIXTURES } from "@/app/lib/track-foundation/fixtures";
import { getTest, protocolForAthlete, TEST_LIBRARY } from "@/app/lib/track-foundation/testLibrary";
import { formatDisplayDate } from "@/app/lib/track-foundation/dates";
import { SOURCE_LABEL } from "@/app/lib/track-foundation/policies";
import type {
  BenchmarkResultInput,
  DayKey,
  EquipmentId,
  EvidenceDisposition,
  EvidenceSource,
  SessionLength,
  TrackGoal,
  TrackIntake,
} from "@/app/lib/track-foundation/types";

const STEPS = [
  "goal",
  "event",
  "availability",
  "background",
  "equipment",
  "pain",
  "evidence",
  "decisions",
  "summary",
  "week",
  "profile",
  "ready",
  "progress",
  "home",
] as const;

type Step = (typeof STEPS)[number];

const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EQUIPMENT: Array<{ id: EquipmentId; label: string }> = [
  { id: "gym", label: "Gym" },
  { id: "treadmill", label: "Treadmill" },
  { id: "track", label: "Track" },
  { id: "skierg", label: "SkiErg" },
  { id: "rower", label: "RowErg" },
  { id: "bike", label: "Bike" },
  { id: "assault_bike", label: "Assault bike" },
  { id: "sled", label: "Sled" },
  { id: "wall_ball", label: "Wall ball" },
  { id: "sandbag", label: "Sandbag" },
  { id: "farmers", label: "Farmers" },
  { id: "dumbbells", label: "Dumbbells" },
];

const SOURCES: EvidenceSource[] = [
  "official_race",
  "lab_test",
  "coach_test",
  "training_test",
  "self_entered_benchmark",
  "watch_estimate",
];

const EVIDENCE_TESTS = TEST_LIBRARY.filter((test) => test.id !== "easy_aerobic" && test.id !== "hyrox_station_battery");

function blankIntake(): TrackIntake {
  return {
    athleteId: "preview-athlete",
    displayName: "You",
    goal: null,
    event: { hasEvent: false, eventType: null, eventName: null, eventDate: null, division: null },
    availability: {
      daysPerWeek: 0,
      availableDays: [],
      unavailableDays: [],
      doublesPossible: false,
      doubleDays: [],
      sessionLength: null,
      weekendAvailable: false,
    },
    background: {
      runDaysPerWeek: null,
      runKmPerWeek: null,
      strengthDaysPerWeek: null,
      hyroxSessionsPerWeek: null,
      bikeOrErgNote: null,
      trainingAge: null,
    },
    equipment: [],
    equipmentConfirmed: false,
    pain: { hasConcern: false, areas: [], severity: "none", affectsTraining: false, note: null },
  };
}

function loadFixture(id: string | null): { intake: TrackIntake; results: BenchmarkResultInput[] } {
  const fixture = id ? fixtureById(id) : null;
  if (!fixture) return { intake: blankIntake(), results: [] };
  return {
    intake: structuredClone(fixture.intake),
    results: structuredClone(fixture.results),
  };
}

const DISPOSITION: Record<EvidenceDisposition, string> = {
  CURRENT_ANCHOR: "Recent result accepted",
  RECENT_SUPPORTING_EVIDENCE: "Supporting evidence",
  HISTORICAL_ONLY: "History only",
  RETEST_RECOMMENDED: "Retest recommended",
  INVALID_INCOMPLETE: "Incomplete",
};

export default function TrackFoundationPreview({
  initialFixture,
  initialScreen,
  journey = false,
  initialIntake = null,
  initialResults = [],
  initialStep = null,
  asOf,
  onSaveIntake,
  onSaveResult,
}: {
  initialFixture: string | null;
  initialScreen: string | null;
  journey?: boolean;
  initialIntake?: TrackIntake | null;
  initialResults?: BenchmarkResultInput[];
  initialStep?: string | null;
  asOf?: string;
  onSaveIntake?: (intake: TrackIntake, step: string) => Promise<void>;
  onSaveResult?: (input: { testId: string; resultValue: string; date: string; source: EvidenceSource; notes: string | null }) => Promise<void>;
}) {
  const steps: readonly string[] = journey ? CORE_JOURNEY_STEPS : STEPS;
  const router = useRouter();
  const starting = journey ? { intake: initialIntake ?? blankIntake(), results: initialResults } : loadFixture(initialFixture);
  const requested = journey ? (initialStep ?? "welcome") : ((initialScreen as Step) ?? "goal");
  const startIndex = steps.indexOf(requested);
  const [stepIndex, setStepIndex] = useState(startIndex >= 0 ? startIndex : !journey && initialFixture ? STEPS.indexOf("summary") : 0);
  const [fixtureId, setFixtureId] = useState(journey ? null : initialFixture);
  const [intake, setIntake] = useState<TrackIntake>(journey ? { ...blankIntake(), ...starting.intake, athleteId: starting.intake.athleteId, displayName: starting.intake.displayName } : starting.intake);
  const [results, setResults] = useState<BenchmarkResultInput[]>(starting.results);
  const [saving, setSaving] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);
  const [openTest, setOpenTest] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    testId: "run_5k",
    resultValue: "",
    date: "2026-11-10",
    source: "official_race" as EvidenceSource,
    notes: "",
    correctsResultId: "" as string,
  });

  const step = steps[stepIndex] ?? steps[0];
  const state = useMemo(
    () =>
      evaluateTrackFoundation({
        intake,
        results,
        asOf,
        workload: journey ? [] : fixtureById(fixtureId ?? "")?.workload ?? [],
      }),
    [asOf, fixtureId, intake, journey, results]
  );

  function go(next: number) {
    setStepIndex(Math.max(0, Math.min(steps.length - 1, next)));
    setOpenTest(null);
  }

  async function forward() {
    const target = journey
      ? journeyContinueTarget({ step, steps })
      : { step: steps[Math.min(steps.length - 1, stepIndex + 1)] ?? step, action: "advance" as const, reason: "next" as const };
    if (journey && target.action === "enter") {
      setContinueError(null);
      setSaving(true);
      try {
        if (onSaveIntake) await onSaveIntake(intake, "dashboard");
      } catch (error) {
        console.error("[track journey] continue failed", {
          step,
          requested: "dashboard",
          resolved: "dashboard",
          persisted: step,
          reason: error instanceof Error ? error.message : "unknown",
        });
        setContinueError("We couldn't open Track. Nothing new was saved. Try again.");
        setSaving(false);
        return;
      }
      setSaving(false);
      router.refresh();
      return;
    }
    const currentIndex = Math.max(0, steps.indexOf(step));
    const resolvedIndex = steps.indexOf(target.step);
    if (journey && (resolvedIndex < 0 || resolvedIndex < currentIndex)) {
      console.error("[track journey] continue blocked", {
        step,
        requested: target.step,
        resolved: target.step,
        persisted: step,
        reason: "backward",
      });
      setContinueError("We couldn't move you on. Your place in setup was not changed.");
      return;
    }
    if (journey && (target.action === "stay" || target.step === step)) {
      const blocked = target.reason === "backward-blocked";
      if (blocked) {
        console.error("[track journey] continue blocked", {
          step,
          requested: target.step,
          resolved: target.step,
          persisted: step,
          reason: target.reason,
        });
      }
      setContinueError(blocked ? "We couldn't move you on. Your place in setup was not changed." : "This is the last setup screen.");
      return;
    }
    if (journey && onSaveIntake) {
      setContinueError(null);
      setSaving(true);
      try {
        await onSaveIntake(intake, target.step);
      } catch (error) {
        console.error("[track journey] continue failed", {
          step,
          requested: target.step,
          resolved: target.step,
          persisted: step,
          reason: error instanceof Error ? error.message : "unknown",
        });
        setContinueError("We couldn't open the next step. Nothing new was saved. Try again.");
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    go(resolvedIndex);
  }

  function applyFixture(id: string) {
    const loaded = loadFixture(id);
    setFixtureId(id);
    setIntake(loaded.intake);
    setResults(loaded.results);
    setStepIndex(STEPS.indexOf("summary"));
  }

  function addResult() {
    const test = getTest(draft.testId);
    if (!draft.resultValue.trim() || !test) return;
    const row: BenchmarkResultInput = {
      id: `entered-${results.length + 1}-${draft.testId}`,
      testId: draft.testId,
      resultValue: draft.resultValue.trim(),
      unit: test.resultUnit,
      date: draft.date,
      source: draft.source,
      notes: draft.notes || null,
      correctsResultId: draft.correctsResultId || null,
    };
    setResults((current) => [...current, row]);
    if (journey && onSaveResult) {
      void onSaveResult({ testId: row.testId, resultValue: row.resultValue, date: row.date, source: row.source, notes: row.notes ?? null });
    }
    setDraft((current) => ({ ...current, resultValue: "", notes: "", correctsResultId: "" }));
    setStepIndex(steps.indexOf("decisions"));
  }

  const test = openTest ? getTest(openTest) : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-zinc-950 pb-28">
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]">Hybrid365 Track</p>
        <div className="mt-2 flex items-center justify-between gap-3">
        <h1 className="text-lg font-black tracking-tight">{journey ? "Setup" : "Performance setup"}</h1>
        <p className="text-[11px] font-semibold text-zinc-500">
            {stepIndex + 1} of {steps.length}
          </p>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full bg-[#f4d23c]" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
        </div>
        {!journey && <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {TRACK_FIXTURES.map((fixture) => (
            <button
              key={fixture.id}
              type="button"
              onClick={() => applyFixture(fixture.id)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                fixtureId === fixture.id ? "border-[#f4d23c] text-[#f4d23c]" : "border-zinc-700 text-zinc-400"
              }`}
            >
              {fixture.label}
            </button>
          ))}
        </div>}
      </header>

      <div className="px-4 py-5">
        {step === "welcome" ? (
          <Screen title="Welcome to Track" body="Your setup has not been started. Continue when you are ready to choose a goal. Nothing is filled in for you.">
            <p className="text-sm leading-relaxed text-zinc-300">You can leave and come back. Track keeps the step you reached.</p>
          </Screen>
        ) : null}
        {step === "goal" ? (
          <Screen title="Primary goal" body="Track starts from the event you are training for. This is not a medical form.">
            <Choice
              value={intake.goal}
              options={[
                ["hyrox", "HYROX", "Race the format. Stations, ergs and running."],
                ["hybrid_performance", "Hybrid performance", "Mixed engine, strength and conditioning."],
                ["running_performance", "Running performance", "Pace, threshold and durability."],
              ]}
              onChange={(goal) => setIntake({ ...intake, goal: goal as TrackGoal })}
            />
          </Screen>
        ) : null}

        {step === "event" ? (
          <Screen title="Target event" body="An event date changes the runway. You can continue without one.">
            <div className="grid grid-cols-2 gap-2">
              <Pill active={intake.event.hasEvent} onClick={() => setIntake({ ...intake, event: { ...intake.event, hasEvent: true } })}>
                I have one
              </Pill>
              <Pill
                active={!intake.event.hasEvent}
                onClick={() =>
                  setIntake({
                    ...intake,
                    event: { hasEvent: false, eventType: null, eventName: null, eventDate: null, division: null },
                  })
                }
              >
                Not yet
              </Pill>
            </div>
            {intake.event.hasEvent ? (
              <div className="mt-4 space-y-3">
                <Field label="Event type" value={intake.event.eventType ?? ""} onChange={(eventType) => setIntake({ ...intake, event: { ...intake.event, eventType } })} placeholder="HYROX Open" />
                <Field label="Event name" value={intake.event.eventName ?? ""} onChange={(eventName) => setIntake({ ...intake, event: { ...intake.event, eventName } })} placeholder="HYROX London" />
                <Field label="Date" value={intake.event.eventDate ?? ""} onChange={(eventDate) => setIntake({ ...intake, event: { ...intake.event, eventDate } })} placeholder="2027-03-20" />
                <Field label="Division" value={intake.event.division ?? ""} onChange={(division) => setIntake({ ...intake, event: { ...intake.event, division } })} placeholder="Open" />
              </div>
            ) : null}
          </Screen>
        ) : null}

        {step === "availability" ? (
          <Screen title="Training availability" body="The week is built on the days you can actually train.">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Days</p>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {DAYS.map((day) => {
                const on = intake.availability.availableDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const availableDays = on
                        ? intake.availability.availableDays.filter((item) => item !== day)
                        : [...intake.availability.availableDays, day];
                      setIntake({
                        ...intake,
                        availability: {
                          ...intake.availability,
                          availableDays,
                          daysPerWeek: availableDays.length,
                          weekendAvailable: availableDays.some((item) => item === "Sat" || item === "Sun"),
                        },
                      });
                    }}
                    className={`rounded-lg py-3 text-[11px] font-black ${on ? "bg-[#f4d23c] text-black" : "bg-zinc-900 text-zinc-500"}`}
                  >
                    {day.slice(0, 1)}
                  </button>
                );
              })}
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Time in a session</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  ["under_45", "< 45 min"],
                  ["45_60", "45–60"],
                  ["60_90", "60–90"],
                  ["90_plus", "90+"],
                ] as Array<[SessionLength, string]>
              ).map(([id, label]) => (
                <Pill
                  key={id}
                  active={intake.availability.sessionLength === id}
                  onClick={() => setIntake({ ...intake, availability: { ...intake.availability, sessionLength: id } })}
                >
                  {label}
                </Pill>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setIntake({
                  ...intake,
                  availability: { ...intake.availability, doublesPossible: !intake.availability.doublesPossible },
                })
              }
              className="mt-4 text-left text-sm font-semibold text-zinc-300"
            >
              {intake.availability.doublesPossible ? "Doubles possible" : "No doubles"} — tap to change
            </button>
          </Screen>
        ) : null}

        {step === "background" ? (
          <Screen title="Training background" body="Recent volume is context. A label does not set your ability.">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Run days" value={intake.background.runDaysPerWeek} onChange={(runDaysPerWeek) => setIntake({ ...intake, background: { ...intake.background, runDaysPerWeek } })} />
              <NumberField label="Run km" value={intake.background.runKmPerWeek} onChange={(runKmPerWeek) => setIntake({ ...intake, background: { ...intake.background, runKmPerWeek } })} />
              <NumberField label="Strength days" value={intake.background.strengthDaysPerWeek} onChange={(strengthDaysPerWeek) => setIntake({ ...intake, background: { ...intake.background, strengthDaysPerWeek } })} />
              <NumberField label="HYROX sessions" value={intake.background.hyroxSessionsPerWeek} onChange={(hyroxSessionsPerWeek) => setIntake({ ...intake, background: { ...intake.background, hyroxSessionsPerWeek } })} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(["beginner", "intermediate", "experienced"] as const).map((age) => (
                <Pill
                  key={age}
                  active={intake.background.trainingAge === age}
                  onClick={() => setIntake({ ...intake, background: { ...intake.background, trainingAge: age } })}
                >
                  {age}
                </Pill>
              ))}
            </div>
          </Screen>
        ) : null}

        {step === "equipment" ? (
          <Screen title="Equipment" body="Tests you cannot do are left out. A sled is not prescribed without a sled.">
            <div className="grid grid-cols-2 gap-2">
              {EQUIPMENT.map((item) => {
                const on = intake.equipment.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const equipment = on ? intake.equipment.filter((id) => id !== item.id) : [...intake.equipment, item.id];
                      setIntake({ ...intake, equipment, equipmentConfirmed: true });
                    }}
                    className={`rounded-xl border px-3 py-3 text-left text-sm font-bold ${
                      on ? "border-[#f4d23c] bg-[#f4d23c]/10 text-white" : "border-zinc-800 bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="mt-4 text-sm font-semibold text-zinc-400"
              onClick={() => setIntake({ ...intake, equipmentConfirmed: true })}
            >
              {intake.equipmentConfirmed ? "Equipment confirmed" : "Confirm this list, even if empty"}
            </button>
          </Screen>
        ) : null}

        {step === "pain" ? (
          <Screen title="Pain or limitation" body="We do not diagnose. Unresolved pain pauses maximal testing.">
            <Choice
              value={intake.pain.severity}
              options={[
                ["none", "None", "Training is not limited by pain."],
                ["mild_managed", "Mild, managed", "You can train. Tell us where."],
                ["meaningful_unresolved", "Needs review", "Pain is affecting training."],
              ]}
              onChange={(severity) =>
                setIntake({
                  ...intake,
                  pain: {
                    ...intake.pain,
                    severity: severity as TrackIntake["pain"]["severity"],
                    hasConcern: severity !== "none",
                    affectsTraining: severity === "meaningful_unresolved",
                  },
                })
              }
            />
            {intake.pain.severity !== "none" ? (
              <Field
                label="Where"
                value={intake.pain.areas.join(", ")}
                onChange={(value) =>
                  setIntake({
                    ...intake,
                    pain: { ...intake.pain, areas: value.split(",").map((part) => part.trim()).filter(Boolean) },
                  })
                }
                placeholder="Knee"
              />
            ) : null}
          </Screen>
        ) : null}

        {step === "evidence" ? (
          <Screen title="Recent results" body="If it is recent and valid, you will not be asked to repeat it.">
            <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Test
              <select
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black px-3 py-3 text-base font-bold text-white"
                value={draft.testId}
                onChange={(event) => setDraft({ ...draft, testId: event.target.value })}
              >
                {EVIDENCE_TESTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Result</p>
            <input
              value={draft.resultValue}
              onChange={(event) => setDraft({ ...draft, resultValue: event.target.value })}
              placeholder="18:12"
              className="mt-1 w-full bg-transparent text-5xl font-black tracking-tight text-white outline-none placeholder:text-zinc-700"
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Date" value={draft.date} onChange={(date) => setDraft({ ...draft, date })} placeholder="2026-11-05" />
              <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Source
                <select
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-black px-3 py-3 text-sm font-semibold text-white"
                  value={draft.source}
                  onChange={(event) => setDraft({ ...draft, source: event.target.value as EvidenceSource })}
                >
                  {SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {SOURCE_LABEL[source]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="button" onClick={addResult} className="mt-5 w-full rounded-full bg-[#f4d23c] py-3 text-sm font-black text-black">
              Add result
            </button>
            <ul className="mt-5 space-y-2">
              {results.map((row) => (
                <li key={row.id} className="flex items-center justify-between rounded-xl border border-zinc-800 px-3 py-3">
                  <div>
                    <p className="text-sm font-black">{getTest(row.testId)?.name}</p>
                    <p className="text-xs text-zinc-500">
                      {row.resultValue} · {formatDisplayDate(row.date)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-[11px] font-bold uppercase tracking-wide text-[#f4d23c]"
                    onClick={() => setDraft({ ...draft, testId: row.testId, correctsResultId: row.id, resultValue: "" })}
                  >
                    Correct
                  </button>
                </li>
              ))}
            </ul>
            {draft.correctsResultId ? (
              <p className="mt-3 text-xs text-zinc-400">Correction will be added beside the old result. History is kept.</p>
            ) : null}
          </Screen>
        ) : null}

        {step === "decisions" ? (
          <Screen title="What we can use" body="Source and recency decide the anchor. A newer watch estimate does not automatically win.">
            {state.evidence.classified.length === 0 ? <p className="text-sm text-zinc-400">No results yet.</p> : null}
            <div className="space-y-3">
              {state.evidence.classified.map((row) => (
                <article key={row.id} className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{getTest(row.testId)?.name}</p>
                  <p className="mt-2 text-4xl font-black tracking-tight">{row.resultValue}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">{formatDisplayDate(row.date)}</p>
                  <p className={`mt-3 text-sm font-bold ${row.disposition === "CURRENT_ANCHOR" ? "text-[#f4d23c]" : "text-zinc-300"}`}>
                    {row.disposition === "CURRENT_ANCHOR" ? "✓ " : ""}
                    {DISPOSITION[row.disposition]}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">{row.reasons[0]}</p>
                </article>
              ))}
            </div>
          </Screen>
        ) : null}

        {step === "summary" ? (
          <Screen title="Assessment summary" body={state.week.headline}>
            <Bucket title="We have" items={state.week.alreadyHave} />
            <Bucket title="We still need" items={state.week.stillNeed} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat value={String(state.week.testCount)} label="Tests" />
              <Stat value={String(state.week.trainingDayCount)} label="Training days" />
            </div>
          </Screen>
        ) : null}

        {step === "week" ? (
          <Screen title="Your assessment week" body={state.week.headline}>
            <div className="space-y-2">
              {state.week.sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => session.testId && setOpenTest(session.testId)}
                  className="block w-full rounded-2xl border border-zinc-800 bg-black px-4 py-4 text-left"
                >
                  <div className="flex items-baseline justify-between">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#f4d23c]">{session.day}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                      {session.kind === "covered" ? "Not required" : session.kind}
                    </p>
                  </div>
                  <p className="mt-2 text-lg font-black">{session.title}</p>
                  {session.resultLabel ? <p className="mt-1 text-2xl font-black text-white">{session.resultLabel}</p> : null}
                  <p className="mt-1 text-sm text-zinc-400">{session.summary}</p>
                  {session.kind === "covered" ? <p className="mt-2 text-sm font-bold text-[#f4d23c]">✓ Already covered</p> : null}
                </button>
              ))}
            </div>
            {state.week.overflow.length > 0 ? (
              <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                Next, not stacked onto this week: {state.week.overflow.join(", ")}.
              </p>
            ) : null}
            {test ? (
              <article className="mt-4 rounded-2xl border border-[#f4d23c]/40 bg-black p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f4d23c]">{test.name}</p>
                <p className="mt-2 text-sm text-zinc-300">{test.why}</p>
                <Proto title="Setup" lines={test.setup} />
                <Proto title="Warm-up" lines={test.warmup} />
                <Proto title="Protocol" lines={protocolForAthlete(test.id, intake.equipment)} />
                <Proto title="Pacing" lines={test.pacing} />
                <Proto title="Safety" lines={test.safety} />
                {test.id !== "easy_aerobic" ? (
                  <button
                    type="button"
                    className="mt-4 w-full rounded-full border border-[#f4d23c] py-2 text-sm font-black text-[#f4d23c]"
                    onClick={() => {
                      setDraft({ ...draft, testId: test.id, resultValue: "" });
                      setStepIndex(STEPS.indexOf("evidence"));
                    }}
                  >
                    Enter this result
                  </button>
                ) : null}
              </article>
            ) : null}
          </Screen>
        ) : null}

        {step === "profile" ? (
          <Screen title="Athlete performance profile" body="Only what the evidence supports.">
            <div className="space-y-3">
              {state.profile.sections.map((section) => (
                <article key={section.id} className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-black uppercase tracking-[0.14em]">{section.title}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{section.knowledge.replaceAll("_", " ")}</p>
                  </div>
                  {section.known.slice(0, 3).map((line) => (
                    <p key={line} className="mt-2 text-sm text-zinc-200">
                      {line}
                    </p>
                  ))}
                  {section.missing.slice(0, 2).map((line) => (
                    <p key={line} className="mt-1 text-xs text-zinc-500">
                      Missing · {line}
                    </p>
                  ))}
                  {section.anchorSource ? <p className="mt-2 text-xs leading-relaxed text-zinc-500">{section.anchorSource}</p> : null}
                </article>
              ))}
            </div>
          </Screen>
        ) : null}

        {step === "ready" ? (
          <Screen title="Programming-ready" body="The existing programme generator receives this. Nothing is published.">
            <p className="text-4xl font-black tracking-tight text-[#f4d23c]">{state.profile.programmingReadiness.replaceAll("_", " ")}</p>
            <ul className="mt-4 space-y-2">
              {state.profile.readinessReasons.slice(0, 4).map((reason) => (
                <li key={reason} className="text-sm leading-relaxed text-zinc-400">
                  {reason}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-2xl border border-zinc-800 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Handoff</p>
              <p className="mt-2 text-sm text-zinc-200">Engine · {state.handoff.engine}</p>
              <p className="text-sm text-zinc-200">5K passed · {state.handoff.fiveKTime ?? "none"}</p>
              <p className="text-sm text-zinc-200">Days · {state.handoff.daysPerWeek}</p>
              <p className="text-sm text-zinc-200">
                Generate · {state.handoff.readyToGenerate ? "Ready, read-only" : "Blocked"}
              </p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#f4d23c]">Publishing off · athlete choice stays on</p>
            </div>
          </Screen>
        ) : null}

        {step === "progress" ? (
          <Screen title="Performance" body="Anchors, history and workload. Empty cards stay hidden.">
            {state.dashboard.targets.length === 0 ? <p className="text-sm text-zinc-500">No training targets yet.</p> : null}
            <div className="space-y-3">
              {state.dashboard.targets.map((target) => (
                <article key={target.label} className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{target.label}</p>
                  <p className="mt-2 text-3xl font-black tracking-tight">{target.display}</p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">Based on: {target.provenance}</p>
                </article>
              ))}
            </div>
            {state.dashboard.series
              .filter((series) => series.points.length >= 2)
              .map((series) => (
                <p key={series.id} className="mt-4 text-sm font-bold text-white">
                  {series.label} {series.points.map((point) => point.value).join(" → ")}
                </p>
              ))}
            {state.dashboard.workload.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {state.dashboard.workload.map((card) => (
                  <div key={card.key} className="rounded-xl border border-zinc-800 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{card.label}</p>
                    <p className="mt-1 text-lg font-black">
                      {card.completed ?? "—"}
                      <span className="text-xs font-semibold text-zinc-500"> / {card.planned ?? "—"} {card.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            {state.dashboard.limiters.map((line) => (
              <p key={line} className="mt-3 text-sm text-zinc-400">
                {line}
              </p>
            ))}
          </Screen>
        ) : null}

        {step === "home" ? (
          <Screen title="Week preview" body="Today first. The rest of the week stays attached.">
            <div className="grid grid-cols-7 gap-1">
              {state.home.days.map((day) => (
                <div key={day.day} className={`rounded-lg py-2 text-center ${day.isToday ? "bg-[#f4d23c] text-black" : "bg-zinc-900 text-zinc-400"}`}>
                  <p className="text-[10px] font-black">{day.day.slice(0, 1)}</p>
                  <p className="text-[10px] font-semibold">{day.date.slice(8)}</p>
                </div>
              ))}
            </div>
            <article className="mt-4 rounded-2xl border border-zinc-800 bg-black p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f4d23c]">Today</p>
              <p className="mt-2 text-2xl font-black">{state.home.todayTitle}</p>
              <p className="mt-1 text-sm text-zinc-400">{state.home.todayDetail}</p>
            </article>
            <p className="mt-4 text-sm text-zinc-300">{state.home.readinessPrompt}</p>
            {state.home.raceCountdown ? <p className="mt-2 text-sm font-bold text-white">{state.home.raceCountdown}</p> : null}
            {state.home.weekNote ? <p className="mt-2 text-sm text-zinc-500">{state.home.weekNote}</p> : null}
            {state.home.progressSignal ? <p className="mt-3 text-xs leading-relaxed text-zinc-500">{state.home.progressSignal}</p> : null}
          </Screen>
        ) : null}
      </div>

      <footer className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-zinc-800 bg-zinc-950 px-4 py-3">
        {continueError ? <p className="mb-2 text-sm text-red-300">{continueError}</p> : null}
        <div className="flex gap-2">
          <button type="button" onClick={() => { setContinueError(null); go(stepIndex - 1); }} className="flex-1 rounded-full border border-zinc-700 py-3 text-sm font-bold text-zinc-300">
            Back
          </button>
          <button type="button" disabled={saving} onClick={() => void forward()} className="flex-[2] rounded-full bg-[#f4d23c] py-3 text-sm font-black text-black disabled:opacity-60">
            {step === "welcome" ? "Get started" : journey && step === "summary" ? "Enter Track" : "Continue"}
          </button>
        </div>
      </footer>
    </main>
  );
}

function Screen({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-3xl font-black tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Choice({
  value,
  options,
  onChange,
}: {
  value: string | null;
  options: Array<[string, string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map(([id, title, body]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`block w-full rounded-2xl border px-4 py-4 text-left ${
            value === id ? "border-[#f4d23c] bg-[#f4d23c]/10" : "border-zinc-800 bg-black"
          }`}
        >
          <p className="text-base font-black">{title}</p>
          <p className="mt-1 text-sm text-zinc-400">{body}</p>
        </button>
      ))}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-sm font-bold ${active ? "border-[#f4d23c] text-[#f4d23c]" : "border-zinc-800 text-zinc-400"}`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-zinc-800 bg-black px-3 py-3 text-sm font-semibold normal-case tracking-normal text-white outline-none"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
      {label}
      <input
        inputMode="numeric"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        className="mt-1 w-full rounded-xl border border-zinc-800 bg-black px-3 py-3 text-lg font-black text-white outline-none"
      />
    </label>
  );
}

function Bucket({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{title}</p>
      {items.length === 0 ? <p className="mt-2 text-sm text-zinc-600">Nothing yet</p> : null}
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-sm font-semibold text-white">
            {title === "We have" ? "✓ " : ""}
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 p-4">
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
    </div>
  );
}

function Proto({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="mt-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{title}</p>
      {lines.map((line) => (
        <p key={line} className="mt-1 text-sm text-zinc-300">
          {line}
        </p>
      ))}
    </div>
  );
}
