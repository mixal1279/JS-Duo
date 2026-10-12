-- JS-Duo manual setup, part 2/3: chat, friend requests and duels
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
