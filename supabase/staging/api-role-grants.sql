-- Hybrid365 staging: classic Supabase Data API grants. Staging only.
-- hybrid365-staging was created with new tables hidden from the API roles; production predates that
-- and relies on these grants plus RLS. Without them service_role and authenticated get "permission denied".

grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant execute on functions to anon, authenticated, service_role;
