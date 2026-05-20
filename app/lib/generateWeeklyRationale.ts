/**
 * Auto-generate athlete-facing "why this week" copy from draft + athlete context.
 */

import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import type { CoachDraftWeek } from "@/app/lib/hyroxCoachProgrammeDraft";

export function generateWeeklyRationale(athlete: CoachAthlete, draft: CoachDraftWeek): string {
  const lines: string[] = [];

  lines.push(
    `Block ${draft.block} · Week ${draft.week} — ${athlete.blockFocus || athlete.classification}.`
  );

  if (athlete.keyFocus) {
    lines.push(`\nKey focus: ${athlete.keyFocus}`);
  }

  lines.push(`\nMain limiter this block: ${athlete.mainLimiter}.`);
  if (athlete.secondaryLimiter) {
    lines.push(`Secondary: ${athlete.secondaryLimiter}.`);
  }

  const tue = draft.days.find((d) => d.day === "Tue");
  const thu = draft.days.find((d) => d.day === "Thu");
  const sat = draft.days.find((d) => d.day === "Sat");

  const tueTh = tue?.sessions.find(
    (s) => (s.thresholdMinutes ?? 0) > 0 || s.title.toLowerCase().includes("threshold")
  );
  if (tueTh) {
    lines.push(
      `\nTuesday threshold: ${tueTh.title}${tueTh.thresholdMinutes ? ` (${tueTh.thresholdMinutes} min @ threshold)` : ""} — protected as your engine session.`
    );
  } else if (tue && tue.sessions.length > 0) {
    lines.push(`\nTuesday: ${tue.sessions.map((s) => s.title).join(" · ")}.`);
  }

  const thuStrength = thu?.sessions.find(
    (s) =>
      s.sessionType === "strength" ||
      s.title.toLowerCase().includes("strength") ||
      s.title.toLowerCase().includes("hyrox legs") ||
      s.title.toLowerCase().includes("legs")
  );
  if (thuStrength) {
    lines.push(`\nThursday lower strength endurance: ${thuStrength.title} — builds sled, lunge and wall ball durability.`);
  } else if (thu && thu.sessions.length > 0) {
    lines.push(`\nThursday: ${thu.sessions.map((s) => s.title).join(" · ")}.`);
  }

  const satKey = sat?.sessions.find((s) => s.isKeySession && !s.isOptional);
  if (satKey) {
    lines.push(`\nSaturday key session: ${satKey.title} — highest specificity for race demands this week.`);
  } else if (sat && sat.sessions.length > 0) {
    lines.push(`\nSaturday: ${sat.sessions.map((s) => s.title).join(" · ")}.`);
  }

  const weaknesses = athlete.assessment.stationWeaknesses;
  if (weaknesses.length > 0) {
    const stationSessions = draft.days.flatMap((d) =>
      d.sessions.filter((s) => {
        const t = s.title.toLowerCase();
        return weaknesses.some((w) => t.includes(w.toLowerCase().split(" ")[0] ?? w));
      })
    );
    if (stationSessions.length > 0) {
      lines.push(
        `\nStation weakness exposure: ${[...new Set(stationSessions.map((s) => s.title))].slice(0, 3).join(", ")}.`
      );
    } else {
      lines.push(`\nStation priorities: ${weaknesses.join(", ")} — woven into strength and Hyrox sessions.`);
    }
  }

  const deload =
    draft.week === 4 ||
    athlete.programmeInputs.recoveryStatus === "poor" ||
    athlete.recoveryRisk === "high";
  if (deload) {
    lines.push(
      `\nRecovery / deload logic: Volume and intensity are capped this week${athlete.recoveryStatus === "poor" ? " following check-in flags" : " as a planned deload"} — quality over extra work.`
    );
  }

  if (athlete.thingsToAvoid) {
    lines.push(`\nAvoid this week: ${athlete.thingsToAvoid}.`);
  }

  return lines.join("").trim();
}
