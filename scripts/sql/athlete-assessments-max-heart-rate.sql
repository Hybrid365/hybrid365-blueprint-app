-- Optional max HR for individualised run prescription (pace + HR zones).
-- Run in Supabase SQL editor when deploying run-prescription feature.

ALTER TABLE athlete_assessments
  ADD COLUMN IF NOT EXISTS max_heart_rate integer;

COMMENT ON COLUMN athlete_assessments.max_heart_rate IS
  'Athlete-reported max heart rate (bpm). Optional; used for HR zone guidance on run sessions.';
