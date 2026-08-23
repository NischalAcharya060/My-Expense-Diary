-- Phase 23.2: Account self-deletion from the Profile page.
-- Security-definer RPC so an authenticated user can delete their own
-- auth.users row. All public tables reference auth.users(id) with
-- ON DELETE CASCADE, so their data is removed automatically.
create or replace function public.delete_own_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
