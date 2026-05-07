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

export function parseConstraints(notes?: string): ParsedConstraints {
  const raw = (notes ?? "").trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, " ").trim();

  const flags: string[] = [];
  const summary: string[] = [];
  const guidance: string[] = [];
  const noRunningDays: string[] = [];
  const matchedPhrases: string[] = [];

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

  const injuryRegex = /\b(knee|shin|achilles|ankle|calf|hamstring|hip|back|shoulder|pain|injury|injured|niggle)\b/i;
  if (injuryRegex.test(normalized)) {
    flags.push("injury_flags");
    summary.push("Possible injury or pain-related limitation mentioned.");
    guidance.push("Keep intensity and exercise choice conservative around painful areas.");
    matchedPhrases.push("injury");
  }

  const lowImpactRegex = /(low impact|no impact|avoid impact|impact sensitive|joint pain)/i;
  if (lowImpactRegex.test(normalized)) {
    flags.push("low_impact_preference");
    summary.push("Low-impact preference detected.");
    guidance.push("Prioritise low-impact conditioning options and avoid unnecessary pounding.");
    matchedPhrases.push("impact");
  }

  const timeLimitRegex = /(limited time|short sessions|30 min|30 minutes|40 min|40 minutes|under an hour|busy schedule)/i;
  if (timeLimitRegex.test(normalized)) {
    flags.push("time_limit");
    summary.push("Time limitation detected.");
    guidance.push("Bias toward concise, high-value sessions that fit limited training windows.");
    matchedPhrases.push("time");
  }

  const equipmentLimitRegex = /(no gym|dumbbells only|db only|bodyweight only|no treadmill|no sled|home gym)/i;
  if (equipmentLimitRegex.test(normalized)) {
    flags.push("equipment_limits");
    summary.push("Equipment limitation detected.");
    guidance.push("Use adaptable sessions that match available equipment.");
    matchedPhrases.push("equipment");
  }

  for (const day of DAY_MAP) {
    const dayPattern = new RegExp(
      `(?:no\\s+running|can't\\s+run|cannot\\s+run|avoid\\s+running)\\s+${day.name}`,
      "i"
    );
    if (dayPattern.test(normalized)) {
      noRunningDays.push(day.short);
      matchedPhrases.push(`${day.name} running`);
    }
  }

  if (noRunningDays.length > 0) {
    flags.push("no_running_days");
    summary.push(`No-running days detected: ${noRunningDays.join(", ")}.`);
    guidance.push("Place run sessions on available days and use non-run alternatives where needed.");
  }

  let unmatchedText = normalized;
  for (const phrase of matchedPhrases) {
    unmatchedText = unmatchedText.replace(new RegExp(phrase, "gi"), " ");
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
