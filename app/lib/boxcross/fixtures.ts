/**
 * Development-only fixtures for BoxCross Ski Challenge.
 * NEVER imported by production public API routes.
 */

import type { BoxCrossSkiAttempt, BoxCrossSkiChallenge } from "./types";

export const BOXCROSS_DEV_CHALLENGE_FIXTURE: BoxCrossSkiChallenge = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "BOXCROSS 1KM SKI CHALLENGE",
  slug: "boxcross-1km-ski-challenge",
  start_date: "2026-07-28T00:00:00.000+01:00",
  end_date: "2026-08-26T23:59:59.000+01:00",
  status: "active",
  male_prize: "£100 Bulk Nutrition",
  female_prize: "£100 Bulk Nutrition",
  video_url: null,
  created_at: "2026-07-28T00:00:00.000Z",
  updated_at: "2026-07-28T00:00:00.000Z",
};

/** Seed-shaped attempts for local QA / Storybook-style checks only. */
export const BOXCROSS_DEV_ATTEMPT_FIXTURES: BoxCrossSkiAttempt[] = [
  {
    id: "dev-1",
    challenge_id: BOXCROSS_DEV_CHALLENGE_FIXTURE.id,
    athlete_name: "Alex Example",
    category: "male",
    time_ms: 222600,
    attempted_at: "2026-07-29T12:00:00.000Z",
    verification_method: "staff_witnessed",
    verified: true,
    verified_by: "Coach Dev",
    proof_url: null,
    witness_name: "Coach Dev",
    internal_notes: "DEV FIXTURE ONLY — do not use in production",
    created_by: "dev",
    created_at: "2026-07-29T12:05:00.000Z",
    updated_at: "2026-07-29T12:05:00.000Z",
  },
  {
    id: "dev-2",
    challenge_id: BOXCROSS_DEV_CHALLENGE_FIXTURE.id,
    athlete_name: "Sam Example",
    category: "female",
    time_ms: 248300,
    attempted_at: "2026-07-30T10:00:00.000Z",
    verification_method: "full_video",
    verified: true,
    verified_by: "Coach Dev",
    proof_url: "https://example.com/proof",
    witness_name: null,
    internal_notes: "DEV FIXTURE ONLY",
    created_by: "dev",
    created_at: "2026-07-30T10:05:00.000Z",
    updated_at: "2026-07-30T10:05:00.000Z",
  },
];
