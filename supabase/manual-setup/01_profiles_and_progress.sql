-- JS-Duo manual setup, part 1/3: profiles and progress tables
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
returns trigger language plpgsql security definer set search_path = public
as $$
declare base_name text;
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
create trigger on_auth_user_created_js_duo after insert on auth.users
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
