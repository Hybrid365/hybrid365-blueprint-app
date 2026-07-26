-- HYROX Team Phase 1: activity-specific session logging lives in
-- hyrox_programme_sessions.athlete_feedback (jsonb) — no column changes required.
--
-- Additive payload shape (dual-read with legacy keys):
-- {
--   "rpe": "...",              -- legacy
--   "notes": "...",            -- legacy
--   "modifications": "...",    -- legacy
--   "score": "...",            -- legacy
--   "loggedAt": "ISO",
--   "schemaVersion": 2,
--   "activityType": "run|strength|bike|row|ski|hyrox|other",
--   "planned": { purpose, estimatedDurationMinutes, targetPace, targetHR, targetRPE, ... },
--   "metrics": { ...activity-specific fields... }
-- }
--
-- Existing clients that only read rpe/notes/modifications/score continue to work.
-- Analytics helpers read metrics + activityType when present.

comment on column public.hyrox_programme_sessions.athlete_feedback is
  'Athlete session log jsonb. Legacy: rpe, notes, modifications, score, loggedAt. V2 additive: schemaVersion, activityType, planned, metrics.';
