"use client";

import { useState } from "react";
import { CONCEPT_FIXTURE } from "../fixture";
import { ConceptButton, ConceptShell } from "../chrome";
import { TargetActual } from "../viz";
import { CompletionConfirm } from "../../motion";
import { visualBody, visualEyebrow, visualMeta, visualTouch } from "../../tokens";
import { ConceptEmpty, ConceptLoading, type CoachedConceptState } from "./ConceptState";

/**
 * Completion — prescribed / actual / subjective as three distinct bands.
 * Demo chips only. Visual-lab only.
 */
export function CoachedComplete({ state = "populated" }: { state?: CoachedConceptState }) {
  const [logged, setLogged] = useState(false);
  const c = CONCEPT_FIXTURE.completion;
  const s = CONCEPT_FIXTURE.todaySession;

  return (
    <ConceptShell kicker="Coached · Complete" title={s.name}>
      {state === "loading" ? <ConceptLoading lines={5} /> : null}
      {state === "empty" ? (
        <ConceptEmpty
          title="Nothing to log yet"
          body="Complete opens after a programmed session exists. Empty completes are not allowed in the live contract."
        />
      ) : null}
      {state === "populated" && !logged ? (
        <div data-coached-complete="" className="space-y-8">
          <Band label="Prescribed" hint="What the coach set" accent="border-zinc-600">
            <p className="text-3xl font-bold tabular-nums text-white">{c.targetPace}</p>
            <p className={`mt-2 ${visualMeta}`}>
              Target · {s.primaryTargetHint} · planned RPE {s.rpe}
            </p>
          </Band>

          <Band label="Actual" hint="What you did" accent="border-yellow-400/70">
            <label className="block">
              <span className={visualEyebrow}>Primary actual · pace</span>
              <p className="mt-2 text-3xl font-bold tabular-nums text-white">{c.actualPace}</p>
              <p className={`mt-1 ${visualMeta}`}>Demo value — device import can replace this later</p>
            </label>
          </Band>

          <Band label="Subjective" hint="How it felt" accent="border-zinc-500">
            <div className="flex flex-wrap gap-2">
              <Chip active>RPE {c.rpe}</Chip>
              <Chip active>Execution · {c.execution}</Chip>
              <Chip>Pain · No</Chip>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <dt className={visualEyebrow}>Energy</dt>
                <dd className="mt-1 text-sm text-zinc-200">{c.energy}</dd>
              </div>
              <div>
                <dt className={visualEyebrow}>Legs</dt>
                <dd className="mt-1 text-sm text-zinc-200">{c.legs}</dd>
              </div>
            </dl>
            <p className={`mt-3 ${visualMeta}`}>{c.note}</p>
          </Band>

          <ConceptButton primary onClick={() => setLogged(true)}>
            Save log
          </ConceptButton>
        </div>
      ) : null}
      {state === "populated" && logged ? (
        <CompletionConfirm show>
          <div data-coached-complete-confirm="" className="space-y-6">
            <p className={visualEyebrow}>Completed</p>
            <TargetActual
              target={{ label: "Target", value: c.targetPace }}
              actual={{ label: "Actual", value: c.actualPace }}
              rpe={{ label: "RPE", value: c.rpe }}
            />
            <p className={visualMeta}>
              Execution {c.execution} · Legs {c.legs} · Energy {c.energy}
            </p>
            <p className={visualBody}>{c.note}</p>
            <p className={visualMeta}>Your coach can see this result.</p>
            <ConceptButton onClick={() => setLogged(false)}>Back</ConceptButton>
          </div>
        </CompletionConfirm>
      ) : null}
    </ConceptShell>
  );
}

function Band({
  label,
  hint,
  accent,
  children,
}: {
  label: string;
  hint: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`border-l-2 ${accent} pl-4`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={visualEyebrow}>{label}</p>
        <p className={visualMeta}>{hint}</p>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Chip({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className={`${visualTouch} inline-flex items-center rounded-lg border px-3 text-xs font-semibold ${
        active ? "border-yellow-400 bg-yellow-400/10 text-yellow-200" : "border-zinc-700 text-zinc-300"
      }`}
    >
      {children}
    </span>
  );
}
