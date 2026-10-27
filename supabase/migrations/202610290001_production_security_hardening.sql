-- JS-Duo production security and index hardening.
-- Non-destructive: restrict client privileges and preserve existing authenticated app flows.
revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (username, display_name, avatar_emoji) on table public.profiles to authenticated;

revoke all on table public.user_progress from anon;
revoke all on table public.user_progress from authenticated;
grant select, insert, update on table public.user_progress to authenticated;

revoke all on table public.chat_messages from anon;
revoke all on table public.chat_messages from authenticated;
grant select, insert, delete on table public.chat_messages to authenticated;

revoke all on table public.friend_requests from anon;
revoke all on table public.friend_requests from authenticated;
grant select, insert, delete on table public.friend_requests to authenticated;
grant update (status) on table public.friend_requests to authenticated;

revoke all on table public.duels from anon;
revoke all on table public.duels from authenticated;
grant select, insert on table public.duels to authenticated;

revoke all on table public.leaderboard_public from anon;
revoke all on table public.leaderboard_public from authenticated;
grant select on table public.leaderboard_public to authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
drop policy if exists "Users can read their own progress" on public.user_progress;
create policy "Users can read their own progress" on public.user_progress
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert their own progress" on public.user_progress;
create policy "Users can insert their own progress" on public.user_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own progress" on public.user_progress;
create policy "Users can update their own progress" on public.user_progress
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can send their own messages" on public.chat_messages;
create policy "Users can send their own messages" on public.chat_messages
  for insert to authenticated with check ((select auth.uid()) = sender_id);
drop policy if exists "Users can delete their own messages" on public.chat_messages;
create policy "Users can delete their own messages" on public.chat_messages
  for delete to authenticated using ((select auth.uid()) = sender_id);

drop policy if exists "Participants can read friend requests" on public.friend_requests;
create policy "Participants can read friend requests" on public.friend_requests
  for select to authenticated using ((select auth.uid()) = sender_id or (select auth.uid()) = receiver_id);
drop policy if exists "Users can send friend requests" on public.friend_requests;
create policy "Users can send friend requests" on public.friend_requests
  for insert to authenticated with check ((select auth.uid()) = sender_id);
drop policy if exists "Recipients can respond to friend requests" on public.friend_requests;
create policy "Recipients can respond to friend requests" on public.friend_requests
  for update to authenticated
  using (status = 'pending' and ((select auth.uid()) = receiver_id or (select auth.uid()) = sender_id))
  with check (
    ((select auth.uid()) = receiver_id and status in ('accepted', 'declined'))
    or ((select auth.uid()) = sender_id and status = 'cancelled')
  );
drop policy if exists "Senders can cancel friend requests" on public.friend_requests;
create policy "Senders can cancel friend requests" on public.friend_requests
  for delete to authenticated using ((select auth.uid()) = sender_id);

drop policy if exists "Duel participants can read duels" on public.duels;
create policy "Duel participants can read duels" on public.duels
  for select to authenticated using ((select auth.uid()) = challenger_id or (select auth.uid()) = opponent_id);
drop policy if exists "Users can challenge another user" on public.duels;
create policy "Users can challenge another user" on public.duels
  for insert to authenticated with check ((select auth.uid()) = challenger_id and challenger_id <> opponent_id);

create index if not exists chat_messages_sender_id_idx on public.chat_messages (sender_id);
create index if not exists duels_winner_id_idx on public.duels (winner_id);
create index if not exists friend_requests_receiver_id_idx on public.friend_requests (receiver_id);
