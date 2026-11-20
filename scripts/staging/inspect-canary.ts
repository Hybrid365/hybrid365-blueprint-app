import { loadCanary } from "../../app/lib/track-canary/model";

async function main() {
  const view = await loadCanary();
  console.log(JSON.stringify({
    week: view.currentWeek,
    weeks: view.programmeWeeks,
    decision: view.nextWeek.decision,
    from: view.nextWeek.from,
    to: view.nextWeek.to,
    minutes: [view.nextWeek.minutesFrom, view.nextWeek.minutesTo],
    canAccept: view.nextWeek.canAccept,
    label: view.nextWeek.acceptLabel,
    why: view.nextWeek.why,
    starts: view.nextWeek.starts,
    stationNeeded: view.stationNeeded,
    stations: view.stations.map((station) => ({ label: station.label, evidence: station.evidence, graph: station.graph })),
    impact: view.impact,
    acceptedHome: view.accepted,
    history: view.history,
    nextDays: view.nextTitles.map((day) => `${day.day} ${day.title}`),
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "load failed");
  process.exit(1);
});
