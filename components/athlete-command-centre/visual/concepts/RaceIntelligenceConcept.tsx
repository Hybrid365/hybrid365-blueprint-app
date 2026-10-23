import { CONCEPT_RACES } from "./fixture";
import { CoachMark, ConceptShell } from "./chrome";
import { ComparisonBars, SplitStrip } from "./viz";
import { HYROX_RACE_STATION_LABELS } from "@/app/lib/hyroxRaceIntelligenceTypes";
import { visualEyebrow, visualMeta } from "../tokens";

function formatDelta(seconds: number | null): string {
  if (seconds == null) return "—";
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const clock = m ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
  return seconds < 0 ? `−${clock}` : `+${clock}`;
}

export function RaceIntelligenceConcept() {
  const latest = CONCEPT_RACES[0];
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
    <ConceptShell kicker="Race intelligence" title={race.eventName} wide>
      <p className={visualMeta}>
        {race.raceDate} · {race.division} · Prototype splits — not a live result
      </p>
      <p className="mt-4 text-5xl font-bold tabular-nums tracking-tight text-white">{race.overall.display}</p>
      <p className="mt-2 text-sm text-zinc-200">
        {formatDelta(analysis.vsPrevious?.overallDeltaSeconds ?? null)} vs previous ·{" "}
        {formatDelta(analysis.vsGoalSeconds)} vs goal
      </p>

      <section className="mt-8">
        <p className={visualEyebrow}>Run splits</p>
        <p className={`mt-1 ${visualMeta}`}>
          Fade {analysis.runFadeSeconds}s · fastest {analysis.fastestRun?.display} · slowest{" "}
          {analysis.slowestRun?.display}
        </p>
        <div className="mt-4">
          <SplitStrip items={runs} />
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <p className={visualEyebrow}>Stations vs previous</p>
          <div className="mt-3">
            <ComparisonBars rows={stationRows} />
          </div>
        </div>
        <div>
          <p className={visualEyebrow}>Roxzone</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-white">{race.roxzone.display}</p>
          <p className={visualMeta}>
            {formatDelta(
              analysis.roxzoneSeconds != null && CONCEPT_RACES[1].analysis.roxzoneSeconds != null
                ? analysis.roxzoneSeconds - CONCEPT_RACES[1].analysis.roxzoneSeconds
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
    </ConceptShell>
  );
}
