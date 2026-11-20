/**
 * If today changes, the rest of the open week changes with it.
 * Pure. No database write. Long-run and HYROX anchors stay put.
 * A new lower-body stack is refused. Completed work is not moved.
 */

import { WEEK_DAYS, type LoadLine, type ReflowOperation, type ReflowProposal, type TodayAction, type TrackClass, type WeekDay, type WeekSession } from "@/app/lib/daily-readiness/types";
import type { DailyReadinessState } from "@/app/lib/daily-readiness/types";

function indexOf(day: WeekDay): number {
  return WEEK_DAYS.indexOf(day);
}

function clone(sessions: WeekSession[]): WeekSession[] {
  return sessions.map((session) => ({ ...session, load: session.load.map((item) => ({ ...item })) }));
}

function lowerPairs(sessions: WeekSession[]): Set<string> {
  const hard = new Set(sessions.filter((session) => session.hard && session.lowerBody).map((session) => session.day));
  const pairs = new Set<string>();
  for (let i = 0; i < WEEK_DAYS.length - 1; i += 1) {
    if (hard.has(WEEK_DAYS[i]!) && hard.has(WEEK_DAYS[i + 1]!)) pairs.add(`${WEEK_DAYS[i]}-${WEEK_DAYS[i + 1]}`);
  }
  return pairs;
}

function loadLines(before: WeekSession[], after: WeekSession[]): LoadLine[] {
  const ids = [...new Set([...before, ...after].flatMap((session) => session.load.map((item) => item.label)))];
  return ids.flatMap((label) => {
    const unit = [...before, ...after].flatMap((session) => session.load).find((item) => item.label === label)?.unit ?? "";
    const sum = (rows: WeekSession[]) => rows.reduce((total, session) => total + session.load.filter((item) => item.label === label).reduce((inner, item) => inner + item.value, 0), 0);
    const from = Math.round(sum(before) * 10) / 10;
    const to = Math.round(sum(after) * 10) / 10;
    if (from === 0 && to === 0) return [];
    return [{ label, unit, before: from, after: to }];
  });
}

function proposal(input: {
  action: TodayAction;
  trackClass: TrackClass;
  requiresCoach: boolean;
  status: ReflowProposal["status"];
  operations: ReflowOperation[];
  before: WeekSession[];
  after: WeekSession[];
  conflicts: string[];
  athleteExplanation: string;
  coachExplanation: string;
}): ReflowProposal {
  return {
    ...input,
    mutates: false,
    load: loadLines(input.before, input.after),
    hardDaysBefore: new Set(input.before.filter((session) => session.hard).map((session) => session.day)).size,
    hardDaysAfter: new Set(input.after.filter((session) => session.hard).map((session) => session.day)).size,
  };
}

function unchanged(before: WeekSession[], action: TodayAction, trackClass: TrackClass, athlete: string, coach: string, conflicts: string[] = []): ReflowProposal {
  return proposal({
    action, trackClass, requiresCoach: action !== "KEEP_TODAY", status: conflicts.length ? "NO_SAFE_REFLOW" : "unchanged",
    operations: [{ name: "KEEP", sessionId: null, fromDay: null, toDay: null, reason: coach }],
    before, after: clone(before), conflicts, athleteExplanation: athlete, coachExplanation: coach,
  });
}

function chooseAction(state: DailyReadinessState, todaySessions: WeekSession[]): TodayAction {
  if (state.freshness === "MISSING" || state.freshness === "COACH_OVERRIDDEN") return "KEEP_TODAY";
  if (state.freshness === "STALE") return "KEEP_TODAY";
  if (state.interpretation === "PAIN_REVIEW_REQUIRED") {
    const provokes = (state.answers?.painProvokes ?? "").toLowerCase();
    const hit = todaySessions.some((session) => provokes && provokes.includes(session.modality));
    return hit ? "BLOCKED_PAIN" : "COACH_REVIEW_REQUIRED";
  }
  if (state.interpretation === "MULTIPLE_STRESSORS" || state.interpretation === "FATIGUED") {
    if (todaySessions.some((session) => session.priority === "optional") && !todaySessions.some((session) => session.priority === "key" && session.hard)) {
      return "REMOVE_OPTIONAL";
    }
    if (todaySessions.some((session) => session.priority === "key" && session.hard)) return "MOVE_KEY_SESSION";
    if (todaySessions.length) return "REDUCE_TODAY_VOLUME";
  }
  return "KEEP_TODAY";
}

