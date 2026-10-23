/**
 * Home D visual-lab fixture. Demo-labelled. Not a live athlete week.
 * Insight fields follow the B analytics shape only.
 */
import { CONCEPT_ANALYTICS, CONCEPT_FIXTURE, CONCEPT_PROTOTYPE_BANNER } from "./fixture";

export { CONCEPT_PROTOTYPE_BANNER };

export type HomeDModality = "run" | "hyrox" | "strength" | "erg" | "easy";

export type HomeDSession = {
  id: string;
  slot: string;
  modality: HomeDModality;
  modalityLabel: string;
  title: string;
  primaryTarget: string;
  primaryDetail: string;
  duration: string;
  intent: string | null;
  status: "planned" | "completed";
  actual: string | null;
  purpose: string;
  structure: Array<{ kind: "work" | "rest"; label: string; target: string }>;
  prescriptions: Array<{ label: string; value: string; hint: string }>;
  guidance: string[];
};

export type HomeDDay = {
  id: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  dow: string;
  date: number;
  iso: string;
  isToday: boolean;
  coachNote: string | null;
  sessions: HomeDSession[];
};

const THRESHOLD_STRUCTURE: HomeDSession["structure"] = [
  { kind: "work", label: "5 min", target: "3:25" },
  { kind: "rest", label: "90s", target: "jog" },
  { kind: "work", label: "5 min", target: "3:25" },
  { kind: "rest", label: "90s", target: "jog" },
  { kind: "work", label: "5 min", target: "3:25" },
  { kind: "rest", label: "90s", target: "jog" },
  { kind: "work", label: "5 min", target: "3:25" },
  { kind: "rest", label: "90s", target: "jog" },
  { kind: "work", label: "5 min", target: "3:25" },
  { kind: "rest", label: "90s", target: "jog" },
  { kind: "work", label: "5 min", target: "3:25" },
];

