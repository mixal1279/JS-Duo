-- JS-Duo online foundation. Safe to re-run.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null default 'Programista',
  avatar_emoji text not null default '🦉',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username) between 3 and 32),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 40)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
begin
  base_name := lower(regexp_replace(
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(coalesce(new.email, 'programista'), '@', 1)),
    '[^a-zA-Z0-9_]', '', 'g'
  ));
  if char_length(base_name) < 3 then base_name := 'coder'; end if;
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    left(base_name, 24) || '_' || left(replace(new.id::text, '-', ''), 6),
    left(coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), base_name), 40)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_js_duo on auth.users;
create trigger on_auth_user_created_js_duo
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stats jsonb not null default '{}'::jsonb,
  quests jsonb not null default '[]'::jsonb,
  review_schedule jsonb not null default '[]'::jsonb,
  completed_projects jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_progress_stats_object check (jsonb_typeof(stats) = 'object'),
  constraint user_progress_quests_array check (jsonb_typeof(quests) = 'array'),
  constraint user_progress_review_array check (jsonb_typeof(review_schedule) = 'array'),
  constraint user_progress_projects_array check (jsonb_typeof(completed_projects) = 'array')
);
alter table public.user_progress add column if not exists review_schedule jsonb not null default '[]'::jsonb;
alter table public.user_progress add column if not exists completed_projects jsonb not null default '[]'::jsonb;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id text not null default 'general',
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  code_snippet text,
  linked_question_id integer,
  reactions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint chat_channel_length check (char_length(channel_id) between 1 and 60),
  constraint chat_body_length check (char_length(body) between 1 and 1500),
  constraint chat_code_length check (code_snippet is null or char_length(code_snippet) <= 10000),
  constraint chat_reactions_object check (jsonb_typeof(reactions) = 'object')
);
alter table public.chat_messages add column if not exists code_snippet text;
alter table public.chat_messages add column if not exists linked_question_id integer;
alter table public.chat_messages add column if not exists reactions jsonb not null default '{}'::jsonb;
create index if not exists chat_messages_channel_created_idx on public.chat_messages (channel_id, created_at desc);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friend_request_not_self check (sender_id <> receiver_id),
  constraint friend_request_unique_pair unique (sender_id, receiver_id)
);

create table if not exists public.duels (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references auth.users(id) on delete cascade,
  opponent_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'declined', 'cancelled')),
  challenger_score integer not null default 0 check (challenger_score >= 0),
  opponent_score integer not null default 0 check (opponent_score >= 0),
  winner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint duel_not_self check (challenger_id <> opponent_id)
);
create index if not exists duels_challenger_created_idx on public.duels (challenger_id, created_at desc);
create index if not exists duels_opponent_created_idx on public.duels (opponent_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.chat_messages enable row level security;
alter table public.friend_requests enable row level security;
alter table public.duels enable row level security;

drop policy if exists "Authenticated users can view profiles" on public.profiles;
create policy "Authenticated users can view profiles" on public.profiles
  for select to authenticated using (true);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can read their own progress" on public.user_progress;
create policy "Users can read their own progress" on public.user_progress
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert their own progress" on public.user_progress;
create policy "Users can insert their own progress" on public.user_progress
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own progress" on public.user_progress;
create policy "Users can update their own progress" on public.user_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can read chat" on public.chat_messages;
create policy "Authenticated users can read chat" on public.chat_messages
  for select to authenticated using (true);
drop policy if exists "Users can send their own messages" on public.chat_messages;
create policy "Users can send their own messages" on public.chat_messages
  for insert to authenticated with check (auth.uid() = sender_id);
drop policy if exists "Users can delete their own messages" on public.chat_messages;
create policy "Users can delete their own messages" on public.chat_messages
  for delete to authenticated using (auth.uid() = sender_id);

drop policy if exists "Participants can read friend requests" on public.friend_requests;
create policy "Participants can read friend requests" on public.friend_requests
  for select to authenticated using (auth.uid() = sender_id or auth.uid() = receiver_id);
drop policy if exists "Users can send friend requests" on public.friend_requests;
create policy "Users can send friend requests" on public.friend_requests
  for insert to authenticated with check (auth.uid() = sender_id);
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

drop policy if exists "Senders can cancel friend requests" on public.friend_requests;
create policy "Senders can cancel friend requests" on public.friend_requests
  for delete to authenticated using (auth.uid() = sender_id);

drop policy if exists "Duel participants can read duels" on public.duels;
create policy "Duel participants can read duels" on public.duels
  for select to authenticated using (auth.uid() = challenger_id or auth.uid() = opponent_id);
drop policy if exists "Users can challenge another user" on public.duels;
create policy "Users can challenge another user" on public.duels
  for insert to authenticated with check (auth.uid() = challenger_id and challenger_id <> opponent_id);
-- Duel outcomes must be written by a trusted server-side function, not by clients.
drop policy if exists "Duel participants can update duels" on public.duels;

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
grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (username, display_name, avatar_emoji) on public.profiles to authenticated;
grant select, insert, update on public.user_progress to authenticated;
grant select, insert, delete on public.chat_messages to authenticated;
grant select, insert, delete on public.friend_requests to authenticated;
revoke update on public.friend_requests from authenticated;
grant update (status) on public.friend_requests to authenticated;
grant select, insert on public.duels to authenticated;
