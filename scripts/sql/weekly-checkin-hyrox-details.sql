ALTER TABLE public.weekly_check_ins
  ADD COLUMN IF NOT EXISTS hyrox_checkin_details jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.weekly_check_ins.hyrox_checkin_details IS
  'HYROX track reflection scores and notes when training_track = hyrox.';
