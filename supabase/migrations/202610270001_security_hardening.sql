-- JS-Duo security hardening. Safe to re-run after the online foundation migration.

-- Friend requests: participants may only transition a pending request to a valid terminal state.
drop policy if exists "Recipients can respond to friend requests" on public.friend_requests;
create policy "Recipients can respond to friend requests" on public.friend_requests
  for update to authenticated
  using (status = 'pending' and (auth.uid() = receiver_id or auth.uid() = sender_id))
  with check (
    (auth.uid() = receiver_id and status in ('accepted', 'declined'))
    or (auth.uid() = sender_id and status = 'cancelled')
  );

create or replace function public.touch_friend_request_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists friend_requests_touch_updated_at on public.friend_requests;
create trigger friend_requests_touch_updated_at
  before update on public.friend_requests
  for each row execute function public.touch_friend_request_updated_at();

-- Clients must not edit duel scores, winners, participants, or final states.
drop policy if exists "Duel participants can update duels" on public.duels;
revoke update on public.duels from authenticated;

-- Restrict profile writes to user-editable fields.
revoke update on public.profiles from authenticated;
grant update (username, display_name, avatar_emoji) on public.profiles to authenticated;

-- RLS keeps the raw progress row private. This view exposes only intended leaderboard fields.
create or replace view public.leaderboard_public with (security_invoker = false) as
select
  p.id,
  p.username,
  p.display_name,
  p.avatar_emoji,
  case when coalesce(up.stats ->> 'xp', '') ~ '^[0-9]{1,9}$'
    then (up.stats ->> 'xp')::integer else 0 end as xp,
  case when coalesce(up.stats ->> 'level', '') ~ '^[0-9]{1,6}$'
    then greatest(1, (up.stats ->> 'level')::integer) else 1 end as level,
  case when coalesce(up.stats ->> 'streak', '') ~ '^[0-9]{1,6}$'
    then (up.stats ->> 'streak')::integer else 0 end as streak
from public.profiles p
left join public.user_progress up on up.user_id = p.id;

grant select on public.leaderboard_public to authenticated;

-- Remove table-wide UPDATE on friend requests; only the status column is client-writable.
revoke update on public.friend_requests from authenticated;
grant update (status) on public.friend_requests to authenticated;
