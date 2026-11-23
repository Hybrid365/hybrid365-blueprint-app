"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { evaluateTrackFoundation } from "@/app/lib/track-foundation/pipeline";
import { SOURCE_LABEL } from "@/app/lib/track-foundation/policies";
import { getTest, protocolForAthlete } from "@/app/lib/track-foundation/testLibrary";
import type { BenchmarkResultInput, EvidenceSource, TrackIntake } from "@/app/lib/track-foundation/types";
import { trackSessionCard, weekAccent } from "@/app/lib/track-presentation/sessionVisual";
import { VsSectionHeader } from "@/components/athlete-command-centre/visual-system/primitives/SectionHeader";
import { VsStat } from "@/components/athlete-command-centre/visual-system/primitives/Stat";
import { performanceSetup, type JourneyMorning } from "@/app/lib/track-production/journeyProduct";
import { saveJourneyMorningAction, saveJourneyResultAction } from "@/app/track/actions";
import { BenchmarkMicro } from "@/components/athlete-command-centre/visual-system/primitives/BenchmarkMicro";
import { PrimarySessionCard } from "@/components/athlete-command-centre/visual-system/sessions/PrimarySessionCard";
import { SecondarySessionRow } from "@/components/athlete-command-centre/visual-system/sessions/SecondarySessionRow";
import { WorkoutTimeline } from "@/components/athlete-command-centre/visual-system/workout/WorkoutTimeline";
import { SetupRing, TrackChrome } from "@/components/track/visual/TrackChrome";

