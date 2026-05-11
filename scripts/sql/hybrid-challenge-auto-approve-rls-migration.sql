-- Hybrid365 — migrate challenge_submissions RLS for auto-approved submissions (run once if you already applied hybrid-challenge-foundation.sql with old policies).

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
