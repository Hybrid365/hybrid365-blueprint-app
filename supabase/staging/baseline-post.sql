-- Hybrid365 staging baseline (post: after migration 020). Generated from production pg_catalog; structure only, no rows.
-- Staging only. Never apply to production. Regenerate with scripts/staging/dump-production-schema.mjs.
-- Server 17.6. Base tables: athlete_assessments, benchmark_tests, challenge_submissions, daily_habit_logs, memberships, pending_whop_memberships, profiles, programme_instances, programme_weeks, weekly_check_ins.

set check_function_bodies = off;

do $$ begin
  alter table public.athlete_assessments add constraint athlete_assessments_programme_instance_id_fkey FOREIGN KEY (programme_instance_id) REFERENCES programme_instances(id) ON DELETE SET NULL;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.athlete_assessments add constraint athlete_assessments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.benchmark_tests add constraint benchmark_tests_programme_instance_id_fkey FOREIGN KEY (programme_instance_id) REFERENCES programme_instances(id) ON DELETE CASCADE;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.benchmark_tests add constraint benchmark_tests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.challenge_submissions add constraint challenge_submissions_programme_instance_id_fkey FOREIGN KEY (programme_instance_id) REFERENCES programme_instances(id) ON DELETE SET NULL;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.challenge_submissions add constraint challenge_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.daily_habit_logs add constraint daily_habit_logs_programme_instance_id_fkey FOREIGN KEY (programme_instance_id) REFERENCES programme_instances(id) ON DELETE SET NULL;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.daily_habit_logs add constraint daily_habit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.memberships add constraint memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.pending_whop_memberships add constraint pending_whop_memberships_claimed_user_id_fkey FOREIGN KEY (claimed_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.programme_instances add constraint programme_instances_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.programme_weeks add constraint programme_weeks_programme_instance_id_fkey FOREIGN KEY (programme_instance_id) REFERENCES programme_instances(id) ON DELETE CASCADE;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.weekly_check_ins add constraint weekly_check_ins_programme_instance_id_fkey FOREIGN KEY (programme_instance_id) REFERENCES programme_instances(id) ON DELETE CASCADE;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.weekly_check_ins add constraint weekly_check_ins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
exception when duplicate_object then null;
end $$;
CREATE INDEX IF NOT EXISTS benchmark_tests_programme_week_idx ON public.benchmark_tests USING btree (programme_instance_id, week_number);
CREATE INDEX IF NOT EXISTS benchmark_tests_user_type_idx ON public.benchmark_tests USING btree (user_id, test_type, tested_at DESC);
CREATE INDEX IF NOT EXISTS challenge_submissions_key_status_idx ON public.challenge_submissions USING btree (challenge_key, status);
CREATE INDEX IF NOT EXISTS challenge_submissions_status_idx ON public.challenge_submissions USING btree (status);
CREATE INDEX IF NOT EXISTS challenge_submissions_user_week_idx ON public.challenge_submissions USING btree (user_id, challenge_week);
CREATE UNIQUE INDEX IF NOT EXISTS pending_whop_memberships_last_whop_event_id_key ON public.pending_whop_memberships USING btree (last_whop_event_id) WHERE (last_whop_event_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS pending_whop_memberships_unclaimed_email_idx ON public.pending_whop_memberships USING btree (email) WHERE (claimed_at IS NULL);
CREATE INDEX IF NOT EXISTS programme_instances_unlock_at_idx ON public.programme_instances USING btree (unlock_at) WHERE (unlock_at IS NOT NULL);
alter table public.athlete_assessments enable row level security;
alter table public.benchmark_tests enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.daily_habit_logs enable row level security;
alter table public.memberships enable row level security;
alter table public.pending_whop_memberships enable row level security;
alter table public.profiles enable row level security;
alter table public.programme_instances enable row level security;
alter table public.programme_weeks enable row level security;
alter table public.weekly_check_ins enable row level security;
drop policy if exists athlete_assessments_insert_own on public.athlete_assessments;
create policy athlete_assessments_insert_own on public.athlete_assessments
  as permissive for insert to public
  with check ((auth.uid() = user_id));
drop policy if exists athlete_assessments_select_own on public.athlete_assessments;
create policy athlete_assessments_select_own on public.athlete_assessments
  as permissive for select to public
  using ((auth.uid() = user_id));
drop policy if exists athlete_assessments_update_own on public.athlete_assessments;
create policy athlete_assessments_update_own on public.athlete_assessments
  as permissive for update to public
  using ((auth.uid() = user_id));
drop policy if exists benchmark_tests_insert_own on public.benchmark_tests;
create policy benchmark_tests_insert_own on public.benchmark_tests
  as permissive for insert to public
  with check ((auth.uid() = user_id));
drop policy if exists benchmark_tests_select_own on public.benchmark_tests;
create policy benchmark_tests_select_own on public.benchmark_tests
  as permissive for select to public
  using ((auth.uid() = user_id));
drop policy if exists benchmark_tests_update_own on public.benchmark_tests;
create policy benchmark_tests_update_own on public.benchmark_tests
  as permissive for update to public
  using ((auth.uid() = user_id));
drop policy if exists challenge_submissions_insert_own on public.challenge_submissions;
create policy challenge_submissions_insert_own on public.challenge_submissions
  as permissive for insert to public
  with check (((auth.uid() = user_id) AND (status = 'approved'::text) AND (points_awarded = 25)));
drop policy if exists challenge_submissions_select_approved_public on public.challenge_submissions;
create policy challenge_submissions_select_approved_public on public.challenge_submissions
  as permissive for select to public
  using ((status = 'approved'::text));
drop policy if exists challenge_submissions_select_own on public.challenge_submissions;
create policy challenge_submissions_select_own on public.challenge_submissions
  as permissive for select to public
  using ((auth.uid() = user_id));
drop policy if exists challenge_submissions_update_own on public.challenge_submissions;
create policy challenge_submissions_update_own on public.challenge_submissions
  as permissive for update to public
  using (((auth.uid() = user_id) AND (status = ANY (ARRAY['approved'::text, 'pending'::text]))))
  with check (((auth.uid() = user_id) AND (status = 'approved'::text) AND (points_awarded = 25)));
drop policy if exists daily_habit_logs_insert_own on public.daily_habit_logs;
create policy daily_habit_logs_insert_own on public.daily_habit_logs
  as permissive for insert to public
  with check ((auth.uid() = user_id));
drop policy if exists daily_habit_logs_select_own on public.daily_habit_logs;
create policy daily_habit_logs_select_own on public.daily_habit_logs
  as permissive for select to public
  using ((auth.uid() = user_id));
drop policy if exists daily_habit_logs_update_own on public.daily_habit_logs;
create policy daily_habit_logs_update_own on public.daily_habit_logs
  as permissive for update to public
  using ((auth.uid() = user_id));
drop policy if exists memberships_select_own on public.memberships;
create policy memberships_select_own on public.memberships
  as permissive for select to public
  using ((auth.uid() = user_id));
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  as permissive for select to public
  using ((auth.uid() = id));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  as permissive for update to public
  using ((auth.uid() = id));
drop policy if exists programme_instances_insert_own on public.programme_instances;
create policy programme_instances_insert_own on public.programme_instances
  as permissive for insert to public
  with check ((auth.uid() = user_id));
drop policy if exists programme_instances_select_own on public.programme_instances;
create policy programme_instances_select_own on public.programme_instances
  as permissive for select to public
  using ((auth.uid() = user_id));
drop policy if exists programme_instances_update_own on public.programme_instances;
create policy programme_instances_update_own on public.programme_instances
  as permissive for update to public
  using ((auth.uid() = user_id));
drop policy if exists programme_weeks_insert_own on public.programme_weeks;
create policy programme_weeks_insert_own on public.programme_weeks
  as permissive for insert to public
  with check ((EXISTS ( SELECT 1
   FROM programme_instances p
  WHERE ((p.id = programme_weeks.programme_instance_id) AND (p.user_id = auth.uid())))));
drop policy if exists programme_weeks_select_own on public.programme_weeks;
create policy programme_weeks_select_own on public.programme_weeks
  as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM programme_instances p
  WHERE ((p.id = programme_weeks.programme_instance_id) AND (p.user_id = auth.uid())))));
