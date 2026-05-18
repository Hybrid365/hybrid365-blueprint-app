"use client";

import { useState } from "react";
import {
  HyroxCard,
  HyroxEyebrow,
  HyroxH1,
  HyroxLead,
  HyroxPageShell,
  HyroxPrimaryButton,
  HyroxSection,
} from "@/components/hyrox-team/HyroxTeamUi";

type TestStatus = "not_submitted" | "submitted";

type BaselineTest = {
  id: string;
  name: string;
  purpose: string;
  instructions: string[];
  record: string[];
  optional?: boolean;
  status: TestStatus;
};

const MOCK_TESTS: BaselineTest[] = [
  {
    id: "5k",
    name: "5km run time trial",
    purpose: "Aerobic engine reference for pacing and progress.",
    instructions: [
      "Flat route or treadmill at 1% incline if indoors.",
      "Even effort — treat as a controlled hard time trial.",
      "Full warm-up before starting.",
    ],
    record: ["Total time (mm:ss)"],
    status: "submitted",
  },
  {
    id: "ski",
    name: "1km SkiErg",
    purpose: "Upper-body engine marker for race stations.",
    instructions: ["Damper setting noted for retests.", "Steady stroke rate — no sprint start."],
    record: ["Time to complete 1km"],
    status: "not_submitted",
  },
  {
    id: "row",
    name: "1km RowErg",
    purpose: "Mixed engine capacity and repeatability.",
    instructions: ["Same damper as future retests.", "Record stroke rate if helpful."],
    record: ["Time to complete 1km"],
    status: "not_submitted",
  },
  {
    id: "wall",
    name: "Wall balls",
    purpose: "Station endurance and movement efficiency.",
    instructions: ["Standard 9kg / 6kg ball as per category.", "Full depth and target each rep."],
    record: ["Max unbroken reps OR 100-rep time"],
    status: "not_submitted",
  },
  {
    id: "bbj",
    name: "Burpee broad jumps",
    purpose: "Hybrid capacity under fatigue.",
    instructions: ["Consistent jump distance.", "Same setup for future retests."],
    record: ["Max distance in 2 min OR 80m time"],
    status: "not_submitted",
  },
  {
    id: "farmer",
    name: "Farmer's carry",
    purpose: "Grip and trunk stability for race carries.",
    instructions: ["40m course marked.", "Race weight or best sustainable load noted."],
    record: ["40m time @ load (kg)"],
    status: "not_submitted",
  },
  {
    id: "lunge",
    name: "Sandbag lunges",
    purpose: "Leg endurance for the lunge station.",
    instructions: ["100m marked course.", "Sandbag on back — load recorded."],
    record: ["100m time @ load (kg)"],
    status: "not_submitted",
  },
  {
    id: "sled",
    name: "Sled push / pull",
    purpose: "Race-pace sled work capacity.",
    instructions: ["50m push + 50m pull on same surface.", "Record surface (turf / track)."],
    record: ["Total time for push + pull", "Load (kg)"],
    status: "not_submitted",
  },
  {
    id: "compromised",
    name: "Mini Hyrox Compromised Run Test",
    purpose:
      "Assess how well you can run again after lower-body fatigue and Hyrox-style station work.",
    instructions: [
      "Session: 1km run → 40m sandbag walking lunges → 40m burpee broad jumps → 1km run.",
      "If on treadmill, use 1% incline for both runs.",
      "Keep setup consistent for future retesting.",
      "Note how much final 1km pace drops vs first km.",
    ],
    record: [
      "Total time",
      "First 1km split",
      "Final 1km split",
      "Lunge load (kg)",
      "RPE (1–10)",
      "Notes on pace drop",
    ],
    optional: true,
    status: "not_submitted",
  },
];

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

export default function TestingPageClient() {
  const [tests, setTests] = useState(MOCK_TESTS);

  function mockSubmit(id: string) {
    setTests((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "submitted" as const } : t))
    );
  }

  const submitted = tests.filter((t) => t.status === "submitted").length;

  return (
    <HyroxPageShell>
      <HyroxSection>
        <HyroxEyebrow>Hyrox Team / Baseline</HyroxEyebrow>
        <HyroxH1 accent="testing">Baseline</HyroxH1>
        <HyroxLead>
          Log your baseline markers before training ramps. Follow instructions carefully — consistent setup makes
          retesting meaningful.
        </HyroxLead>
        <p className="mt-4 text-sm text-zinc-500">
          {submitted} of {tests.length} tests submitted (mock)
        </p>
      </HyroxSection>

      <div className="grid gap-4 lg:grid-cols-2">
        {tests.map((test) => (
          <HyroxCard key={test.id} className="flex flex-col">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <h3 className="m-0 text-base font-bold text-white">
                {test.name}
                {test.optional ? (
                  <span className="ml-2 text-xs font-normal text-zinc-500">(recommended)</span>
                ) : null}
              </h3>
              <StatusBadge status={test.status} />
            </div>
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[#f4d23c]/80">Purpose</p>
            <p className="m-0 mt-1 text-sm leading-relaxed text-zinc-400">{test.purpose}</p>
            <p className="m-0 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Instructions</p>
            <ul className="m-0 mt-1 list-inside list-disc space-y-1 text-sm text-zinc-400">
              {test.instructions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="m-0 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">What to record</p>
            <ul className="m-0 mt-1 space-y-0.5 text-sm text-zinc-300">
              {test.record.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
            <HyroxPrimaryButton
              className="mt-6 w-full text-sm"
              onClick={() => mockSubmit(test.id)}
            >
              {test.status === "submitted" ? "Update result" : "Submit result"}
            </HyroxPrimaryButton>
          </HyroxCard>
        ))}
      </div>
    </HyroxPageShell>
  );
}
