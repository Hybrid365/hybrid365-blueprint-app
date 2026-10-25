import { CONCEPT_FIXTURE } from "../fixture";
import { CoachMark, ConceptButton, ConceptShell } from "../chrome";
import { IntervalTimeline } from "../viz";
import { visualEyebrow, visualMeta } from "../../tokens";
import { ConceptEmpty, ConceptLoading, type CoachedConceptState } from "./ConceptState";

/** Session detail — understandable in seconds. Visual-lab only. */
export function CoachedSession({ state = "populated" }: { state?: CoachedConceptState }) {
  const s = CONCEPT_FIXTURE.todaySession;
  // Primary prescription only — avoid the dense multi-modality wall on first glance.
  const primaryRx = s.prescriptions[0];

  return (
    <ConceptShell kicker="Coached · Session" title={s.name} wide>
      {state === "loading" ? <ConceptLoading lines={6} /> : null}
      {state === "empty" ? (
        <ConceptEmpty
          title="Session not available"
          body="Published sessions unlock when the week is live. Missing targets stay missing — nothing is invented here."
        />
      ) : null}
      {state === "populated" ? (
        <div data-coached-session="" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
          <div>
            <p className={visualEyebrow}>Purpose</p>
            <p className="mt-2 text-xl font-semibold leading-snug text-white sm:text-2xl">{s.purpose}</p>

            <div className="mt-8">
              <p className={visualEyebrow}>Primary target</p>
              <p className="mt-2 text-5xl font-bold tabular-nums tracking-tight text-white">
                {s.primaryTarget}
              </p>
              <p className={`mt-2 ${visualMeta}`}>
                {s.primaryTargetHint} · {s.duration} · RPE {s.rpe}
              </p>
            </div>

            <div className="mt-8">
              <p className={visualEyebrow}>Structure</p>
              <div className="mt-3">
                <IntervalTimeline steps={[...s.structure]} />
              </div>
            </div>

            <div className="mt-8 lg:hidden">
              <ConceptButton primary>Complete session</ConceptButton>
            </div>
          </div>

          <aside className="space-y-8 border-t border-zinc-800 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div>
              <p className={visualEyebrow}>Prescription</p>
              <p className="mt-3 text-2xl font-bold tabular-nums text-white">{primaryRx.value}</p>
              <p className={`mt-1 ${visualMeta}`}>
                {primaryRx.label} · {primaryRx.hint}
              </p>
            </div>

            <CoachMark label="Coach">
              <p>{s.coachNote}</p>
            </CoachMark>

            <div>
              <p className={visualEyebrow}>Execution</p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                {s.guidance.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>

            <div className="hidden lg:block">
              <ConceptButton primary>Complete session</ConceptButton>
            </div>
          </aside>
        </div>
      ) : null}
    </ConceptShell>
  );
}