export function resolveRemainingWeek(input: {
  state: DailyReadinessState;
  sessions: WeekSession[];
  today: WeekDay;
  unavailableDays?: WeekDay[];
  raceDaysOut?: number | null;
  product?: "hyrox_team" | "track";
}): ReflowProposal {
  const before = clone(input.sessions);
  const product = input.product ?? "hyrox_team";
  const todaySessions = before.filter((session) => session.day === input.today);
  const action = chooseAction(input.state, todaySessions);
  const coachReview = product === "hyrox_team";

  if (action === "KEEP_TODAY") {
    return unchanged(before, action, "SAFE_DEFAULT", input.state.athleteSentence, "No programme change.", []);
  }
  if (action === "BLOCKED_PAIN" || action === "COACH_REVIEW_REQUIRED") {
    return unchanged(
      before,
      action,
      "COACH_REQUIRED",
      "You reported pain. Keep today's plan until a coach has seen it. This is not a diagnosis.",
      "Pain is separate from fatigue. The week was not changed.",
      ["Pain needs a coach."],
    );
  }
  if (input.raceDaysOut != null && input.raceDaysOut <= 7 && action === "MOVE_KEY_SESSION") {
    return unchanged(before, "COACH_REVIEW_REQUIRED", "COACH_REQUIRED", "Race week stays as planned.", "A key session is not moved this close to the race.", ["Race proximity."]);
  }
  if (todaySessions.some((session) => session.status !== "planned")) {
    return unchanged(before, "KEEP_TODAY", "BLOCKED", input.state.athleteSentence, "Completed or started work stays where it is.", ["Completed session."]);
  }

  if (action === "REMOVE_OPTIONAL") {
    const optional = todaySessions.filter((session) => session.priority === "optional");
    const after = before.filter((session) => !optional.some((item) => item.id === session.id));
    return proposal({
      action, trackClass: "ATHLETE_CHOICE", requiresCoach: coachReview, status: "proposed",
      operations: optional.map((session) => ({ name: "REMOVE_OPTIONAL" as const, sessionId: session.id, fromDay: session.day, toDay: null, reason: "Optional work is the first cut." })),
      before, after, conflicts: [],
      athleteExplanation: "The extra piece comes off today. The main session stays.",
      coachExplanation: "Optional work removed. The key session was not moved.",
    });
  }

  if (action === "REDUCE_TODAY_VOLUME") {
    const after = before.map((session) => session.day === input.today && session.priority !== "key"
      ? { ...session, load: session.load.map((item) => ({ ...item, value: Math.round(item.value * 0.8) })) }
      : session);
    return proposal({
      action, trackClass: "ATHLETE_CHOICE", requiresCoach: coachReview, status: "proposed",
      operations: [{ name: "REDUCE_VOLUME", sessionId: todaySessions[0]?.id ?? null, fromDay: input.today, toDay: null, reason: "Easy volume comes down. The key work stays." }],
      before, after, conflicts: [],
      athleteExplanation: "Today's easy work is a little shorter.",
      coachExplanation: "Easy volume reduced by a fifth. No key session moved.",
    });
  }

  const slid = slide(before, input.today, input.unavailableDays ?? []);
  if ("conflict" in slid) {
    return unchanged(before, "COACH_REVIEW_REQUIRED", "COACH_REQUIRED", "There isn't a safe way to move today and keep the week honest.", slid.conflict, [slid.conflict]);
  }
  const introduced = [...lowerPairs(slid.after)].filter((pair) => !lowerPairs(before).has(pair));
  if (introduced.length) {
    return unchanged(before, "COACH_REVIEW_REQUIRED", "BLOCKED", "Moving today would stack hard lower-body days.", "The move creates a new lower-body stack.", introduced);
  }
  return proposal({
    action: "REPLACE_WITH_EASY_BIKE",
    trackClass: product === "track" ? "ATHLETE_CHOICE" : "COACH_REQUIRED",
    requiresCoach: coachReview,
    status: "proposed",
    operations: slid.operations,
    before,
    after: slid.after,
    conflicts: [],
    athleteExplanation: `We recommend an easy bike today and moving ${slid.movedTitle} to ${slid.movedTo}. The rest of the week shifts so hard and easy days still alternate.`,
    coachExplanation: `${slid.movedTitle} moves ${input.today} → ${slid.movedTo}. Today becomes easy bike. Anchored HYROX and long-run days stay put.`,
  });
}

