-- JS-Duo manual setup, part 3/3: row-level security, leaderboard and grants
alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.chat_messages enable row level security;
alter table public.friend_requests enable row level security;
alter table public.duels enable row level security;

drop policy if exists "Authenticated users can view profiles" on public.profiles;
create policy "Authenticated users can view profiles" on public.profiles for select to authenticated using (true);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can read their own progress" on public.user_progress;
create policy "Users can read their own progress" on public.user_progress for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert their own progress" on public.user_progress;
create policy "Users can insert their own progress" on public.user_progress for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own progress" on public.user_progress;
create policy "Users can update their own progress" on public.user_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can read chat" on public.chat_messages;
create policy "Authenticated users can read chat" on public.chat_messages for select to authenticated using (true);
drop policy if exists "Users can send their own messages" on public.chat_messages;
create policy "Users can send their own messages" on public.chat_messages for insert to authenticated with check (auth.uid() = sender_id);
drop policy if exists "Users can delete their own messages" on public.chat_messages;
create policy "Users can delete their own messages" on public.chat_messages for delete to authenticated using (auth.uid() = sender_id);

drop policy if exists "Participants can read friend requests" on public.friend_requests;
create policy "Participants can read friend requests" on public.friend_requests for select to authenticated using (auth.uid() = sender_id or auth.uid() = receiver_id);
drop policy if exists "Users can send friend requests" on public.friend_requests;
create policy "Users can send friend requests" on public.friend_requests for insert to authenticated with check (auth.uid() = sender_id);
drop policy if exists "Recipients can respond to friend requests" on public.friend_requests;
create policy "Recipients can respond to friend requests" on public.friend_requests for update to authenticated using (auth.uid() = receiver_id or auth.uid() = sender_id) with check (auth.uid() = receiver_id or auth.uid() = sender_id);
drop policy if exists "Senders can cancel friend requests" on public.friend_requests;
create policy "Senders can cancel friend requests" on public.friend_requests for delete to authenticated using (auth.uid() = sender_id);

drop policy if exists "Duel participants can read duels" on public.duels;
create policy "Duel participants can read duels" on public.duels for select to authenticated using (auth.uid() = challenger_id or auth.uid() = opponent_id);
drop policy if exists "Users can challenge another user" on public.duels;
create policy "Users can challenge another user" on public.duels for insert to authenticated with check (auth.uid() = challenger_id and challenger_id <> opponent_id);
drop policy if exists "Duel participants can update duels" on public.duels;
create policy "Duel participants can update duels" on public.duels for update to authenticated using (auth.uid() = challenger_id or auth.uid() = opponent_id) with check (auth.uid() = challenger_id or auth.uid() = opponent_id);

create or replace view public.leaderboard_public with (security_invoker = true) as
select p.id, p.username, p.display_name, p.avatar_emoji,
  case when coalesce(up.stats ->> 'xp', '') ~ '^[0-9]{1,9}$' then (up.stats ->> 'xp')::integer else 0 end as xp,
  case when coalesce(up.stats ->> 'level', '') ~ '^[0-9]{1,6}$' then greatest(1, (up.stats ->> 'level')::integer) else 1 end as level,
  case when coalesce(up.stats ->> 'streak', '') ~ '^[0-9]{1,6}$' then (up.stats ->> 'streak')::integer else 0 end as streak
from public.profiles p left join public.user_progress up on up.user_id = p.id;

grant select on public.leaderboard_public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.user_progress to authenticated;
grant select, insert, delete on public.chat_messages to authenticated;
grant select, insert, update, delete on public.friend_requests to authenticated;
grant select, insert, update on public.duels to authenticated;
