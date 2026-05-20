"use client";

import { useMemo, useState } from "react";
import {
  HyroxCard,
  HyroxEyebrow,
  HyroxH1,
  HyroxLead,
  HyroxPageShell,
  HyroxPrimaryButton,
  HyroxSection,
} from "@/components/hyrox-team/HyroxTeamUi";
import { BenchmarkSubmitModal, RoxFitRaceModal } from "./TestingModals";
import {
  formatBenchmarkSummary,
  formatRoxFitSummaryCard,
  type BenchmarkSubmission,
  type BenchmarkTestId,
  type HyroxRaceSplitSubmission,
} from "./hyroxTestingTypes";

type TestStatus = "not_submitted" | "submitted";
type TestSection = "core" | "optional";

type BaselineTest = {
  id: BenchmarkTestId;
  section: TestSection;
  name: string;
  purpose: string;
  instructions: string[];
  record: string[];
  equipment?: string[];
  protocol?: string[];
  safetyNote?: string;
  recommendedLoads?: string[];
  coachNote?: string;
  coachRequestedOnly?: boolean;
  status: TestStatus;
  submission?: BenchmarkSubmission;
  submittedAt?: string;
};

type BaselineTestDef = Omit<BaselineTest, "status" | "submission" | "submittedAt">;

const CORE_TESTS: BaselineTestDef[] = [
  {
    id: "5k",
    section: "core",
    name: "5km Run Time Trial",
    purpose:
      "Used to estimate run paces, threshold pace, 10km pace and Hyrox race-pace targets.",
    instructions: [
      "Flat route or treadmill at 1% incline if indoors.",
      "Even effort — controlled hard time trial.",
      "Full warm-up before starting.",
    ],
    record: ["Total time", "Average pace", "HR if known", "RPE", "Notes"],
  },
  {
    id: "ski",
    section: "core",
    name: "1km SkiErg Time Trial",
    purpose: "Used to set SkiErg targets and assess upper-body/aerobic output.",
    instructions: ["Damper setting noted for retests.", "Steady stroke rate — no sprint start."],
    record: ["Total time", "Average split", "Stroke rate if known", "HR if known", "RPE", "Notes"],
  },
  {
    id: "row2k",
    section: "core",
    name: "2km Row Time Trial",
    purpose:
      "Used to assess rowing aerobic power, pacing ability and set RowErg targets.",
    instructions: ["Same damper as future retests.", "Even pacing — note stroke rate if helpful."],
    record: ["Total time", "Average split", "Stroke rate if known", "HR if known", "RPE", "Notes"],
  },
  {
    id: "compromised",
    section: "core",
    name: "Mini Compromised Test",
    purpose: "Assess run drop-off after Hyrox-style lower-body fatigue.",
    instructions: [
      "1km run → 40m sandbag walking lunges → 40m burpee broad jumps → 1km run.",
      "If no sandbag: bodyweight lunges or DB/KB variation — note setup.",
      "Treadmill: 1% incline for both runs if indoors.",
      "Compare first vs final 1km split.",
    ],
    record: [
      "Total time",
      "First / final run splits",
      "Lunge load / variation",
      "Burpee/lunge notes",
      "RPE",
      "Notes",
    ],
  },
];

