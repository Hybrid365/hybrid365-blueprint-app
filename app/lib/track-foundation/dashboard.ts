import { addDays, formatDisplayDate, mondayOf } from "./dates";
import type { AnchorBundle } from "./anchors";
import type { EvidenceBook } from "./evidence";
import { getTest } from "./testLibrary";
import type {
  AssessmentWeek,
  BenchmarkSeriesPoint,
  DashboardView,
  DayKey,
  HomeDay,
  HomeView,
  TrackIntake,
  WorkloadCard,
} from "./types";
import type { AthletePerformanceProfile } from "./types";

const DAY_ORDER: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function benchmarkSeries(book: EvidenceBook): DashboardView["series"] {
  const currentIds = new Set<string>();
  const families = [book.running, book.ski, book.row, book.bike, book.strength, book.hyrox, ...Object.values(book.stations)];
  for (const family of families) {
    if (family.current) currentIds.add(family.current.id);
  }
  const groups = new Map<string, BenchmarkSeriesPoint[]>();
  for (const row of book.classified) {
    if (row.disposition === "INVALID_INCOMPLETE") continue;
    const points = groups.get(row.testId) ?? [];
    points.push({
      date: row.date,
      label: formatDisplayDate(row.date),
      value: row.resultValue,
      source: row.source,
      isCurrentAnchor: currentIds.has(row.id),
      corrected: row.excludedFromAnchor,
    });
    groups.set(row.testId, points);
  }
  return [...groups.entries()]
    .map(([id, points]) => ({
      id,
      label: getTest(id)?.name ?? id,
      points: points.sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .filter((series) => series.points.length > 0);
}

export function visibleWorkload(cards: WorkloadCard[]): WorkloadCard[] {
  return cards.filter((card) => card.planned != null || card.completed != null);
}

export function buildDashboard(args: {
  book: EvidenceBook;
  anchors: AnchorBundle;
  profile: AthletePerformanceProfile;
  workload?: WorkloadCard[];
}): DashboardView {
  const targets = [args.anchors.running.threshold, args.anchors.running.easy, args.anchors.bike, args.anchors.ski, args.anchors.row, args.anchors.strength]
    .filter((anchor) => anchor && anchor.display)
    .map((anchor) => ({
      label: anchor!.label,
      display: anchor!.display,
      provenance: anchor!.provenance?.statement ?? "",
    }));

  const profileLines = args.profile.sections
    .filter((section) => section.id !== "work_capacity")
    .flatMap((section) => section.known.slice(0, 2).map((line) => `${section.title}: ${line}`))
    .filter((line) => !/not estimated|not guessed/i.test(line))
    .slice(0, 8);

  const limiters = args.profile.sections.flatMap((section) => section.limiters).filter((line) => !/not a diagnosis/i.test(line));

  return {
    targets,
    series: benchmarkSeries(args.book).filter((series) => series.points.length >= 1),
    workload: visibleWorkload(args.workload ?? []),
    profileLines,
    limiters,
  };
}

export function buildHome(args: {
  intake: TrackIntake;
  week: AssessmentWeek;
  asOf: string;
}): HomeView {
  const monday = mondayOf(args.asOf);
  const days: HomeDay[] = DAY_ORDER.map((day, index) => {
    const date = addDays(monday, index);
    const session = args.week.sessions.find((item) => item.date === date);
    return {
      day,
      date,
      isToday: date === args.asOf,
      title: session?.title ?? null,
    };
  });
  const today = args.week.sessions.find((session) => session.date === args.asOf);
  let raceCountdown: string | null = null;
  if (args.intake.event.hasEvent && args.intake.event.eventDate) {
    const ms = Date.parse(`${args.intake.event.eventDate}T00:00:00Z`) - Date.parse(`${args.asOf}T00:00:00Z`);
    const daysOut = Math.round(ms / 86_400_000);
    if (Number.isFinite(daysOut) && daysOut >= 0) {
      raceCountdown = `${args.intake.event.eventName || args.intake.event.eventType || "Event"} in ${daysOut} days`;
    }
  }
  return {
    days,
    todayTitle: today ? today.title : "No assessment session today",
    todayDetail: today ? today.summary : "Rest or leave the day open.",
    readinessPrompt: "Morning readiness uses the existing check-in. It does not rewrite today.",
    weekNote: args.week.manualReview
      ? "Pain review is open. No maximal testing."
      : args.week.testCount === 0
        ? "No assessment tests this week."
        : args.week.headline,
    raceCountdown,
    progressSignal: null,
  };
}
