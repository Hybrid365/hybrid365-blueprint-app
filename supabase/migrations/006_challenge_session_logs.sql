-- Hybrid 75 free challenge session logs

create table if not exists public.challenge_session_logs (
  id uuid primary key default gen_random_uuid(),
  plan_id text not null,
  email text,
  name text,
  session_id text not null,
  session_title text not null,
  session_type text not null check (session_type in ('run', 'lift', 'mobility', 'challenge')),
  completed boolean not null default false,
  rpe int check (rpe >= 1 and rpe <= 10),
  proof_type text not null default 'not_yet' check (
    proof_type in ('telegram', 'instagram', 'both', 'not_yet')
  ),
  proof_note text,
  notes text,
  points_claimed int not null default 0 check (points_claimed >= 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, session_id)
);

create index if not exists challenge_session_logs_plan_id_idx
  on public.challenge_session_logs (plan_id);

create index if not exists challenge_session_logs_status_idx
  on public.challenge_session_logs (status);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'challenge_session_logs_updated'
      and tgrelid = 'public.challenge_session_logs'::regclass
  ) then
    create trigger challenge_session_logs_updated
    before update on public.challenge_session_logs
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.challenge_session_logs enable row level security;
