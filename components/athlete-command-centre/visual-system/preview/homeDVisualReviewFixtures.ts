/**
 * Controlled synthetic Home D view-models for `/preview/athlete/home` only.
 * Never import from production Home D resolvers or APIs.
 */

import type {
  AthleteHomeDCoachContext,
  AthleteHomeDDay,
  AthleteHomeDInsight,
  AthleteHomeDSessionCard,
} from "@/app/lib/hyroxAthleteHomeDViewModel";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import { LAB_REPEAT_WORKOUT } from "../lab/labFixtures";

export const HOME_D_VISUAL_REVIEW_STATES = [
  "upcoming",
  "completed",
  "partial",
  "missed",
  "not-logged",
  "no-session",
  "multi-session",
  "long-copy",
  "coach-note",
  "benchmark-insight",
  "repeat-timeline",
] as const;

export type HomeDVisualReviewStateId = (typeof HOME_D_VISUAL_REVIEW_STATES)[number];

export type HomeDVisualReviewFixture = {
  id: HomeDVisualReviewStateId;
  label: string;
  athleteName: string;
  programmeLine: string;
  weekDays: AthleteHomeDDay[];
  selectedId: string;
  coachContext: AthleteHomeDCoachContext | null;
  performanceInsight: AthleteHomeDInsight | null;
  /** Optional live stubs for StructuredWorkout → timeline (presentation only). */
  liveById: Record<string, HyroxSession>;
};

function session(
  partial: Partial<AthleteHomeDSessionCard> &
    Pick<AthleteHomeDSessionCard, "id" | "slot" | "title" | "status">
): AthleteHomeDSessionCard {
  return {
    modalityLabel: "Run",
    primaryTarget: "3:55 /km",
    primaryDetail: "5 × 5:00 · 1:30 jog",
    duration: "~45 min",
    intent: "Accumulate quality threshold work.",
    coachNote: null,
    ...partial,
  };
}

function day(
  partial: Omit<AthleteHomeDDay, "sessions"> & { sessions?: AthleteHomeDSessionCard[] }
): AthleteHomeDDay {
  return {
    sessions: [],
    ...partial,
  };
}

function weekShell(sessionsByDay: Record<string, AthleteHomeDSessionCard[]>): AthleteHomeDDay[] {
  const base = [
    { id: "d-mon", dow: "Mon", dateNumber: 3, iso: "2026-11-03", isToday: false, isPast: true },
    { id: "d-tue", dow: "Tue", dateNumber: 4, iso: "2026-11-04", isToday: false, isPast: true },
    { id: "d-wed", dow: "Wed", dateNumber: 5, iso: "2026-11-05", isToday: false, isPast: false },
    { id: "d-thu", dow: "Thu", dateNumber: 6, iso: "2026-11-06", isToday: false, isPast: false },
    { id: "d-fri", dow: "Fri", dateNumber: 7, iso: "2026-11-07", isToday: true, isPast: false },
    { id: "d-sat", dow: "Sat", dateNumber: 8, iso: "2026-11-08", isToday: false, isPast: false },
    { id: "d-sun", dow: "Sun", dateNumber: 9, iso: "2026-11-09", isToday: false, isPast: false },
  ] as const;

  return base.map((d) =>
    day({
      ...d,
      isToday: d.id === "d-fri",
      sessions: sessionsByDay[d.id] ?? [],
    })
  );
}

function liveRunStub(id: string, name: string): HyroxSession {
  return {
    id,
    day: "Fri",
    dayShort: "Fri",
    dateLabel: "Fri",
    name,
    type: "Run",
    focus: "Threshold",
    duration: "45 min",
    rpeTarget: "RPE 7",
    status: "upcoming",
    priority: "Key",
    intent: "Quality",
    structuredWorkout: LAB_REPEAT_WORKOUT,
  };
}

const secondary: AthleteHomeDSessionCard = session({
  id: "fx-secondary",
  slot: "PM",
  modalityLabel: "Strength",
  title: "Lower strength",
  primaryTarget: null,
  primaryDetail: "Squat · hinge · carry",
  duration: "40 min",
  intent: null,
  status: "upcoming",
});

function fixture(
  id: HomeDVisualReviewStateId,
  label: string,
  build: () => Omit<HomeDVisualReviewFixture, "id" | "label" | "athleteName" | "programmeLine">
): HomeDVisualReviewFixture {
  return {
    id,
    label,
    athleteName: "Visual Review",
    programmeLine: "Week 6 · Build the Engine · Threshold build",
    ...build(),
  };
}

