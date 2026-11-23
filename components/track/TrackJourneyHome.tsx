"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { evaluateTrackFoundation } from "@/app/lib/track-foundation/pipeline";
import { SOURCE_LABEL } from "@/app/lib/track-foundation/policies";
import { getTest, protocolForAthlete } from "@/app/lib/track-foundation/testLibrary";
import type { BenchmarkResultInput, EvidenceSource, TrackIntake } from "@/app/lib/track-foundation/types";
import { performanceSetup, type JourneyMorning } from "@/app/lib/track-production/journeyProduct";
import { saveJourneyMorningAction, saveJourneyResultAction } from "@/app/track/actions";

const SOURCES = Object.keys(SOURCE_LABEL) as EvidenceSource[];

export default function TrackJourneyHome({
  intake,
  results,
  asOf,
  morning,
}: {
  intake: TrackIntake;
  results: BenchmarkResultInput[];
  asOf: string;
  morning: JourneyMorning | null;
}) {
  const router = useRouter();
  const [screen, setScreen] = useState<"home" | "week" | "progress" | "performance" | "assessment" | "readiness">("home");
  const [testId, setTestId] = useState<string | null>(null);
  const [added, setAdded] = useState<BenchmarkResultInput[]>([]);
  const [savedMorning, setSavedMorning] = useState<JourneyMorning | null>(morning);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [readyNote, setReadyNote] = useState(false);

  const state = useMemo(
    () => evaluateTrackFoundation({ intake, results: [...results, ...added], asOf, workload: [] }),
    [added, asOf, intake, results]
  );
  const setup = performanceSetup(state.requirements);
  const review = intake.pain.severity === "meaningful_unresolved";
  const programmingReady = state.profile.programmingReadiness === "READY" && !review;
  const openAssessments = setup.total - setup.complete;

  function openTest(id: string) {
    setError(null);
    setTestId(id);
    setScreen("assessment");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[390px] bg-black pb-28 text-white">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-black/95 px-4 py-3 backdrop-blur">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f4d23c]">Hybrid365 Track</p>
          <p className="text-xs text-zinc-400">{state.home.raceCountdown}</p>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {state.home.days.map((day) => (
            <div key={day.date} className={`rounded-md px-1 py-1 text-center ${day.isToday ? "bg-[#f4d23c] text-black" : "bg-zinc-900 text-zinc-400"}`}>
              <p className="text-[10px] font-black">{day.day.slice(0, 1)}</p>
              <p className="text-[10px] font-semibold">{day.date.slice(8)}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="px-4 pt-4">
        {screen === "home" ? (
          <div className="space-y-4">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f4d23c]">Today</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight">{state.home.todayTitle}</h1>
              <p className="mt-1 text-sm text-zinc-400">{state.home.todayDetail}</p>
            </section>

            {review ? (
              <section className="rounded-2xl border border-[#f4d23c] bg-zinc-950 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f4d23c]">Pain review</p>
                <h2 className="mt-2 text-xl font-black">Track is open</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                  Unresolved pain needs a person to review it before maximal testing. Easy aerobic work can continue. A personalised programme waits.
                </p>
              </section>
            ) : null}

            {!review && !programmingReady && setup.total > 0 ? (
              <section className="rounded-2xl border border-[#f4d23c] bg-zinc-950 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f4d23c]">Complete your performance setup</p>
                <h2 className="mt-2 text-xl font-black">
                  {setup.complete} of {setup.total} complete
                </h2>
                <ul className="mt-3 space-y-1">
                  {setup.items.map((item) => (
                    <li key={item.id} className="text-sm font-semibold">
                      {item.complete ? "✓" : "○"} {item.label}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                  Complete these to finish your performance profile and unlock your personalised training programme.
                </p>
                {setup.nextTestId ? (
                  <button type="button" onClick={() => openTest(setup.nextTestId!)} className="mt-4 w-full rounded-full bg-[#f4d23c] py-3 text-sm font-black text-black">
                    Complete assessment
                  </button>
                ) : null}
              </section>
            ) : null}

            {programmingReady ? (
              <section className="rounded-2xl border border-[#f4d23c] bg-zinc-950 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f4d23c]">Performance profile</p>
                <h2 className="mt-2 text-xl font-black">Your performance profile is ready</h2>
                <button type="button" onClick={() => setReadyNote(true)} className="mt-4 w-full rounded-full bg-[#f4d23c] py-3 text-sm font-black text-black">
                  Build my programme
                </button>
                {readyNote ? <p className="mt-3 text-sm text-zinc-300">Nothing is published from this screen.</p> : null}
              </section>
            ) : (
              <section className="rounded-2xl border border-zinc-800 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Your personalised programme</p>
                <h2 className="mt-2 text-lg font-black">
                  {review ? "Held for review" : `${openAssessments} assessment${openAssessments === 1 ? "" : "s"} remaining`}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {review
                    ? "A personalised block is not built while pain review is open."
                    : "Complete your setup and we'll build your training block."}
                </p>
              </section>
            )}

            {state.home.progressSignal ? (
              <section className="rounded-2xl border border-zinc-800 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Already on file</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{state.home.progressSignal}</p>
                <p className="mt-2 text-xs text-zinc-500">The rest of the profile is still open.</p>
              </section>
            ) : null}

            <section className="rounded-2xl border border-zinc-800 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Morning check-in</p>
              {savedMorning ? (
                <p className="mt-2 text-sm text-zinc-200">
                  Saved · sleep {savedMorning.sleep}, energy {savedMorning.energy}, recovery {savedMorning.recovery}, soreness {savedMorning.soreness}, readiness {savedMorning.readiness}
                  {savedMorning.pain ? ", pain reported" : ""}
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm text-zinc-300">Not completed.</p>
                  <button type="button" onClick={() => setScreen("readiness")} className="mt-3 text-sm font-bold text-[#f4d23c]">
                    Complete morning check-in
                  </button>
                </>
              )}
            </section>
          </div>
        ) : null}

        {screen === "week" ? (
          <div className="space-y-3">
            <h1 className="text-2xl font-black">This week</h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              {programmingReady
                ? "Assessment work for this week."
                : "Setup week. These sessions are not your personalised programme."}
            </p>
            {state.week.sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => session.testId && session.kind === "test" && openTest(session.testId)}
                className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-left"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#f4d23c]">{session.day}</p>
                <p className="mt-2 text-lg font-black">{session.title}</p>
                {session.resultLabel ? <p className="mt-1 text-sm font-bold">{session.resultLabel}</p> : null}
                <p className="mt-1 text-sm text-zinc-400">{session.summary}</p>
              </button>
            ))}
          </div>
        ) : null}

        {screen === "progress" ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-black">Progress</h1>
            <p className="text-sm text-zinc-400">Results you have entered. Missing targets stay unset.</p>
            {results.concat(added).map((row) => (
              <article key={row.id} className="rounded-2xl border border-zinc-800 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{getTest(row.testId)?.name ?? row.testId}</p>
                <p className="mt-2 text-3xl font-black">{row.resultValue}</p>
                <p className="mt-1 text-xs text-zinc-500">{row.date}</p>
              </article>
            ))}
            {state.dashboard.targets.map((target) => (
              <article key={target.label} className="rounded-2xl border border-zinc-800 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{target.label}</p>
                <p className="mt-2 text-2xl font-black">{target.display}</p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">{target.provenance}</p>
              </article>
            ))}
            {setup.items
              .filter((item) => !item.complete)
              .map((item) => (
                <article key={item.id} className="rounded-2xl border border-zinc-800 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{item.label}</p>
                  <p className="mt-2 text-lg font-black">Not yet set</p>
                </article>
              ))}
          </div>
        ) : null}

        {screen === "performance" ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-black">Performance</h1>
            <p className="text-sm font-bold text-[#f4d23c]">
              Performance setup {setup.complete} of {setup.total} complete
            </p>
            {!programmingReady ? <p className="text-sm text-zinc-400">This profile is not complete.</p> : null}
            {state.profile.sections.map((section) => (
              <article key={section.id} className="rounded-2xl border border-zinc-800 p-4">
                <h2 className="text-sm font-black uppercase tracking-[0.14em]">{section.title}</h2>
                {section.known.map((line) => (
                  <p key={line} className="mt-2 text-sm text-zinc-200">
                    {line}
                  </p>
                ))}
                {section.known.length === 0 ? <p className="mt-2 text-sm font-bold">Not yet set</p> : null}
                {section.anchorSource ? <p className="mt-2 text-xs leading-relaxed text-zinc-500">{section.anchorSource}</p> : null}
              </article>
            ))}
            {!review && setup.nextTestId ? (
              <button type="button" onClick={() => openTest(setup.nextTestId!)} className="w-full rounded-full bg-[#f4d23c] py-3 text-sm font-black text-black">
                Complete assessment
              </button>
            ) : null}
          </div>
        ) : null}

        {screen === "assessment" && testId ? (
          <Assessment
            testId={testId}
            equipment={intake.equipment}
            asOf={asOf}
            saving={saving}
            error={error}
            onBack={() => setScreen("home")}
            onSave={async (input) => {
              setSaving(true);
              setError(null);
              try {
                await saveJourneyResultAction(input);
                const test = getTest(input.testId);
                setAdded((current) => [
                  ...current,
                  {
                    id: `entered-${current.length + 1}-${input.testId}`,
                    testId: input.testId,
                    resultValue: input.resultValue,
                    unit: test?.resultUnit ?? "",
                    date: input.date,
                    source: input.source,
                    notes: input.notes,
                    correctsResultId: null,
                  },
                ]);
                router.refresh();
                setScreen("home");
              } catch (caught) {
                console.error("[track journey] assessment save failed", {
                  step: "dashboard",
                  requested: input.testId,
                  resolved: input.testId,
                  persisted: "dashboard",
                  reason: caught instanceof Error ? caught.message : "unknown",
                });
                setError("We couldn't save that result. Nothing new was stored. Try again.");
              } finally {
                setSaving(false);
              }
            }}
          />
        ) : null}

        {screen === "readiness" ? (
          <ReadinessForm
            saving={saving}
            error={error}
            onCancel={() => setScreen("home")}
            onSave={async (value) => {
              setSaving(true);
              setError(null);
              try {
                await saveJourneyMorningAction(asOf, value);
                setSavedMorning(value);
                router.refresh();
                setScreen("home");
              } catch (caught) {
                console.error("[track journey] readiness save failed", {
                  step: "dashboard",
                  requested: "morning",
                  resolved: "morning",
                  persisted: savedMorning ? "saved" : "empty",
                  reason: caught instanceof Error ? caught.message : "unknown",
                });
                setError("We couldn't save the check-in. Nothing new was stored. Try again.");
              } finally {
                setSaving(false);
              }
            }}
          />
        ) : null}

        {error && screen !== "assessment" && screen !== "readiness" ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      </div>

      {screen !== "assessment" && screen !== "readiness" ? (
        <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[390px] -translate-x-1/2 justify-between border-t border-zinc-800 bg-black px-4 py-3 text-xs font-bold">
          {(
            [
              ["home", "Home"],
              ["week", "Week"],
              ["progress", "Progress"],
              ["performance", "Performance"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setScreen(id)} className={screen === id ? "text-[#f4d23c]" : "text-zinc-400"}>
              {label}
            </button>
          ))}
        </nav>
      ) : null}
    </main>
  );
}