const OPTIONAL_TESTS: BaselineTestDef[] = [
  {
    id: "farmer_hold",
    section: "optional",
    name: "Farmer Hold / Grip Test",
    purpose: "Assess grip endurance for farmer's carries, sled pull and general Hyrox durability.",
    instructions: [],
    equipment: ["Two dumbbells or kettlebells", "Timer", "Clear space to stand tall"],
    protocol: [
      "Select two DBs or KBs — challenging but safe.",
      "Stand tall with weights at your sides.",
      "Start the timer when the weights leave the floor.",
      "Hold as long as possible without dropping, re-gripping, excessive lean, or posture loss.",
      "Stop when grip fails or posture breaks.",
    ],
    recommendedLoads: [
      "Beginner: moderate DB/KB pair",
      "Intermediate: close to Hyrox farmer's carry race weight",
      "Advanced: heavier than race weight where possible",
    ],
    record: ["DB/KB weight per hand", "Total hold time", "RPE 1–10", "Limiting factor", "Notes"],
    safetyNote: "Use loads you can hold with neutral spine. Stop if sharp pain — note in results.",
  },
  {
    id: "sandbag_lunge",
    section: "optional",
    name: "Sandbag Lunge Capacity Test",
    purpose: "Assess lunge durability, quad endurance and ability to keep moving under load.",
    instructions: [],
    equipment: ["Sandbag (or BW / DB alternative)", "4-minute timer", "Marked course or measured lane"],
    protocol: [
      "Set a 4-minute timer.",
      "Use a sandbag load appropriate to your Hyrox category or current ability.",
      "Complete as many quality metres of walking lunges as possible in 4 minutes (max metres in 4 minutes).",
      "Full range, controlled steps, stable posture.",
      "You may pause — the timer keeps running.",
      "Record total metres completed.",
      "Stop if knee/hip/back pain changes movement quality.",
    ],
    recommendedLoads: [
      "Beginner: bodyweight or light DB/sandbag",
      "Intermediate: moderate sandbag",
      "Advanced/Pro: race load where appropriate",
    ],
    record: ["Load used", "Total metres in 4 min", "Number of breaks", "RPE 1–10", "Limiting factor", "Notes"],
    safetyNote: "Prioritise depth and control over speed. Do not push through pain that alters form.",
  },
  {
    id: "wall_ball",
    section: "optional",
    name: "Wall Ball Capacity Check",
    purpose:
      "Assess wall ball capacity, breaking strategy, shoulder endurance, quad fatigue and breathing control.",
    instructions: [],
    equipment: ["Wall ball (race weight if appropriate)", "Wall/target at standard height", "Timer if doing 100 for time"],
    protocol: [
      "Option A — Max unbroken: race load if appropriate. As many unbroken reps as possible. Stop on missed depth/target, long pause, or technique break.",
      "Option B — 100 for time: race load if appropriate. 100 wall balls as fast as possible with good reps. Record total time and breaks.",
    ],
    coachNote:
      "If you are new to wall balls or have shoulder/knee issues, choose Option A or use a lighter load.",
    record: [
      "Format: max unbroken / 100 for time",
      "Ball weight",
      "Target height if known",
      "Reps completed",
      "Total time if applicable",
      "Number of breaks",
      "RPE 1–10",
      "Limiting factor",
      "Notes",
    ],
    safetyNote: "Full depth and target each rep. Scale load or choose Option A if shoulders/knees are sensitive.",
  },
  {
    id: "sled_exposure",
    section: "optional",
    name: "Optional Sled Exposure Check",
    purpose: "Assess sled confidence, technique and whether sled access/surface is available.",
    instructions: [],
    equipment: ["Sled + push or pull setup", "Consistent surface", "Timer", "Load plates as needed"],
    protocol: [
      "Use a consistent surface — note surface type.",
      "Complete 4 × 12.5m sled push or sled pull at a controlled hard effort.",
      "Rest 90–120 sec between reps.",
      "Record load, time per rep and RPE.",
      "Do not max out if you are not used to sled work.",
    ],
    record: ["Push or pull", "Load used", "Surface type", "Rep times", "RPE 1–10", "Limiting factor", "Notes"],
    safetyNote: "Controlled hard effort only — not a max test unless your coach specifies otherwise.",
    coachRequestedOnly: true,
  },
];

function initTests(defs: BaselineTestDef[]): BaselineTest[] {
  return defs.map((t) => ({
    ...t,
    status: "not_submitted",
    submission: undefined,
    submittedAt: undefined,
  }));
}

function StatusBadge({ status }: { status: TestStatus }) {
  if (status === "submitted") {
    return (
      <span className="rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
        Submitted
      </span>
    );
  }
  return (
    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
      Not submitted
    </span>
  );
}

function submissionRpe(s: BenchmarkSubmission): string | undefined {
  if ("rpe" in s && typeof s.rpe === "string") return s.rpe;
  return undefined;
}

