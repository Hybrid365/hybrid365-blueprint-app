-- Paid community assessment: training track + HYROX-specific details (Phase 1 — storage only).

ALTER TABLE public.athlete_assessments
  ADD COLUMN IF NOT EXISTS training_track text NOT NULL DEFAULT 'hybrid_performance';

ALTER TABLE public.athlete_assessments
  ADD COLUMN IF NOT EXISTS hyrox_details jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.athlete_assessments.training_track IS
  'Paid community training track: hybrid_performance (default) or hyrox.';

COMMENT ON COLUMN public.athlete_assessments.hyrox_details IS
  'HYROX-specific assessment payload when training_track = hyrox (race context, benchmarks, weaknesses, equipment).';