function Assessment({
  testId,
  equipment,
  asOf,
  saving,
  error,
  onBack,
  onSave,
}: {
  testId: string;
  equipment: TrackIntake["equipment"];
  asOf: string;
  saving: boolean;
  error: string | null;
  onBack: () => void;
  onSave: (input: { testId: string; resultValue: string; date: string; source: EvidenceSource; notes: string | null }) => Promise<void>;
}) {
  const test = getTest(testId);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(asOf);
  const [source, setSource] = useState<EvidenceSource>("training_test");
  const [notes, setNotes] = useState("");
  if (!test) return <p className="text-sm text-zinc-400">That assessment is not available.</p>;
  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm font-bold text-zinc-400">
        Back
      </button>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f4d23c]">Assessment</p>
      <h1 className="text-2xl font-black">{test.name}</h1>
      <p className="text-sm leading-relaxed text-zinc-300">{test.why}</p>
      <Block title="Setup" lines={test.setup} />
      <Block title="Warm-up" lines={test.warmup} />
      <Block title="Protocol" lines={protocolForAthlete(test.id, equipment)} />
      <Block title="Pacing" lines={test.pacing} />
      <Block title="Stop and safety" lines={test.safety} />
      <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
        Result ({test.resultUnit})
        <input value={value} onChange={(event) => setValue(event.target.value)} className="mt-1 w-full rounded-xl border border-zinc-800 bg-black px-3 py-3 text-lg font-black text-white outline-none" />
      </label>
      <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
        Date
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border border-zinc-800 bg-black px-3 py-3 text-white outline-none" />
      </label>
      <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
        Source
        <select value={source} onChange={(event) => setSource(event.target.value as EvidenceSource)} className="mt-1 w-full rounded-xl border border-zinc-800 bg-black px-3 py-3 text-white outline-none">
          {SOURCES.map((item) => (
            <option key={item} value={item}>
              {SOURCE_LABEL[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
        Notes
        <input value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 w-full rounded-xl border border-zinc-800 bg-black px-3 py-3 text-white outline-none" />
      </label>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        type="button"
        disabled={saving || !value.trim()}
        onClick={() => void onSave({ testId: test.id, resultValue: value.trim(), date, source, notes: notes.trim() || null })}
        className="w-full rounded-full bg-[#f4d23c] py-3 text-sm font-black text-black disabled:opacity-50"
      >
        Save result
      </button>
    </div>
  );
}

function ReadinessForm({
  saving,
  error,
  onCancel,
  onSave,
}: {
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (value: JourneyMorning) => Promise<void>;
}) {
  const [value, setValue] = useState<JourneyMorning>({ sleep: 7, energy: 7, recovery: 7, soreness: 3, readiness: 7, pain: false });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Morning check-in</h1>
      <p className="text-sm text-zinc-400">These scores are not saved until you submit. Saving readiness leaves the programme unchanged.</p>
      {(["sleep", "energy", "recovery", "soreness", "readiness"] as const).map((key) => (
        <label key={key} className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          {key} · {value[key]}
          <input
            type="range"
            min={1}
            max={10}
            value={value[key]}
            onChange={(event) => setValue((current) => ({ ...current, [key]: Number(event.target.value) }))}
            className="mt-2 w-full"
          />
        </label>
      ))}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value.pain} onChange={(event) => setValue((current) => ({ ...current, pain: event.target.checked }))} />
        Pain today
      </label>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button type="button" disabled={saving} onClick={() => void onSave(value)} className="w-full rounded-full bg-[#f4d23c] py-3 text-sm font-black text-black">
        Save morning check-in
      </button>
      <button type="button" onClick={onCancel} className="w-full rounded-full border border-zinc-700 py-3 text-sm font-bold text-zinc-300">
        Cancel
      </button>
    </div>
  );
}

function Block({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{title}</p>
      <ul className="mt-1 space-y-1">
        {lines.map((line) => (
          <li key={line} className="text-sm leading-relaxed text-zinc-300">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