function TestCard({
  test,
  onSubmit,
}: {
  test: BaselineTest;
  onSubmit: () => void;
}) {
  const isOptionalDetail = Boolean(test.protocol?.length);

  return (
    <HyroxCard className="flex flex-col">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <h3 className="m-0 text-base font-bold text-white">{test.name}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {test.coachRequestedOnly ? (
            <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
              Coach-requested
            </span>
          ) : null}
          <StatusBadge status={test.status} />
        </div>
      </div>
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[#f4d23c]/80">Purpose</p>
      <p className="m-0 mt-1 text-sm leading-relaxed text-zinc-400">{test.purpose}</p>

      {isOptionalDetail ? (
        <>
          {test.equipment?.length ? (
            <>
              <p className="m-0 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Equipment needed</p>
              <ul className="m-0 mt-1 list-inside list-disc space-y-1 text-sm text-zinc-400">
                {test.equipment.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="m-0 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Test protocol</p>
          <ol className="m-0 mt-1 list-inside list-decimal space-y-1.5 text-sm text-zinc-400">
            {test.protocol!.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          {test.recommendedLoads?.length ? (
            <>
              <p className="m-0 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Suggested loads</p>
              <ul className="m-0 mt-1 space-y-1 text-sm text-zinc-500">
                {test.recommendedLoads.map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            </>
          ) : null}
          {test.coachNote ? (
            <p className="m-0 mt-4 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs leading-relaxed text-zinc-400">
              <span className="font-semibold text-zinc-300">Coach note:</span> {test.coachNote}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="m-0 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Instructions</p>
          <ul className="m-0 mt-1 list-inside list-disc space-y-1 text-sm text-zinc-400">
            {test.instructions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      )}

      <p className="m-0 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">What to record</p>
      <ul className="m-0 mt-1 space-y-0.5 text-sm text-zinc-300">
        {test.record.map((r) => (
          <li key={r}>· {r}</li>
        ))}
      </ul>

      {test.safetyNote ? (
        <p className="m-0 mt-4 rounded-lg border border-zinc-800/90 bg-zinc-950 px-3 py-2 text-xs leading-relaxed text-zinc-500">
          <span className="font-semibold text-zinc-400">Safety:</span> {test.safetyNote}
        </p>
      ) : null}

      {test.status === "submitted" && test.submission ? (
        <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-100/90">
          <p className="m-0 font-bold uppercase tracking-wide text-emerald-400/90">Submitted summary</p>
          <p className="m-0 mt-1 text-zinc-300">{formatBenchmarkSummary(test.submission)}</p>
          {submissionRpe(test.submission) ? (
            <p className="m-0 mt-1 text-zinc-400">RPE {submissionRpe(test.submission)}</p>
          ) : null}
          {test.submittedAt ? (
            <p className="m-0 mt-1 text-[10px] text-zinc-600">
              {new Date(test.submittedAt).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      ) : null}

      <HyroxPrimaryButton className="mt-6 w-full text-sm" type="button" onClick={onSubmit}>
        {test.status === "submitted" ? "Update result" : "Submit result"}
      </HyroxPrimaryButton>
    </HyroxCard>
  );
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="m-0 text-lg font-black uppercase tracking-[-0.04em] text-white">{title}</h2>
      {description ? <p className="m-0 mt-2 max-w-3xl text-sm leading-relaxed text-zinc-500">{description}</p> : null}
    </div>
  );
}

export default function TestingPageClient() {
  const [coreTests, setCoreTests] = useState(() => initTests(CORE_TESTS));
  const [optionalTests, setOptionalTests] = useState(() => initTests(OPTIONAL_TESTS));
  const [raceSubmission, setRaceSubmission] = useState<HyroxRaceSplitSubmission | null>(null);
  const [benchmarkModalId, setBenchmarkModalId] = useState<BenchmarkTestId | null>(null);
  const [roxfitOpen, setRoxfitOpen] = useState(false);

  const allTests = useMemo(() => [...coreTests, ...optionalTests], [coreTests, optionalTests]);

  const benchmarkModalTest = useMemo(
    () => (benchmarkModalId ? allTests.find((t) => t.id === benchmarkModalId) : undefined),
    [benchmarkModalId, allTests]
  );

  const submittedCount = allTests.filter((t) => t.status === "submitted").length;

  function updateTest(id: BenchmarkTestId, patch: Partial<BaselineTest>) {
    const updater = (prev: BaselineTest[]) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t));
    if (CORE_TESTS.some((t) => t.id === id)) {
      setCoreTests(updater);
    } else {
      setOptionalTests(updater);
    }
  }

  function handleSaveBenchmark(id: BenchmarkTestId, data: BenchmarkSubmission) {
    updateTest(id, {
      status: "submitted",
      submission: data,
      submittedAt: new Date().toISOString(),
    });
    setBenchmarkModalId(null);
  }

  function handleSaveRoxFit(data: Omit<HyroxRaceSplitSubmission, "id" | "submittedAt">) {
    setRaceSubmission({
      ...data,
      id: raceSubmission?.id ?? `race-${Date.now()}`,
      submittedAt: new Date().toISOString(),
    });
    setRoxfitOpen(false);
  }

  return (
    <HyroxPageShell>
      <HyroxSection>
        <HyroxEyebrow>Hyrox Team / Baseline</HyroxEyebrow>
        <HyroxH1 accent="testing">Baseline</HyroxH1>
        <HyroxLead>
          Log your core markers and any recent race data before training ramps. You do not need every isolated station
          test — core erg/run trials plus RoxFit splits usually give us enough to personalise your block.
        </HyroxLead>
        <p className="mt-4 text-sm text-zinc-500">
          {submittedCount} of {allTests.length} tests logged (mock)
          {raceSubmission ? " · Recent HYROX race data on file" : ""}
        </p>
      </HyroxSection>

      <HyroxCard className="mb-8 border-[#f4d23c]/20 bg-zinc-950/80">
        <p className="m-0 text-xs font-black uppercase tracking-wide text-[#f4d23c]">How testing works</p>
        <p className="m-0 mt-3 text-sm leading-relaxed text-zinc-300">
          You do not need to complete every possible station test before starting. The core tests help us set training
          targets, while recent HYROX race splits and optional strength checks help us personalise your programme.
        </p>
        <p className="m-0 mt-3 text-sm leading-relaxed text-zinc-500">
          Your coach may request specific additional tests later if a weakness needs more detail.
        </p>
        <p className="m-0 mt-3 text-sm leading-relaxed text-zinc-500">
          Even with RoxFit data, we still recommend <span className="text-zinc-300">5km run, 1km SkiErg and 2km Row</span>{" "}
          where possible — they anchor run paces and erg targets.
        </p>
      </HyroxCard>

      <section className="mb-10">
        <SectionHeading
          title="Core tests"
          description="Recommended before your programme is built — sets run paces, Ski/Row targets and run drop-off."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {coreTests.map((test) => (
            <TestCard key={test.id} test={test} onSubmit={() => setBenchmarkModalId(test.id)} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionHeading title="Recent HYROX race result / RoxFit splits" />
        <HyroxCard className="border-zinc-800 bg-gradient-to-br from-zinc-950 to-zinc-900/80">
          <p className="m-0 text-xs font-black uppercase tracking-wide text-[#f4d23c]">Already raced HYROX recently?</p>
          <p className="m-0 mt-3 text-sm leading-relaxed text-zinc-400">
            If you have a recent HYROX Solo result, submit your RoxFit splits. This often gives us better insight into your
            real race profile than isolated station testing.
          </p>
          <HyroxPrimaryButton className="mt-5 text-sm" type="button" onClick={() => setRoxfitOpen(true)}>
            Submit recent HYROX result
          </HyroxPrimaryButton>
        </HyroxCard>

        {raceSubmission ? (
          <HyroxCard className="mt-4 border-emerald-500/20 bg-emerald-500/5">
            <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-emerald-400/90">Race data on file</p>
            <p className="m-0 mt-2 text-base font-bold text-white">{formatRoxFitSummaryCard(raceSubmission).headline}</p>
            <ul className="m-0 mt-2 space-y-1 text-sm text-zinc-400">
              {formatRoxFitSummaryCard(raceSubmission).lines.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
            <p className="m-0 mt-2 text-[10px] text-zinc-600">
              Submitted {new Date(raceSubmission.submittedAt).toLocaleDateString()} (mock local state)
            </p>
            <button
              type="button"
              onClick={() => setRoxfitOpen(true)}
              className="mt-4 text-xs font-semibold text-[#f4d23c] underline underline-offset-4 hover:text-[#e6c435]"
            >
              Edit race submission
            </button>
          </HyroxCard>
        ) : null}
      </section>

      <section className="mb-8">
        <SectionHeading
          title="Optional Strength & Durability Checks"
          description="These are not mandatory for everyone. Your coach may ask you to complete one or more of these if your assessment or race splits suggest a specific weakness. Complete only the tests that are relevant to you or that your coach has requested."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {optionalTests.map((test) => (
            <TestCard key={test.id} test={test} onSubmit={() => setBenchmarkModalId(test.id)} />
          ))}
        </div>
      </section>

      {benchmarkModalId && benchmarkModalTest ? (
        <BenchmarkSubmitModal
          testId={benchmarkModalTest.id}
          testName={benchmarkModalTest.name}
          existing={benchmarkModalTest.submission ?? null}
          onCancel={() => setBenchmarkModalId(null)}
          onSave={(data) => handleSaveBenchmark(benchmarkModalTest.id, data)}
        />
      ) : null}

      {roxfitOpen ? (
        <RoxFitRaceModal
          existing={raceSubmission}
          onCancel={() => setRoxfitOpen(false)}
          onSave={handleSaveRoxFit}
        />
      ) : null}
    </HyroxPageShell>
  );
}