const SOURCES = Object.keys(SOURCE_LABEL) as EvidenceSource[];
const PROFILE_IDS = new Set(["running", "aerobic", "erg", "strength", "hyrox", "stations", "work_capacity"]);

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
  const [selectedDay, setSelectedDay] = useState(asOf);
  const [timelineId, setTimelineId] = useState<string | null>(null);
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
  const navScreen = screen === "assessment" || screen === "readiness" ? "home" : screen;
  const days = state.home.days.map((day) => ({
    id: day.date,
    dow: day.day.slice(0, 3),
    dateNumber: Number(day.date.slice(8)),
    isToday: day.isToday,
    sessionStatuses: day.title ? ["upcoming" as const] : [],
  }));
  const selected = state.week.sessions.find((session) => session.date === selectedDay) ?? state.week.sessions.find((session) => session.date === asOf) ?? null;
  const selectedCard = selected
    ? trackSessionCard({
        id: selected.id,
        title: selected.title,
        summary: selected.summary,
        pace: selected.resultLabel,
        status: selected.kind === "covered" ? "completed" : "upcoming",
        kind: selected.kind,
      })
    : null;

  function openTest(id: string) {
    setError(null);
    setTestId(id);
    setScreen("assessment");
  }

  if (screen === "assessment" && testId) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[var(--h365-background)] px-4 py-4 text-[var(--h365-text)] lg:max-w-3xl">
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
      </main>
    );
  }

  if (screen === "readiness") {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[var(--h365-background)] px-4 py-4 text-[var(--h365-text)]">
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
      </main>
    );
  }

  return (
    <TrackChrome
      eyebrow={screen === "home" ? "Today" : screen === "week" ? "Week" : screen === "progress" ? "Progress" : "Performance"}
      countdown={state.home.raceCountdown}
      days={days}
      selectedDay={days.some((day) => day.id === selectedDay) ? selectedDay : asOf}
      onSelectDay={(id) => {
        setSelectedDay(id);
        setScreen("home");
      }}
      screen={navScreen}
      onScreen={setScreen}
    >
      <div className="space-y-4">
        {screen === "home" && selectedCard ? (
          <PrimarySessionCard session={selectedCard} onOpen={selected?.testId && selected.kind === "test" ? () => openTest(selected.testId!) : undefined} />
        ) : null}
        {screen === "home" && !selectedCard ? (
          <p className="font-display text-3xl font-bold uppercase">Rest</p>
        ) : null}

        {screen === "week" ? (
          <div className="space-y-2">
            <p className="text-sm text-[var(--h365-text-muted)]">
              {programmingReady ? "Assessment work for this week." : "Setup week. These sessions are not your personalised programme."}
            </p>
            {state.week.sessions.map((session) => {
              const card = trackSessionCard({
                id: session.id,
                title: session.title,
                summary: session.summary,
                pace: session.resultLabel,
                status: session.kind === "covered" ? "completed" : "upcoming",
                kind: session.kind,
              });
              return (
                <SecondarySessionRow
                  key={session.id}
                  session={card}
                  showTimeline
                  className={weekAccent(card.categoryLabel)}
                  onOpen={session.testId && session.kind === "test" ? () => openTest(session.testId!) : undefined}
                />
              );
            })}
          </div>
        ) : null}

        {screen === "progress" ? (
          <div className="space-y-4">
            <VsSectionHeader eyebrow="Results on file" title="Benchmarks" />
            <div className="grid grid-cols-2 gap-4">
              {results.concat(added).map((row) => (
                <div key={row.id}>
                  <VsStat label={getTest(row.testId)?.name ?? row.testId} value={row.resultValue} />
                  <p className="mt-1 text-[11px] text-[var(--h365-text-muted)]">{row.date}</p>
                </div>
              ))}
            </div>
            {setup.items.some((item) => !item.complete) ? (
              <p className="text-sm text-[var(--h365-text-muted)]">
                Not yet set · {setup.items.filter((item) => !item.complete).map((item) => item.label).join(" · ")}
              </p>
            ) : null}
          </div>
        ) : null}

        {screen === "performance" ? (
          <div className="space-y-5">
            <p className="label-caps text-[var(--h365-accent)]">
              Performance setup {setup.complete} of {setup.total}
            </p>
            {state.profile.sections
              .filter((section) => PROFILE_IDS.has(section.id))
              .map((section) => (
                <article key={section.id}>
                  <VsSectionHeader title={section.title} />
                  {section.known.length ? (
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      {section.known.slice(0, 4).map((line) => {
                        const split = line.indexOf(":");
                        const label = split > 0 ? line.slice(0, split) : section.title;
                        const value = split > 0 ? line.slice(split + 1).trim() : line;
                        return <VsStat key={line} label={label} value={value} />;
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm font-semibold text-[var(--h365-text-muted)]">Not yet set</p>
                  )}
                  {section.anchorSource ? <p className="mt-2 text-[11px] text-[var(--h365-text-muted)]">{section.anchorSource}</p> : null}
                </article>
              ))}
          </div>
        ) : null}

        {screen === "home" && selectedCard?.timeline ? (
          <WorkoutTimeline
            timeline={selectedCard.timeline}
            selectedId={timelineId ?? selectedCard.timeline.segments[0]?.id ?? ""}
            onSelect={setTimelineId}
          />
        ) : null}
      </div>

      <aside className="mt-4 space-y-3 lg:mt-0">
        {review ? (
          <section className="rounded-xl bg-[var(--h365-surface)] p-4">
            <p className="label-caps text-[var(--h365-accent)]">Pain review</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--h365-text-muted)]">
              Track is open. Maximal tests and a personalised programme wait for review. Easy aerobic work can continue.
            </p>
          </section>
        ) : null}
        {!review && !programmingReady && setup.total > 0 ? (
          <section className="rounded-xl bg-[var(--h365-surface-raised)] p-4">
            <div className="flex items-center gap-4">
              <SetupRing complete={setup.complete} total={setup.total} />
              <div>
                <p className="label-caps text-[var(--h365-accent)]">Complete your performance setup</p>
                <p className="font-display text-2xl font-bold uppercase leading-none">{setup.complete} of {setup.total}</p>
              </div>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {setup.items.map((item) => (
                <li key={item.id} className={`rounded-full px-2 py-1 text-[11px] font-bold ${item.complete ? "bg-[var(--h365-accent)] text-black" : "bg-[var(--h365-background)] text-[var(--h365-text-muted)]"}`}>
                  {item.complete ? "✓" : "○"} {item.label}
                </li>
              ))}
            </ul>
            {setup.nextTestId ? (
              <button type="button" onClick={() => openTest(setup.nextTestId!)} className="mt-4 h-12 w-full rounded-lg bg-[var(--h365-accent)] text-sm font-bold uppercase tracking-[0.14em] text-black">
                Complete assessment
              </button>
            ) : null}
          </section>
        ) : null}
        {programmingReady ? (
          <section className="rounded-xl bg-[var(--h365-surface-raised)] p-4">
            <p className="font-display text-3xl font-bold uppercase leading-none">Your performance profile is ready</p>
            <button type="button" onClick={() => setReadyNote(true)} className="mt-4 h-12 w-full rounded-lg bg-[var(--h365-accent)] text-sm font-bold text-black">
              Build my programme
            </button>
            {readyNote ? <p className="mt-3 text-sm text-[var(--h365-text-muted)]">Nothing is published from this screen.</p> : null}
          </section>
        ) : (
          <section className="rounded-xl bg-[var(--h365-surface)] px-4 py-3">
            <p className="label-caps text-[var(--h365-text-muted)]">Your personalised programme</p>
            <p className="mt-1 font-display text-2xl font-bold uppercase leading-none">
              {review ? "Held for review" : `${openAssessments} left`}
            </p>
            <p className="mt-1 text-sm text-[var(--h365-text-muted)]">
              {review ? "A personalised block is not built while pain review is open." : "Complete your setup and we'll build your training block."}
            </p>
          </section>
        )}
        {state.home.progressSignal ? <BenchmarkMicro label="Threshold" value="On file" detail={state.home.progressSignal} /> : null}
        <button type="button" onClick={() => setScreen("readiness")} className="flex w-full items-center justify-between rounded-xl bg-[var(--h365-surface)] px-4 py-3 text-left">
          <span>
            <span className="label-caps text-[var(--h365-text-muted)]">Morning readiness</span>
            <span className="mt-1 block text-sm font-semibold">{savedMorning ? `Sleep ${savedMorning.sleep} · energy ${savedMorning.energy} · readiness ${savedMorning.readiness}` : "Not checked in"}</span>
          </span>
          {!savedMorning ? <span className="text-xs font-bold text-[var(--h365-accent)]">Check in</span> : null}
        </button>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </aside>
    </TrackChrome>
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
  const card = test ? trackSessionCard({ id: test.id, title: test.name, summary: test.why, blocks: protocolForAthlete(test.id, equipment) }) : null;
  const [value, setValue] = useState("");
  const [date, setDate] = useState(asOf);
  const [source, setSource] = useState<EvidenceSource>("training_test");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState(card?.timeline?.segments[0]?.id ?? "");
  if (!test || !card) return <p className="text-sm text-[var(--h365-text-muted)]">That assessment is not available.</p>;
  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm font-bold text-[var(--h365-text-muted)]">
        Back
      </button>
      <PrimarySessionCard session={card} />
      {card.timeline ? <WorkoutTimeline timeline={card.timeline} selectedId={selected} onSelect={setSelected} /> : null}
      <Block title="Setup" lines={test.setup} />
      <Block title="Warm-up" lines={test.warmup} />
      <Block title="Protocol" lines={protocolForAthlete(test.id, equipment)} />
      <Block title="Pacing" lines={test.pacing} />
      <Block title="Stop and safety" lines={test.safety} />
      <label className="block label-caps text-[var(--h365-text-muted)]">
        Result ({test.resultUnit})
        <input value={value} onChange={(event) => setValue(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--h365-border)] bg-[var(--h365-surface)] px-3 py-3 text-lg font-bold outline-none" />
      </label>
      <label className="block label-caps text-[var(--h365-text-muted)]">
        Date
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--h365-border)] bg-[var(--h365-surface)] px-3 py-3 outline-none" />
      </label>
      <label className="block label-caps text-[var(--h365-text-muted)]">
        Source
        <select value={source} onChange={(event) => setSource(event.target.value as EvidenceSource)} className="mt-1 w-full rounded-lg border border-[var(--h365-border)] bg-[var(--h365-surface)] px-3 py-3 outline-none">
          {SOURCES.map((item) => (
            <option key={item} value={item}>
              {SOURCE_LABEL[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="block label-caps text-[var(--h365-text-muted)]">
        Notes
        <input value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--h365-border)] bg-[var(--h365-surface)] px-3 py-3 outline-none" />
      </label>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        type="button"
        disabled={saving || !value.trim()}
        onClick={() => void onSave({ testId: test.id, resultValue: value.trim(), date, source, notes: notes.trim() || null })}
        className="h-12 w-full rounded-lg bg-[var(--h365-accent)] text-sm font-bold text-black disabled:opacity-50"
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
      <h1 className="font-display text-4xl font-bold uppercase">Morning readiness</h1>
      <p className="text-sm text-[var(--h365-text-muted)]">These scores are not saved until you submit. Saving readiness leaves the programme unchanged.</p>
      {(["sleep", "energy", "recovery", "soreness", "readiness"] as const).map((key) => (
        <label key={key} className="block label-caps text-[var(--h365-text-muted)]">
          {key} · {value[key]}
          <input type="range" min={1} max={10} value={value[key]} onChange={(event) => setValue((current) => ({ ...current, [key]: Number(event.target.value) }))} className="mt-2 w-full" />
        </label>
      ))}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value.pain} onChange={(event) => setValue((current) => ({ ...current, pain: event.target.checked }))} />
        Pain today
      </label>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button type="button" disabled={saving} onClick={() => void onSave(value)} className="h-12 w-full rounded-lg bg-[var(--h365-accent)] text-sm font-bold text-black">
        Save morning check-in
      </button>
      <button type="button" onClick={onCancel} className="h-12 w-full rounded-lg border border-[var(--h365-border)] text-sm font-bold">
        Cancel
      </button>
    </div>
  );
}

function Block({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div>
      <p className="label-caps text-[var(--h365-text-muted)]">{title}</p>
      <ul className="mt-1 space-y-1">
        {lines.map((line) => (
          <li key={line} className="text-sm leading-relaxed text-[var(--h365-text)]/85">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
