-- Hybrid365 Milestone 14 — Hybrid Challenge foundation.
-- Run after auth + programme_instances exist. Uses public.set_updated_at() (see daily-habit-logs.sql).

create table if not exists public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  programme_instance_id uuid references public.programme_instances (id) on delete set null,
  challenge_key text not null,
  challenge_week int not null check (challenge_week >= 1 and challenge_week <= 6),
  challenge_title text not null,
  score_value numeric(10, 2),
  score_unit text,
  score_time text,
  proof_url text,
  proof_note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  points_awarded int not null default 0,
  admin_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, challenge_week, challenge_key)
);

create index if not exists challenge_submissions_user_week_idx
  on public.challenge_submissions (user_id, challenge_week);

create index if not exists challenge_submissions_status_idx
  on public.challenge_submissions (status);

create index if not exists challenge_submissions_key_status_idx
  on public.challenge_submissions (challenge_key, status);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'challenge_submissions_updated'
      and tgrelid = 'public.challenge_submissions'::regclass
  ) then
    create trigger challenge_submissions_updated
    before update on public.challenge_submissions
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.challenge_submissions enable row level security;

drop policy if exists "challenge_submissions_select_own" on public.challenge_submissions;
create policy "challenge_submissions_select_own" on public.challenge_submissions
for select using (auth.uid() = user_id);

-- Leaderboard: any authenticated member can read approved rows (points + scores only via RLS).
drop policy if exists "challenge_submissions_select_approved_public" on public.challenge_submissions;
create policy "challenge_submissions_select_approved_public" on public.challenge_submissions
for select using (status = 'approved');

drop policy if exists "challenge_submissions_insert_own" on public.challenge_submissions;
create policy "challenge_submissions_insert_own" on public.challenge_submissions
for insert with check (
  auth.uid() = user_id
  and status = 'approved'
  and points_awarded >= 0
  and points_awarded <= 500
);

drop policy if exists "challenge_submissions_update_own_pending" on public.challenge_submissions;
drop policy if exists "challenge_submissions_update_own" on public.challenge_submissions;
create policy "challenge_submissions_update_own" on public.challenge_submissions
for update
using (auth.uid() = user_id and status in ('pending', 'approved'))
with check (
  auth.uid() = user_id
  and status in ('pending', 'approved')
  and points_awarded >= 0
  and points_awarded <= 500
);
