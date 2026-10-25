"use client";

import { useState } from "react";
import { HomeConceptA } from "./HomeConceptA";
import { HomeConceptB } from "./HomeConceptB";
import { HomeConceptC } from "./HomeConceptC";
import { HomeConceptD } from "./HomeConceptD";
import { SessionDetailConcept } from "./SessionDetailConcept";
import { SessionCompleteConcept } from "./SessionCompleteConcept";
import { ProgressConcept } from "./ProgressConcept";
import { PerformanceConcept } from "./PerformanceConcept";
import { RaceIntelligenceConcept } from "./RaceIntelligenceConcept";
import { CoachedHome } from "./coached/CoachedHome";
import { CoachedSession } from "./coached/CoachedSession";
import { CoachedComplete } from "./coached/CoachedComplete";
import { CoachedProgress } from "./coached/CoachedProgress";
import { CoachedPerformance } from "./coached/CoachedPerformance";
import { CoachedRace } from "./coached/CoachedRace";
import type { CoachedConceptState } from "./coached/ConceptState";
import { visualBody, visualEyebrow, visualTouch } from "../tokens";

const COACHED = [
  { id: "coached-home", label: "Coached Home" },
  { id: "coached-session", label: "Coached Session" },
  { id: "coached-complete", label: "Coached Complete" },
  { id: "coached-progress", label: "Coached Progress" },
  { id: "coached-performance", label: "Coached Performance" },
  { id: "coached-race", label: "Coached Races" },
] as const;

const RESEARCH = [
  { id: "home-a", label: "Home A" },
  { id: "home-b", label: "Home B" },
  { id: "home-c", label: "Home C" },
  { id: "home-d", label: "Home D" },
  { id: "session", label: "Session" },
  { id: "complete", label: "Complete" },
  { id: "progress", label: "Progress" },
  { id: "performance", label: "Performance" },
  { id: "race", label: "Races" },
] as const;

const CONCEPTS = [...COACHED, ...RESEARCH] as const;

type ConceptId = (typeof CONCEPTS)[number]["id"];

const STATES: Array<{ id: CoachedConceptState; label: string }> = [
  { id: "populated", label: "Populated" },
  { id: "loading", label: "Loading" },
  { id: "empty", label: "Empty" },
];

function isCoached(id: ConceptId): boolean {
  return id.startsWith("coached-");
}

export function ConceptsLab() {
  const [active, setActive] = useState<ConceptId>("coached-home");
  const [state, setState] = useState<CoachedConceptState>("populated");

  return (
    <section data-concepts-lab="">
      <header className="border-b border-zinc-800 pb-6">
        <p className={visualEyebrow}>Direction research</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Hybrid365 concepts</h1>
        <p className={`mt-2 ${visualBody}`}>
          Staging-only prototypes. Demo-labelled fixture data. Coached tabs are the consolidated review
          direction (A hierarchy + C coach + B telemetry on Progress/Race). These screens do not replace
          live athlete Home, Programme, or logging.
        </p>
        <p className={`mt-2 ${visualBody}`}>
          Brief: <span className="text-zinc-200">docs/visual-qa/concepts/COACHED_COMMAND_CENTRE.md</span>
        </p>
      </header>

      <div className="-mx-4 mt-6 space-y-3 border-b border-zinc-800 px-4 py-3">
        <p className={visualEyebrow}>Coached Command Centre</p>
        <div className="flex flex-wrap gap-2">
          {COACHED.map((concept) => (
            <TabButton
              key={concept.id}
              id={concept.id}
              label={concept.label}
              active={active === concept.id}
              onSelect={setActive}
            />
          ))}
        </div>
        {isCoached(active) ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">State</p>
            {STATES.map((item) => (
              <button
                key={item.id}
                type="button"
                data-concept-state-tab={item.id}
                onClick={() => setState(item.id)}
                className={`${visualTouch} rounded-full border px-3 text-xs font-semibold ${
                  state === item.id
                    ? "border-zinc-200 bg-zinc-200 text-zinc-950"
                    : "border-zinc-700 text-zinc-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="-mx-4 mt-2 overflow-x-auto border-b border-zinc-800 px-4 py-3">
        <p className={`${visualEyebrow} mb-2`}>Earlier research</p>
        <div className="flex gap-2">
          {RESEARCH.map((concept) => (
            <TabButton
              key={concept.id}
              id={concept.id}
              label={concept.label}
              active={active === concept.id}
              onSelect={setActive}
            />
          ))}
        </div>
      </div>

      <div className="mt-8" data-concept={active} data-concept-view-state={isCoached(active) ? state : "populated"}>
        {active === "coached-home" ? <CoachedHome state={state} /> : null}
        {active === "coached-session" ? <CoachedSession state={state} /> : null}
        {active === "coached-complete" ? <CoachedComplete state={state} /> : null}
        {active === "coached-progress" ? <CoachedProgress state={state} /> : null}
        {active === "coached-performance" ? <CoachedPerformance state={state} /> : null}
        {active === "coached-race" ? <CoachedRace state={state} /> : null}
        {active === "home-a" ? <HomeConceptA /> : null}
        {active === "home-b" ? <HomeConceptB /> : null}
        {active === "home-c" ? <HomeConceptC /> : null}
        {active === "home-d" ? <HomeConceptD /> : null}
        {active === "session" ? <SessionDetailConcept /> : null}
        {active === "complete" ? <SessionCompleteConcept /> : null}
        {active === "progress" ? <ProgressConcept /> : null}
        {active === "performance" ? <PerformanceConcept /> : null}
        {active === "race" ? <RaceIntelligenceConcept /> : null}
      </div>
    </section>
  );
}

function TabButton({
  id,
  label,
  active,
  onSelect,
}: {
  id: ConceptId;
  label: string;
  active: boolean;
  onSelect: (id: ConceptId) => void;
}) {
  return (
    <button
      type="button"
      data-concept-tab={id}
      onClick={() => onSelect(id)}
      className={`${visualTouch} rounded-full border px-3 text-xs font-semibold ${
        active ? "border-yellow-400 bg-yellow-400 text-zinc-950" : "border-zinc-700 text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}
