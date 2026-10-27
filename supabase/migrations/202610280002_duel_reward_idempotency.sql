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
      then v_duel.opponent_answers ? v_round_key else v_duel.challenger_answers ? v_round_key end
  );
end;
$$;

revoke all on function public.get_duel_state(uuid) from public, anon;
grant execute on function public.get_duel_state(uuid) to authenticated;
