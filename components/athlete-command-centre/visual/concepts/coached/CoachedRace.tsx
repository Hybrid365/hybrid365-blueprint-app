import { CONCEPT_RACES } from "../fixture";
import { CoachMark, ConceptShell } from "../chrome";
import { ComparisonBars, SplitStrip } from "../viz";
import { HYROX_RACE_STATION_LABELS } from "@/app/lib/hyroxRaceIntelligenceTypes";
import { visualEyebrow, visualMeta } from "../../tokens";
import { ConceptEmpty, ConceptLoading, type CoachedConceptState } from "./ConceptState";

function formatDelta(seconds: number | null): string {
  if (seconds == null) return "—";
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const clock = m ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
  return seconds < 0 ? `−${clock}` : `+${clock}`;
}

/**
 * Race Intelligence — overall → run → station → vs previous.
 * Observations from stored splits only. Visual-lab only.
 */
export function CoachedRace({ state = "populated" }: { state?: CoachedConceptState }) {
  const latest = CONCEPT_RACES[0];
  const previous = CONCEPT_RACES[1];
  const race = latest.race;
  const analysis = latest.analysis;
  const runs = Object.entries(race.runs).map(([key, value], i) => ({
    label: String(i + 1),
    display: value.display ?? "—",
    seconds: value.seconds ?? 0,
    emphasize: key === analysis.fastestRun?.key,
  }));
  const stationRows = analysis.vsPrevious
    ? analysis.vsPrevious.stations.map((row) => ({
        label: HYROX_RACE_STATION_LABELS[row.key],
        current: race.stations[row.key].display ?? "—",
        deltaLabel: formatDelta(row.deltaSeconds),
        improved: row.deltaSeconds < 0,
      }))
    : [];

  return (
    <ConceptShell kicker="Coached · Races" title={race.eventName} wide>
      {state === "loading" ? <ConceptLoading lines={6} /> : null}
      {state === "empty" ? (
        <ConceptEmpty
          title="No race results stored"
          body="Race Intelligence shows overall, run, and station analysis only after a result is saved. Nothing is invented from training paces."
        />
      ) : null}
      {state === "populated" ? (
        <div data-coached-race="" className="space-y-10">
          <section>
            <p className={visualEyebrow}>Overall result</p>
            <p className={`mt-1 ${visualMeta}`}>
              {race.raceDate} · {race.division} · Prototype splits — not a live result
            </p>
            <p className="mt-4 text-5xl font-bold tabular-nums tracking-tight text-white">
              {race.overall.display}
            </p>
            <p className="mt-2 text-sm text-zinc-200">
              {formatDelta(analysis.vsPrevious?.overallDeltaSeconds ?? null)} vs{" "}
              {analysis.vsPrevious?.previousEventName ?? "previous"} ·{" "}
              {formatDelta(analysis.vsGoalSeconds)} vs goal
            </p>
          </section>

          <section className="border-t border-zinc-800 pt-8">
            <p className={visualEyebrow}>Run analysis</p>
            <p className={`mt-1 ${visualMeta}`}>
              Fade {analysis.runFadeSeconds}s · fastest {analysis.fastestRun?.display} · slowest{" "}
              {analysis.slowestRun?.display}
              {analysis.vsPrevious?.averageRunDeltaSeconds != null
                ? ` · avg run ${formatDelta(analysis.vsPrevious.averageRunDeltaSeconds)} vs previous`
                : ""}
            </p>
            <div className="mt-4">
              <SplitStrip items={runs} />
            </div>
          </section>

          <section className="grid gap-8 border-t border-zinc-800 pt-8 lg:grid-cols-2">
            <div>
              <p className={visualEyebrow}>Station analysis · vs previous</p>
              <p className={`mt-1 ${visualMeta}`}>
                Compared with {previous.race.eventName} ({previous.race.raceDate})
              </p>
              <div className="mt-3">
                <ComparisonBars rows={stationRows} />
              </div>
            </div>
            <div>
              <p className={visualEyebrow}>Roxzone</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-white">{race.roxzone.display}</p>
              <p className={visualMeta}>
                {formatDelta(
                  analysis.roxzoneSeconds != null && previous.analysis.roxzoneSeconds != null
                    ? analysis.roxzoneSeconds - previous.analysis.roxzoneSeconds
                    : null
                )}{" "}
                vs previous
              </p>
              <div className="mt-6">
                <CoachMark label="From stored splits">
                  <ul className="space-y-2">
                    {analysis.observations.map((obs) => (
                      <li key={obs.text}>{obs.text}</li>
                    ))}
                  </ul>
                </CoachMark>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </ConceptShell>
  );
}