drop policy if exists programme_weeks_update_own on public.programme_weeks;
create policy programme_weeks_update_own on public.programme_weeks
  as permissive for update to public
  using ((EXISTS ( SELECT 1
   FROM programme_instances p
  WHERE ((p.id = programme_weeks.programme_instance_id) AND (p.user_id = auth.uid())))))
  with check ((EXISTS ( SELECT 1
   FROM programme_instances p
  WHERE ((p.id = programme_weeks.programme_instance_id) AND (p.user_id = auth.uid())))));
drop policy if exists weekly_check_ins_insert_own on public.weekly_check_ins;
create policy weekly_check_ins_insert_own on public.weekly_check_ins
  as permissive for insert to public
  with check ((auth.uid() = user_id));
drop policy if exists weekly_check_ins_select_own on public.weekly_check_ins;
create policy weekly_check_ins_select_own on public.weekly_check_ins
  as permissive for select to public
  using ((auth.uid() = user_id));
drop policy if exists weekly_check_ins_update_own on public.weekly_check_ins;
create policy weekly_check_ins_update_own on public.weekly_check_ins
  as permissive for update to public
  using ((auth.uid() = user_id));
drop trigger if exists on_auth_user_created on auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
drop trigger if exists athlete_assessments_updated on public.athlete_assessments;
CREATE TRIGGER athlete_assessments_updated BEFORE UPDATE ON athlete_assessments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
drop trigger if exists benchmark_tests_updated on public.benchmark_tests;
CREATE TRIGGER benchmark_tests_updated BEFORE UPDATE ON benchmark_tests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
drop trigger if exists challenge_submissions_updated on public.challenge_submissions;
CREATE TRIGGER challenge_submissions_updated BEFORE UPDATE ON challenge_submissions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
drop trigger if exists daily_habit_logs_updated on public.daily_habit_logs;
CREATE TRIGGER daily_habit_logs_updated BEFORE UPDATE ON daily_habit_logs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
drop trigger if exists memberships_updated on public.memberships;
CREATE TRIGGER memberships_updated BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION set_updated_at();
drop trigger if exists profiles_updated on public.profiles;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
drop trigger if exists weekly_check_ins_updated on public.weekly_check_ins;
CREATE TRIGGER weekly_check_ins_updated BEFORE UPDATE ON weekly_check_ins FOR EACH ROW EXECUTE FUNCTION set_updated_at();
