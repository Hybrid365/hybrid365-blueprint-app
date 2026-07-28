/**
 * BoxCross Ski Challenge — pure leaderboard logic (no DB).
 */

import { formatSkiTime, normalizeAthleteKey } from "./time";
import type {
  BoxCrossLeaderboardPayload,
  BoxCrossLeaderboardRow,
  BoxCrossLeaderboardTab,
  BoxCrossPublicAttempt,
  BoxCrossSkiAttempt,
  BoxCrossSkiChallenge,
} from "./types";

export function isChallengeFinal(
  challenge: Pick<BoxCrossSkiChallenge, "status" | "end_date">,
  now = new Date()
): boolean {
  if (challenge.status === "final" || challenge.status === "archived") return true;
  return now.getTime() > new Date(challenge.end_date).getTime();
}

export function challengeAcceptsEntries(
  challenge: Pick<BoxCrossSkiChallenge, "status" | "start_date" | "end_date">,
  now = new Date()
): boolean {
  if (challenge.status === "final" || challenge.status === "archived") return false;
  const t = now.getTime();
  return t >= new Date(challenge.start_date).getTime() && t <= new Date(challenge.end_date).getTime();
}

export function toPublicAttempt(attempt: BoxCrossSkiAttempt): BoxCrossPublicAttempt | null {
  if (!attempt.verified) return null;
  return {
    id: attempt.id,
    athlete_name: attempt.athlete_name.trim(),
    category: attempt.category,
    time_ms: attempt.time_ms,
    time_display: formatSkiTime(attempt.time_ms),
    attempted_at: attempt.attempted_at,
    verification_method: attempt.verification_method,
    verified: true,
    witness_name: attempt.witness_name,
    has_proof: Boolean(attempt.proof_url?.trim()),
  };
}

/**
 * Public board: one row per athlete — their fastest verified attempt.
 * Ranked purely by time ascending.
 */
export function buildBestAttempts(
  attempts: BoxCrossSkiAttempt[],
  tab: BoxCrossLeaderboardTab = "overall"
): BoxCrossPublicAttempt[] {
  const verified = attempts
    .map(toPublicAttempt)
    .filter((a): a is BoxCrossPublicAttempt => a != null);

  const filtered =
    tab === "overall"
      ? verified
      : verified.filter((a) => a.category === tab);

  const bestByAthlete = new Map<string, BoxCrossPublicAttempt>();
  for (const row of filtered) {
    const key = `${normalizeAthleteKey(row.athlete_name)}::${row.category}`;
    const existing = bestByAthlete.get(key);
    if (!existing || row.time_ms < existing.time_ms) {
      bestByAthlete.set(key, row);
    } else if (
      existing &&
      row.time_ms === existing.time_ms &&
      new Date(row.attempted_at).getTime() < new Date(existing.attempted_at).getTime()
    ) {
      // Prefer earlier attempt on exact tie for stability
      bestByAthlete.set(key, row);
    }
  }

  return Array.from(bestByAthlete.values()).sort((a, b) => {
    if (a.time_ms !== b.time_ms) return a.time_ms - b.time_ms;
    return new Date(a.attempted_at).getTime() - new Date(b.attempted_at).getTime();
  });
}

export function rankAttempts(
  best: BoxCrossPublicAttempt[],
  allVerified: BoxCrossSkiAttempt[]
): BoxCrossLeaderboardRow[] {
  const newestId = [...allVerified]
    .filter((a) => a.verified)
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime() ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]?.id;

  const overallBest = buildBestAttempts(allVerified, "overall");
  const maleLeaderId = overallBest.find((r) => r.category === "male")?.id ?? null;
  const femaleLeaderId = overallBest.find((r) => r.category === "female")?.id ?? null;

  return best.map((row, index) => ({
    ...row,
    rank: index + 1,
    isNewest: row.id === newestId,
    isMaleLeader: row.id === maleLeaderId,
    isFemaleLeader: row.id === femaleLeaderId,
  }));
}

export function buildLeaderboardPayload(
  challenge: BoxCrossSkiChallenge,
  attempts: BoxCrossSkiAttempt[],
  tab: BoxCrossLeaderboardTab = "overall",
  now = new Date()
): BoxCrossLeaderboardPayload {
  const final = isChallengeFinal(challenge, now);
  const best = buildBestAttempts(attempts, tab);
  const rows = rankAttempts(best, attempts);
  const overall = rankAttempts(buildBestAttempts(attempts, "overall"), attempts);

  const lastUpdated = attempts.reduce<string | null>((acc, a) => {
    if (!a.verified) return acc;
    if (!acc) return a.updated_at;
    return new Date(a.updated_at) > new Date(acc) ? a.updated_at : acc;
  }, null);

  return {
    challenge: {
      id: challenge.id,
      title: challenge.title,
      slug: challenge.slug,
      start_date: challenge.start_date,
      end_date: challenge.end_date,
      status: final && challenge.status === "active" ? "final" : challenge.status,
      male_prize: challenge.male_prize,
      female_prize: challenge.female_prize,
      video_url: challenge.video_url,
      is_final: final,
      accepts_entries: challengeAcceptsEntries(challenge, now) && !final,
    },
    rows,
    stats: {
      total_verified_attempts: attempts.filter((a) => a.verified).length,
      unique_athletes: overall.length,
      fastest_overall: overall[0] ?? null,
      male_leader: overall.find((r) => r.category === "male") ?? null,
      female_leader: overall.find((r) => r.category === "female") ?? null,
      last_updated: lastUpdated,
    },
    generated_at: now.toISOString(),
  };
}
