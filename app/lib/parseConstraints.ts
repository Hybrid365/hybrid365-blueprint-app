export type ParsedConstraints = {
  raw: string;
  has_constraints: boolean;
  flags: string[];
  summary: string[];
  guidance: string[];
  unmatched_text: string;
  no_running_days: string[];
};

const DAY_MAP: Array<{ name: string; short: string }> = [
  { name: "monday", short: "Mon" },
  { name: "tuesday", short: "Tue" },
  { name: "wednesday", short: "Wed" },
  { name: "thursday", short: "Thu" },
  { name: "friday", short: "Fri" },
  { name: "saturday", short: "Sat" },
  { name: "sunday", short: "Sun" },
];

/** Matches any time-limit cue; phrases ordered with longer/bracketed variants before shorter ones where relevant. */
const TIME_LIMIT_REGEX = new RegExp(
  [
    "short\\s+on\\s+time",
    "limited\\s+time",
    "tight\\s+on\\s+time",
    "max(?:imum)?\\s+45\\s*(?:mins?|minutes)",
    "under\\s+45\\s*(?:mins?|minutes)",
    "only\\s+(?:30|45)\\s*(?:mins?|minutes)",
    "keep\\s+sessions\\s+short",
    "shorter\\s+sessions",
    "short\\s+sessions",
    "time\\s+poor",
    "busy\\s+schedule",
    "limited\\s+availability",
    "\\b(?:30|40)\\s*(?:mins?|minutes)\\b",
    "under\\s+an\\s+hour",
  ].join("|"),
  "i"
);

const TIME_LIMIT_STRIP_REGEX = new RegExp(TIME_LIMIT_REGEX.source, "gi");

/** Equipment limitation cues (longer / more specific fragments first). */
const EQUIP_LIMIT_REGEX = new RegExp(
  [
    "no\\s+access\\s+to\\s+(?:rower|rowing\\s+machine|ski\\s*erg|skierg)",
    "do\\s+not\\s+have\\s+(?:a\\s+)?(?:rower|ski(?:\\s+erg)?|skierg)",
    "don[''\\u2019]t\\s+have\\s+(?:a\\s+)?(?:rower|ski(?:\\s+erg)?|skierg)",
    "don[''\\u2019]t\\s+have\\s+ski",
    "do\\s+not\\s+have\\s+ski",
    "no\\s+rowing\\s+machine",
    "no\\s+rower",
    "no\\s+ski\\s+erg",
    "no\\s+skierg",
    "\\bno\\s+ski\\b",
    "no\\s+bike",
    "no\\s+treadmill",
    "no\\s+sled",
    "no\\s+wall\\s+balls?",
    "no\\s+dumbbells?",
    "no\\s+gym",
    "dumbbells\\s+only",
    "db\\s+only",
    "bodyweight\\s+only",
    "home\\s+gym",
    "limited\\s+equipment",
    "equipment\\s+limited",
  ].join("|"),
  "i"
);

const EQUIP_LIMIT_STRIP_REGEX = new RegExp(EQUIP_LIMIT_REGEX.source, "gi");

export function parseConstraints(notes?: string): ParsedConstraints {
  const raw = (notes ?? "").trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, " ").trim();

  const flags: string[] = [];
  const summary: string[] = [];
  const guidance: string[] = [];
  const noRunningDays: string[] = [];
  const stripPatterns: RegExp[] = [];

  if (!normalized) {
    return {
      raw: "",
      has_constraints: false,
      flags,
      summary,
      guidance,
      unmatched_text: "",
      no_running_days: noRunningDays,
    };
  }

  const injuryRegex =
    /\b(knees?|shin|shins?|achilles|ankle|calf|calves|hamstring|hip|back|shoulder|pain|injury|injured|niggle)\b/i;
  if (injuryRegex.test(normalized)) {
    flags.push("injury_flags");
    summary.push("Possible injury or pain-related limitation mentioned.");
    guidance.push("Keep intensity and exercise choice conservative around painful areas.");
    stripPatterns.push(new RegExp(injuryRegex.source, "gi"));
  }

  const lowImpactRegex =
    /(low impact|no impact|avoid impact|impact sensitive|joint pain)/i;
  if (lowImpactRegex.test(normalized)) {
    flags.push("low_impact_preference");
    summary.push("Low-impact preference detected.");
    guidance.push(
      "Prioritise low-impact conditioning options and avoid unnecessary pounding."
    );
    stripPatterns.push(new RegExp(lowImpactRegex.source, "gi"));
  }

  if (TIME_LIMIT_REGEX.test(normalized)) {
    flags.push("time_limit");
    summary.push("Time limitation detected.");
    guidance.push("Prioritise the main work and keep sessions time-efficient.");
    stripPatterns.push(TIME_LIMIT_STRIP_REGEX);
  }

  if (EQUIP_LIMIT_REGEX.test(normalized)) {
    flags.push("equipment_limits");
    summary.push("Equipment limitation detected.");
    guidance.push("Use adaptable sessions that match available equipment.");
    stripPatterns.push(EQUIP_LIMIT_STRIP_REGEX);
  }

  for (const day of DAY_MAP) {
    const dayPattern = new RegExp(
      `(?:no\\s+running|can't\\s+run|cannot\\s+run|avoid\\s+running)\\s+${day.name}\\b`,
      "i"
    );
    if (dayPattern.test(normalized)) {
      noRunningDays.push(day.short);
      stripPatterns.push(new RegExp(dayPattern.source, "gi"));
    }
  }

  if (noRunningDays.length > 0) {
    flags.push("no_running_days");
    summary.push(`No-running days detected: ${noRunningDays.join(", ")}.`);
    guidance.push(
      "Place run sessions on available days and use non-run alternatives where needed."
    );
  }

  let unmatchedText = normalized;
  for (const pattern of stripPatterns) {
    unmatchedText = unmatchedText.replace(pattern, " ");
  }
  unmatchedText = unmatchedText.replace(/\s+/g, " ").trim();

  return {
    raw,
    has_constraints: flags.length > 0,
    flags,
    summary,
    guidance,
    unmatched_text: unmatchedText,
    no_running_days: noRunningDays,
  };
}