export function getHomeDVisualReviewFixture(
  id: HomeDVisualReviewStateId
): HomeDVisualReviewFixture {
  switch (id) {
    case "upcoming":
      return fixture(id, "Upcoming", () => {
        const primary = session({
          id: "fx-up",
          slot: "Main",
          title: "Threshold 5s",
          status: "upcoming",
          coachNote: null,
        });
        return {
          selectedId: "d-fri",
          weekDays: weekShell({ "d-fri": [primary] }),
          coachContext: null,
          performanceInsight: null,
          liveById: {},
        };
      });

    case "completed":
      return fixture(id, "Completed", () => {
        const primary = session({
          id: "fx-done",
          slot: "Main",
          title: "Easy aerobic",
          primaryTarget: "Conversational",
          primaryDetail: null,
          duration: "40 min",
          intent: "Add easy aerobic minutes.",
          status: "completed",
        });
        return {
          selectedId: "d-mon",
          weekDays: weekShell({ "d-mon": [primary] }),
          coachContext: null,
          performanceInsight: null,
          liveById: {},
        };
      });

    case "partial":
      return fixture(id, "Partial", () => {
        const primary = session({
          id: "fx-partial",
          slot: "Main",
          modalityLabel: "Hybrid",
          title: "Station density",
          primaryTarget: "Controlled transitions",
          primaryDetail: null,
          duration: "50 min",
          intent: null,
          status: "partial",
        });
        return {
          selectedId: "d-tue",
          weekDays: weekShell({ "d-tue": [primary] }),
          coachContext: null,
          performanceInsight: null,
          liveById: {},
        };
      });

    case "missed":
      return fixture(id, "Missed", () => {
        const primary = session({
          id: "fx-missed",
          slot: "Main",
          modalityLabel: "Hybrid",
          title: "Ski intervals",
          primaryTarget: "1:55–2:00/500m",
          primaryDetail: null,
          duration: "40 min",
          intent: "Short hard pulls",
          status: "missed",
        });
        return {
          selectedId: "d-thu",
          weekDays: weekShell({ "d-thu": [primary] }),
          coachContext: null,
          performanceInsight: null,
          liveById: {},
        };
      });

    case "not-logged":
      return fixture(id, "Not logged", () => {
        const primary = session({
          id: "fx-unresolved",
          slot: "Main",
          modalityLabel: "Strength",
          title: "Upper body density",
          primaryTarget: null,
          primaryDetail: null,
          duration: "35–55 min",
          intent: "Dense EMOM without grinding.",
          status: "unresolved",
          coachNote: "Keep RPE honest.",
        });
        return {
          selectedId: "d-wed",
          weekDays: weekShell({ "d-wed": [primary] }),
          coachContext: null,
          performanceInsight: null,
          liveById: {},
        };
      });

    case "no-session":
      return fixture(id, "No session", () => ({
        selectedId: "d-wed",
        weekDays: weekShell({}),
        coachContext: {
          title: "From your coach",
          body: "Rest day — not labelled Recovery unless the programme says so.",
        },
        performanceInsight: null,
        liveById: {},
      }));

    case "multi-session":
      return fixture(id, "Multi-session", () => {
        const primary = session({
          id: "fx-multi-a",
          slot: "AM",
          title: "Threshold 5s",
          status: "upcoming",
        });
        return {
          selectedId: "d-fri",
          weekDays: weekShell({
            "d-fri": [primary, { ...secondary, status: "upcoming" }],
          }),
          coachContext: null,
          performanceInsight: null,
          liveById: {},
        };
      });

    case "long-copy":
      return fixture(id, "Long copy", () => {
        const primary = session({
          id: "fx-long",
          slot: "Main",
          modalityLabel: "Strength",
          title: "Upper Body Density EMOM Progressive Loading",
          primaryTarget: null,
          primaryDetail:
            "Build upper-body pulling/pushing strength endurance with short, dense EMOM work across the full session block.",
          duration: "35–55 min (incl. warm-up / cool-down)",
          intent:
            "Build upper-body pulling/pushing strength endurance with short, dense EMOM work across the full session block.",
          coachNote:
            "Ideal after gym-based aerobic sessions. Keep transitions tight, but do not chase failure on the last minutes.",
          status: "unresolved",
        });
        return {
          selectedId: "d-sat",
          weekDays: weekShell({
            "d-sat": [
              primary,
              {
                ...secondary,
                id: "fx-long-b",
                title: "Easy aerobic accessory",
                status: "unresolved",
                primaryDetail: "Add aerobic minutes with minimal impact on legs",
              },
            ],
          }),
          coachContext: null,
          performanceInsight: null,
          liveById: {},
        };
      });

    case "coach-note":
      return fixture(id, "Coach note", () => {
        const primary = session({
          id: "fx-coach",
          slot: "Main",
          title: "Threshold 5s",
          status: "upcoming",
          coachNote: "Treat the first rep as a feeler. Match effort on the rest — do not race the clock.",
        });
        return {
          selectedId: "d-fri",
          weekDays: weekShell({ "d-fri": [primary] }),
          coachContext: {
            title: "From your coach",
            body: "Hold threshold controlled this week. Quality over heroics.",
          },
          performanceInsight: null,
          liveById: {},
        };
      });

    case "benchmark-insight":
      return fixture(id, "Benchmark insight", () => {
        const primary = session({
          id: "fx-bench",
          slot: "Main",
          title: "Easy aerobic",
          primaryTarget: "Conversational",
          primaryDetail: null,
          duration: "40 min",
          status: "completed",
        });
        return {
          selectedId: "d-mon",
          weekDays: weekShell({ "d-mon": [primary] }),
          coachContext: null,
          performanceInsight: {
            label: "5K",
            value: "17:55",
            detail: "↓ 7 sec vs previous",
          },
          liveById: {},
        };
      });

    case "repeat-timeline":
      return fixture(id, "Repeat timeline", () => {
        const primary = session({
          id: "fx-timeline",
          slot: "Main",
          title: "Threshold 5s",
          primaryTarget: "3:55 /km",
          primaryDetail: "5 × 5:00 · 1:30 jog",
          duration: "~45 min",
          intent: "Accumulate quality threshold work without chasing the first rep.",
          coachNote: "Treat the first rep as a feeler.",
          status: "upcoming",
        });
        return {
          selectedId: "d-fri",
          weekDays: weekShell({
            "d-fri": [primary, { ...secondary, status: "upcoming" }],
          }),
          coachContext: null,
          performanceInsight: null,
          liveById: {
            "fx-timeline": liveRunStub("fx-timeline", "Threshold 5s"),
          },
        };
      });

    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export function parseHomeDVisualReviewState(
  raw: string | null | undefined
): HomeDVisualReviewStateId {
  if (raw && (HOME_D_VISUAL_REVIEW_STATES as readonly string[]).includes(raw)) {
    return raw as HomeDVisualReviewStateId;
  }
  return "upcoming";
}
