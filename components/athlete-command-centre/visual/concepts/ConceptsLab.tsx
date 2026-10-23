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
import { visualBody, visualEyebrow, visualTouch } from "../tokens";

const CONCEPTS = [
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

type ConceptId = (typeof CONCEPTS)[number]["id"];

export function ConceptsLab() {
  const [active, setActive] = useState<ConceptId>("home-a");

  return (
    <section data-concepts-lab="">
      <header className="border-b border-zinc-800 pb-6">
        <p className={visualEyebrow}>Direction research</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Hybrid365 concepts</h1>
        <p className={`mt-2 ${visualBody}`}>
          Staging-only prototypes. Demo-labelled fixture data. These screens do not replace live athlete Home,
          Programme, or logging.
        </p>
      </header>

      <div className="-mx-4 mt-6 overflow-x-auto border-b border-zinc-800 px-4 py-3">
        <div className="flex gap-2">
          {CONCEPTS.map((concept) => (
            <button
              key={concept.id}
              type="button"
              data-concept-tab={concept.id}
              onClick={() => setActive(concept.id)}
              className={`${visualTouch} rounded-full border px-3 text-xs font-semibold ${
                active === concept.id
                  ? "border-yellow-400 bg-yellow-400 text-zinc-950"
                  : "border-zinc-700 text-zinc-300"
              }`}
            >
              {concept.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8" data-concept={active}>
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
