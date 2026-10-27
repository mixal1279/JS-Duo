-- Idempotent, server-authoritative rewards for completed online duels.
-- Apply only after 202610280001_realtime_duels.sql.
create table if not exists public.duel_reward_balances (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  xp bigint not null default 0 check (xp >= 0),
  gems bigint not null default 0 check (gems >= 0),
  duel_wins integer not null default 0 check (duel_wins >= 0),
  duel_losses integer not null default 0 check (duel_losses >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.duel_reward_events (
  duel_id uuid not null references public.duels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  xp_delta integer not null default 0,
  gems_delta integer not null default 0,
  wins_delta integer not null default 0,
  losses_delta integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (duel_id, user_id)
);

alter table public.duel_reward_balances enable row level security;
alter table public.duel_reward_events enable row level security;
revoke all on public.duel_reward_balances from public, anon, authenticated;
revoke all on public.duel_reward_events from public, anon, authenticated;

create or replace function public.settle_duel_rewards(p_duel_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_duel public.duels%rowtype;
  v_user uuid;
  v_xp integer;
  v_gems integer;
  v_wins integer;
  v_losses integer;
  v_inserted integer := 0;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;

  select * into v_duel from public.duels where id = p_duel_id for update;
  if not found then raise exception 'Duel not found'; end if;
  if auth.uid() not in (v_duel.challenger_id, v_duel.opponent_id) then
    raise exception 'Not a participant';
  end if;
  if v_duel.status <> 'completed' then
    raise exception 'Duel is not completed';
  end if;

  -- A draw grants no win reward. A winner gets the fixed reward exactly once.
  for v_user in
    select v_duel.challenger_id
    union all
    select v_duel.opponent_id
  loop
    v_xp := case when v_duel.winner_id = v_user then 50 else 0 end;
    v_gems := case when v_duel.winner_id = v_user then 20 else 0 end;
    v_wins := case when v_duel.winner_id = v_user then 1 else 0 end;
    v_losses := case when v_duel.winner_id is not null and v_duel.winner_id <> v_user then 1 else 0 end;

    insert into public.duel_reward_events
      (duel_id, user_id, xp_delta, gems_delta, wins_delta, losses_delta)
    values
      (p_duel_id, v_user, v_xp, v_gems, v_wins, v_losses)
    on conflict (duel_id, user_id) do nothing;

    if found then
      insert into public.duel_reward_balances (user_id, xp, gems, duel_wins, duel_losses, updated_at)
      values (v_user, v_xp, v_gems, v_wins, v_losses, now())
      on conflict (user_id) do update set
        xp = public.duel_reward_balances.xp + excluded.xp,
        gems = public.duel_reward_balances.gems + excluded.gems,
        duel_wins = public.duel_reward_balances.duel_wins + excluded.duel_wins,
        duel_losses = public.duel_reward_balances.duel_losses + excluded.duel_losses,
        updated_at = now();
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'duel_id', p_duel_id,
    'settled', true,
    'new_events', v_inserted
  );
end;
$$;

revoke all on function public.settle_duel_rewards(uuid) from public, anon;
grant execute on function public.settle_duel_rewards(uuid) to authenticated;

-- The state RPC remains participant-only. Settling on completed-state retrieval is
-- idempotent and covers both normal completion and timeout completion.
create or replace function public.get_duel_state(p_duel_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_duel public.duels%rowtype;
  v_q jsonb;
  v_round_key text;
begin
  select * into v_duel from public.duels where id = p_duel_id;
  if not found then raise exception 'Duel not found'; end if;
  if auth.uid() is null or auth.uid() not in (v_duel.challenger_id, v_duel.opponent_id) then
    raise exception 'Not a participant';
  end if;

  if v_duel.status = 'completed' then
    perform public.settle_duel_rewards(p_duel_id);
    select * into v_duel from public.duels where id = p_duel_id;
  end if;

  v_round_key := v_duel.current_round::text;
  if v_duel.status = 'active' and v_duel.current_round < array_length(v_duel.question_ids, 1) then
    select jsonb_build_object(
      'id', id, 'unit_id', unit_id, 'unit_title', unit_title, 'question', question,
      'code_snippet', code_snippet, 'type', question_type, 'options', options,
      'difficulty', difficulty, 'points', points
    ) into v_q
    from public.duel_question_bank
    where id = v_duel.question_ids[v_duel.current_round + 1];
  else
    v_q := null;
  end if;

  return jsonb_build_object(
    'id', v_duel.id, 'status', v_duel.status, 'challenger_id', v_duel.challenger_id,
    'opponent_id', v_duel.opponent_id, 'challenger_score', v_duel.challenger_score,
    'opponent_score', v_duel.opponent_score, 'winner_id', v_duel.winner_id,
    'current_round', v_duel.current_round,
    'round_count', coalesce(array_length(v_duel.question_ids, 1), 0),
    'round_started_at', v_duel.round_started_at, 'completed_at', v_duel.completed_at,
    'question', v_q,
    'my_answer', case when auth.uid() = v_duel.challenger_id
      then v_duel.challenger_answers -> v_round_key else v_duel.opponent_answers -> v_round_key end,
    'opponent_answered', case when auth.uid() = v_duel.challenger_id
      then v_duel.opponent_answers ? v_round_key else v_duel.challenger_answers ? v_round_key end,
    'my_rewards', (select jsonb_build_object('xp', xp, 'gems', gems, 'duel_wins', duel_wins, 'duel_losses', duel_losses)
      from public.duel_reward_balances where user_id = auth.uid())
  );
end;
$$;

revoke all on function public.get_duel_state(uuid) from public, anon;
grant execute on function public.get_duel_state(uuid) to authenticated;


-- Backfill a one-time starting snapshot for existing accounts, then keep protected
-- counters in this private table rather than trusting client-supplied stats JSON.
insert into public.duel_reward_balances (user_id, xp, gems, duel_wins, duel_losses)
select
  p.id,
  case when coalesce(up.stats ->> 'xp', '') ~ '^[0-9]{1,9}$' then (up.stats ->> 'xp')::bigint else 0 end,
  case when coalesce(up.stats ->> 'gems', '') ~ '^[0-9]{1,9}$' then (up.stats ->> 'gems')::bigint else 0 end,
  case when coalesce(up.stats ->> 'duelWins', '') ~ '^[0-9]{1,9}$' then (up.stats ->> 'duelWins')::integer else 0 end,
  case when coalesce(up.stats ->> 'duelLosses', '') ~ '^[0-9]{1,9}$' then (up.stats ->> 'duelLosses')::integer else 0 end
from public.profiles p
left join public.user_progress up on up.user_id = p.id
on conflict (user_id) do nothing;

create table if not exists public.learning_answer_events (
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id integer not null references public.duel_question_bank(id),
  answer_index integer not null,
  is_correct boolean not null,
  xp_delta integer not null default 0 check (xp_delta >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);
alter table public.learning_answer_events enable row level security;
revoke all on public.learning_answer_events from public, anon, authenticated;

create or replace function public.ensure_reward_balance_for_profile()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.duel_reward_balances (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.ensure_reward_balance_for_profile() from public, anon, authenticated;
drop trigger if exists profiles_ensure_reward_balance on public.profiles;
create trigger profiles_ensure_reward_balance
after insert on public.profiles
for each row execute function public.ensure_reward_balance_for_profile();

create or replace function public.guard_client_reward_stats()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_balance public.duel_reward_balances%rowtype;
begin
  insert into public.duel_reward_balances (user_id) values (new.user_id)
  on conflict (user_id) do nothing;
  select * into v_balance from public.duel_reward_balances where user_id = new.user_id;
  new.stats := jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(coalesce(new.stats, '{}'::jsonb), '{xp}', to_jsonb(v_balance.xp), true),
          '{gems}', to_jsonb(v_balance.gems), true
        ),
        '{duelWins}', to_jsonb(v_balance.duel_wins), true
      ),
      '{duelLosses}', to_jsonb(v_balance.duel_losses), true
    ),
    '{level}', to_jsonb(greatest(1, floor(v_balance.xp / 100.0)::integer + 1)), true
  );
  return new;
end;
$$;
revoke all on function public.guard_client_reward_stats() from public, anon, authenticated;
drop trigger if exists user_progress_guard_reward_stats on public.user_progress;
create trigger user_progress_guard_reward_stats
before insert or update of stats on public.user_progress
for each row execute function public.guard_client_reward_stats();

create or replace function public.submit_learning_answer(p_question_id integer, p_answer_index integer)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_question public.duel_question_bank%rowtype;
  v_correct boolean;
  v_inserted boolean := false;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select * into v_question from public.duel_question_bank where id = p_question_id;
  if not found then raise exception 'Question not found'; end if;
  if p_answer_index is null or p_answer_index < 0 or p_answer_index >= jsonb_array_length(v_question.options) then
    raise exception 'Invalid answer index';
  end if;

  v_correct := p_answer_index = v_question.correct_index;
  insert into public.learning_answer_events (user_id, question_id, answer_index, is_correct, xp_delta)
  values (auth.uid(), p_question_id, p_answer_index, v_correct, case when v_correct then v_question.points else 0 end)
  on conflict (user_id, question_id) do nothing
  returning true into v_inserted;

  if not coalesce(v_inserted, false) then
    return jsonb_build_object('accepted', false, 'duplicate', true, 'xp_awarded', 0);
  end if;

  if v_correct then
    insert into public.duel_reward_balances (user_id, xp)
    values (auth.uid(), v_question.points)
    on conflict (user_id) do update set
      xp = public.duel_reward_balances.xp + excluded.xp,
      updated_at = now();
  end if;

  return jsonb_build_object(
    'accepted', true,
    'duplicate', false,
    'correct', v_correct,
    'xp_awarded', case when v_correct then v_question.points else 0 end
  );
end;
$$;
revoke all on function public.submit_learning_answer(integer, integer) from public, anon;
grant execute on function public.submit_learning_answer(integer, integer) to authenticated;

-- Ranking XP/level now come from the server-maintained balance. Streak remains a
-- separate progress field; this preserves the existing view contract and its columns.
create or replace view public.leaderboard_public with (security_invoker = false) as
select
  p.id,
  p.username,
  p.display_name,
  p.avatar_emoji,
  coalesce(rb.xp, 0)::integer as xp,
  greatest(1, floor(coalesce(rb.xp, 0) / 100.0)::integer + 1) as level,
  case when coalesce(up.stats ->> 'streak', '') ~ '^[0-9]{1,6}$'
    then (up.stats ->> 'streak')::integer else 0 end as streak
from public.profiles p
left join public.user_progress up on up.user_id = p.id
left join public.duel_reward_balances rb on rb.user_id = p.id;

revoke all on public.leaderboard_public from anon;
grant select on public.leaderboard_public to authenticated;


create table if not exists public.daily_reward_claims (
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_id text not null check (quest_id in ('q1','q2','q3','q4')),
  claim_date date not null default current_date,
  xp_delta integer not null,
  gems_delta integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id, quest_id, claim_date)
);
alter table public.daily_reward_claims enable row level security;
revoke all on public.daily_reward_claims from public, anon, authenticated;

