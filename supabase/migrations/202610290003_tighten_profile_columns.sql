-- Tighten profile writes and make the trigger function search path explicit.
revoke update (username, display_name, avatar_emoji) on table public.profiles from authenticated;
grant update (display_name, avatar_emoji) on table public.profiles to authenticated;

create or replace function public.touch_friend_request_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;