export const HOME_D_WEEK: HomeDDay[] = [
  {
    id: "mon",
    dow: "Mon",
    date: 19,
    iso: "2026-10-19",
    isToday: false,
    coachNote: null,
    sessions: [
      {
        id: "mon-easy",
        slot: "AM",
        modality: "easy",
        modalityLabel: "Run",
        title: "Easy run",
        primaryTarget: "60 min",
        primaryDetail: "Z2",
        duration: "60 min",
        intent: "Aerobic base. Keep it conversational.",
        status: "completed",
        actual: "62 min · Z2",
        purpose: "Easy aerobic volume",
        structure: [{ kind: "work", label: "60 min", target: "Z2" }],
        prescriptions: [{ label: "Run", value: "Z2", hint: "easy" }],
        guidance: ["Nasal or conversational", "No surges"],
      },
    ],
  },
  {
    id: "tue",
    dow: "Tue",
    date: 20,
    iso: "2026-10-20",
    isToday: false,
    coachNote: "Demo coach copy — strength after the run. Do not chase the last set.",
    sessions: [
      {
        id: "tue-run",
        slot: "AM",
        modality: "run",
        modalityLabel: "Run",
        title: "Threshold run",
        primaryTarget: "6 × 5 min",
        primaryDetail: "3:25–3:30/km",
        duration: "60 min",
        intent: "Build sustained threshold durability",
        status: "completed",
        actual: "3:28/km",
        purpose: "Hold threshold without fading",
        structure: THRESHOLD_STRUCTURE,
        prescriptions: [{ label: "Run", value: "3:25–3:30/km", hint: "threshold" }],
        guidance: ["Even splits", "Last rep at or faster than first"],
      },
      {
        id: "tue-strength",
        slot: "PM",
        modality: "strength",
        modalityLabel: "Strength",
        title: "Lower strength",
        primaryTarget: "Heavy squat emphasis",
        primaryDetail: "4 × 5 @ 70 kg",
        duration: "55 min",
        intent: null,
        status: "completed",
        actual: "70 kg · 4×5",
        purpose: "Posterior chain under control",
        structure: [{ kind: "work", label: "4 × 5", target: "70 kg" }],
        prescriptions: [{ label: "Strength", value: "70 kg", hint: "back squat 4×5" }],
        guidance: ["Full depth", "Leave one rep"],
      },
    ],
  },
  {
    id: "wed",
    dow: "Wed",
    date: 21,
    iso: "2026-10-21",
    isToday: false,
    coachNote: "Demo coach copy — the day is stacked. Quality over heroics on the last run.",
    sessions: [
      {
        id: "wed-track",
        slot: "AM",
        modality: "run",
        modalityLabel: "Run",
        title: "Track threshold",
        primaryTarget: "5 × 1 km",
        primaryDetail: "3:25/km",
        duration: "50 min",
        intent: "Clean kilometre repeats",
        status: "completed",
        actual: "3:26/km",
        purpose: "Hold 5K race pace",
        structure: CONCEPT_FIXTURE.todaySession.structure.map((step) => ({ ...step })),
        prescriptions: [{ label: "Run", value: "3:25/km", hint: "5K pace" }],
        guidance: ["Even splits", "Jog recoveries"],
      },
      {
        id: "wed-sled",
        slot: "MIDDAY",
        modality: "strength",
        modalityLabel: "Strength",
        title: "Heavy sled",
        primaryTarget: "Push / pull",
        primaryDetail: "6 × 20 m",
        duration: "40 min",
        intent: null,
        status: "completed",
        actual: "6 × 20 m",
        purpose: "Station force without wrecking the run",
        structure: [{ kind: "work", label: "20 m", target: "heavy" }],
        prescriptions: [{ label: "Sled", value: "6 × 20 m", hint: "heavy" }],
        guidance: ["Short rest", "Stay tall"],
      },
      {
        id: "wed-hyrox",
        slot: "PM",
        modality: "hyrox",
        modalityLabel: "HYROX",
        title: "Compromised run",
        primaryTarget: "4 rounds",
        primaryDetail: "1 km + station",
        duration: "50 min",
        intent: "Run off the station, not through it",
        status: "completed",
        actual: "4 rounds",
        purpose: "Station to run transition",
        structure: [
          { kind: "work", label: "1 km", target: "3:50" },
          { kind: "work", label: "station", target: "controlled" },
        ],
        prescriptions: [{ label: "Run", value: "3:50/km", hint: "compromised" }],
        guidance: ["Settle in 200 m", "Do not redline the station"],
      },
    ],
  },
  {
    id: "thu",
    dow: "Thu",
    date: 22,
    iso: "2026-10-22",
    isToday: false,
    coachNote: null,
    sessions: [
      {
        id: "thu-easy",
        slot: "AM",
        modality: "easy",
        modalityLabel: "Run",
        title: "Easy run",
        primaryTarget: "50 min",
        primaryDetail: "Z2",
        duration: "50 min",
        intent: "Absorb yesterday. Stay easy.",
        status: "completed",
        actual: "51 min · Z2",
        purpose: "Recovery aerobic",
        structure: [{ kind: "work", label: "50 min", target: "Z2" }],
        prescriptions: [{ label: "Run", value: "Z2", hint: "easy" }],
        guidance: ["Conversational only"],
      },
    ],
  },
  {
    id: "fri",
    dow: "Fri",
    date: 23,
    iso: "2026-10-23",
    isToday: true,
    coachNote:
      "Keep the first two reps controlled today. The quality is in the final 3–4 reps.",
    sessions: [
      {
        id: "fri-threshold",
        slot: "AM",
        modality: "run",
        modalityLabel: "Run",
        title: "Threshold intervals",
        primaryTarget: "6 × 5 min",
        primaryDetail: "3:25–3:30/km",
        duration: "60 min",
        intent: "Build sustained threshold durability",
        status: "planned",
        actual: null,
        purpose: "Hold threshold without fading",
        structure: THRESHOLD_STRUCTURE,
        prescriptions: [{ label: "Run", value: "3:25–3:30/km", hint: "threshold" }],
        guidance: ["Even splits", "Last rep at or faster than first", "Jog recoveries"],
      },
      {
        id: "fri-ski",
        slot: "PM",
        modality: "erg",
        modalityLabel: "Erg",
        title: "SkiErg threshold",
        primaryTarget: "5 × 5 min",
        primaryDetail: "1:48/500m",
        duration: "40 min",
        intent: null,
        status: "planned",
        actual: null,
        purpose: "Upper-body threshold without dumping the run",
        structure: [
          { kind: "work", label: "5 min", target: "1:48" },
          { kind: "rest", label: "90s", target: "easy" },
        ],
        prescriptions: [{ label: "Ski split", value: "1:48/500m", hint: "threshold" }],
        guidance: ["Long pulls", "Do not spike the first minute"],
      },
    ],
  },
  {
    id: "sat",
    dow: "Sat",
    date: 24,
    iso: "2026-10-24",
    isToday: false,
    coachNote: null,
    sessions: [],
  },
  {
    id: "sun",
    dow: "Sun",
    date: 25,
    iso: "2026-10-25",
    isToday: false,
    coachNote: "Demo coach copy — keep the run honest after each station.",
    sessions: [
      {
        id: "sun-hyrox",
        slot: "AM",
        modality: "hyrox",
        modalityLabel: "HYROX",
        title: "Compromised run",
        primaryTarget: "4 rounds",
        primaryDetail: "1 km + station",
        duration: "55 min",
        intent: "Race-specific density",
        status: "planned",
        actual: null,
        purpose: "Station to run under control",
        structure: [
          { kind: "work", label: "1 km", target: "3:50" },
          { kind: "work", label: "station", target: "controlled" },
        ],
        prescriptions: [{ label: "Run", value: "3:50/km", hint: "compromised" }],
        guidance: ["Settle the first 200 m"],
      },
    ],
  },
];

const current = CONCEPT_ANALYTICS.currentWeek;
const previous = CONCEPT_ANALYTICS.previousWeek;
const fiveK = CONCEPT_ANALYTICS.benchmarks[0];
const first = fiveK.points[0];
const latest = fiveK.points[fiveK.points.length - 1];
const fiveKDeltaSec =
  first && latest ? Math.round(first.normalizedValue - latest.normalizedValue) : null;
const runDelta =
  current.runDistanceKm != null && previous?.runDistanceKm != null
    ? current.runDistanceKm - previous.runDistanceKm
    : null;

export const HOME_D_INSIGHTS = {
  athleteName: CONCEPT_FIXTURE.athleteName,
  coachName: "Kieran",
  weekLabel: CONCEPT_FIXTURE.weekLabel,
  runKm: current.runDistanceKm,
  runDeltaKm: runDelta,
  durationMinutes: current.trainingDurationMinutes,
  completedSessions: current.completedSessions,
  plannedSessions: current.plannedSessions,
  completionPct: current.completionPct,
  runSeries: [...CONCEPT_FIXTURE.rolling4.runKm],
  runSeriesLabels: ["W3", "W4", "W5", "W6"],
  fiveK: latest?.display ?? null,
  fiveKDeltaSec,
  fiveKSpan: first && latest ? `${first.display} → ${latest.display}` : null,
} as const;

export const HOME_D_NAV = [
  { id: "home", label: "Home" },
  { id: "programme", label: "Programme" },
  { id: "progress", label: "Progress" },
  { id: "performance", label: "Performance" },
  { id: "more", label: "More" },
] as const;