create or replace function public.claim_daily_quest(p_quest_id text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_xp integer;
  v_gems integer;
  v_correct integer;
  v_wrong integer;
  v_lessons integer;
  v_has_duel_win boolean;
  v_inserted boolean := false;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;
  if p_quest_id not in ('q1','q2','q3','q4') then raise exception 'Invalid quest'; end if;

  select count(*) filter (where is_correct), count(*) filter (where not is_correct)
    into v_correct, v_wrong
  from public.learning_answer_events
  where user_id = v_uid and created_at >= date_trunc('day', now());

  select count(*) into v_lessons
  from public.learning_lesson_events
  where user_id = v_uid and completion_date = current_date;

  select exists (
    select 1 from public.duel_reward_events
    where user_id = v_uid and wins_delta > 0 and created_at >= date_trunc('day', now())
  ) into v_has_duel_win;

  case p_quest_id
    when 'q1' then
      select coalesce(sum(xp_delta),0) into v_xp
      from public.learning_answer_events
      where user_id = v_uid and created_at >= date_trunc('day', now());
      if v_xp < 30 then raise exception 'Quest requirement not met'; end if;
      v_xp := 25; v_gems := 10;
    when 'q2' then
      if v_correct < 5 or v_wrong > 0 then raise exception 'Quest requirement not met'; end if;
      v_xp := 35; v_gems := 15;
    when 'q3' then
      if v_lessons < 2 then raise exception 'Quest requirement not met'; end if;
      v_xp := 30; v_gems := 15;
    when 'q4' then
      if not v_has_duel_win then raise exception 'Quest requirement not met'; end if;
      v_xp := 50; v_gems := 25;
  end case;

  insert into public.daily_reward_claims (user_id, quest_id, claim_date, xp_delta, gems_delta)
  values (v_uid, p_quest_id, current_date, v_xp, v_gems)
  on conflict (user_id, quest_id, claim_date) do nothing
  returning true into v_inserted;

  if not coalesce(v_inserted, false) then
    return jsonb_build_object('claimed', false, 'duplicate', true, 'xp_awarded', 0, 'gems_awarded', 0);
  end if;

  insert into public.duel_reward_balances (user_id, xp, gems)
  values (v_uid, v_xp, v_gems)
  on conflict (user_id) do update set
    xp = public.duel_reward_balances.xp + excluded.xp,
    gems = public.duel_reward_balances.gems + excluded.gems,
    updated_at = now();

  return jsonb_build_object('claimed', true, 'duplicate', false, 'xp_awarded', v_xp, 'gems_awarded', v_gems);
end;
$$;
revoke all on function public.claim_daily_quest(text) from public, anon;
grant execute on function public.claim_daily_quest(text) to authenticated;


create table if not exists public.learning_lesson_events (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_key text not null check (length(lesson_key) between 1 and 80),
  unit_id integer not null,
  question_ids integer[] not null,
  completion_date date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (user_id, lesson_key, completion_date)
);
alter table public.learning_lesson_events enable row level security;
revoke all on public.learning_lesson_events from public, anon, authenticated;

create or replace function public.complete_learning_lesson(p_lesson_key text, p_question_ids integer[])
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_unit integer;
  v_count integer;
  v_inserted boolean := false;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;
  if p_lesson_key is null or length(p_lesson_key) < 1 or length(p_lesson_key) > 80 then
    raise exception 'Invalid lesson key';
  end if;
  if p_question_ids is null or cardinality(p_question_ids) < 5 or cardinality(p_question_ids) > 30 then
    raise exception 'Invalid lesson question count';
  end if;
  select count(distinct t.qid) into v_count from unnest(p_question_ids) as t(qid);
  if v_count <> cardinality(p_question_ids) then raise exception 'Duplicate lesson question'; end if;
  select min(unit_id), count(*) into v_unit, v_count
  from public.duel_question_bank
  where id = any(p_question_ids);
  if v_count <> cardinality(p_question_ids) then raise exception 'Unknown lesson question'; end if;
  if exists (select 1 from public.duel_question_bank where id = any(p_question_ids) and unit_id <> v_unit) then
    raise exception 'Lesson questions must belong to one unit';
  end if;
  if exists (
    select 1 from unnest(p_question_ids) as t(qid)
    where not exists (
      select 1 from public.learning_answer_events e
      where e.user_id = v_uid and e.question_id = t.qid
    )
  ) then
    raise exception 'Lesson answers are incomplete';
  end if;

  insert into public.learning_lesson_events (user_id, lesson_key, unit_id, question_ids, completion_date)
  values (v_uid, p_lesson_key, v_unit, p_question_ids, current_date)
  on conflict (user_id, lesson_key, completion_date) do nothing
  returning true into v_inserted;

  return jsonb_build_object('completed', coalesce(v_inserted, false), 'duplicate', not coalesce(v_inserted, false));
end;
$$;
revoke all on function public.complete_learning_lesson(text, integer[]) from public, anon;
grant execute on function public.complete_learning_lesson(text, integer[]) to authenticated;