function slide(sessions: WeekSession[], today: WeekDay, unavailable: WeekDay[]): { after: WeekSession[]; operations: ReflowOperation[]; movedTitle: string; movedTo: WeekDay } | { conflict: string } {
  const start = indexOf(today);
  const nextAnchor = sessions.find((session) => session.anchor && indexOf(session.day) > start);
  const end = nextAnchor ? indexOf(nextAnchor.day) : WEEK_DAYS.length;
  const open = WEEK_DAYS.slice(start, end).filter((day) => !unavailable.includes(day));
  if (!open.includes(today)) return { conflict: "Today is not available." };
  const movable = sessions
    .filter((session) => open.includes(session.day) && session.status === "planned" && session.modality !== "rest")
    .sort((a, b) => indexOf(a.day) - indexOf(b.day));
  const key = movable.find((session) => session.day === today && session.priority === "key" && session.hard);
  if (!key) return { conflict: "Today has no planned key session to move." };
  const trailing = movable[movable.length - 1];
  if (!trailing || trailing.hard || trailing.priority === "key") return { conflict: "No easy day can absorb the shift." };
  const kept = movable.slice(0, -1);
  if (kept.length > open.length - 1) return { conflict: "Not enough open days." };
  const bike: WeekSession = {
    id: `${key.id}-easy-bike`,
    day: today,
    title: "Easy bike",
    priority: "supporting",
    stimulus: "easy",
    hard: false,
    lowerBody: false,
    modality: "bike",
    status: "planned",
    anchor: false,
    load: [{ metricId: "bike_time_min", label: "Bike", value: 40, unit: "min" }],
  };
  const placed = new Map<string, WeekSession>();
  placed.set(bike.id, bike);
  kept.forEach((session, index) => {
    const day = open[index + 1];
    if (day) placed.set(session.id, { ...session, day });
  });
  const movedTo = placed.get(key.id)?.day;
  if (!movedTo || movedTo === today) return { conflict: "The key session has nowhere safe to go." };
  const after = [
    ...sessions.filter((session) => !movable.some((item) => item.id === session.id)),
    ...placed.values(),
  ].sort((a, b) => indexOf(a.day) - indexOf(b.day));
  const operations: ReflowOperation[] = [
    { name: "REPLACE_SESSION", sessionId: key.id, fromDay: today, toDay: today, reason: "Today becomes easy bike." },
    ...kept.filter((session) => placed.get(session.id)?.day !== session.day).map((session) => ({
      name: "MOVE_SESSION" as const,
      sessionId: session.id,
      fromDay: session.day,
      toDay: placed.get(session.id)!.day,
      reason: "The week shifts to keep a day between hard lower-body sessions.",
    })),
    { name: "DEFER_SESSION", sessionId: trailing.id, fromDay: trailing.day, toDay: null, reason: "The displaced easy session is not crammed back in." },
  ];
  return { after, operations, movedTitle: key.title, movedTo };
}
