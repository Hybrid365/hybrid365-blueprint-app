-- Current weekly running volume band for paid programme generation.
alter table public.athlete_assessments
  add column if not exists current_run_volume_band text;

comment on column public.athlete_assessments.current_run_volume_band is
  'Athlete-reported weekly run volume band (e.g. 35-50km/week) for conservative mileage progression.';
