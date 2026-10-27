import React, { useEffect, useMemo, useState } from 'react';
import { Swords, Trophy, Timer, CheckCircle2, XCircle, RefreshCw, UserCheck, ShieldCheck } from 'lucide-react';
import { Friend, UserStats } from '../types';
import { AuthSession, OnlineDuelState, cloudSyncService } from '../services/cloudSyncService';

interface DuelViewProps {
  friends: Friend[];
  userStats: UserStats;
  onUpdateStats: (newStats: Partial<UserStats>) => void;
}

interface DuelRow {
  id: string;
  challenger_id: string;
  opponent_id: string;
  status: string;
  created_at: string;
  completed_at?: string | null;
  winner_id?: string | null;
}

const ACTIVE_DUEL_KEY = 'js_duo_active_online_duel_v1';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const DuelView: React.FC<DuelViewProps> = ({ friends, userStats, onUpdateStats }) => {
  const session: AuthSession | null = cloudSyncService.getSession();
  const userId = session?.user.id || '';
  const [duels, setDuels] = useState<DuelRow[]>([]);
  const [activeDuelId, setActiveDuelId] = useState<string>(() => {
    try { return localStorage.getItem(ACTIVE_DUEL_KEY) || ''; } catch { return ''; }
  });
  const [duel, setDuel] = useState<OnlineDuelState | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [rewardSyncedId, setRewardSyncedId] = useState('');

  const incoming = useMemo(
    () => duels.filter((item) => item.status === 'pending' && item.opponent_id === userId),
    [duels, userId]
  );
  const outgoing = useMemo(
    () => duels.filter((item) => item.status === 'pending' && item.challenger_id === userId),
    [duels, userId]
  );

  const refresh = async (quiet = false) => {
    const current = cloudSyncService.getSession();
    if (!current) {
      setDuels([]);
      setDuel(null);
      if (!quiet) setError('Zaloguj się, aby korzystać z pojedynków online.');
      return;
    }
    if (!quiet) setLoading(true);
    try {
      const rows = await cloudSyncService.listDuels(current);
      setDuels(rows);
      if (activeDuelId) {
        try {
          const state = await cloudSyncService.getDuelState(current, activeDuelId);
          setDuel(state);
          if (state.status === 'declined') {
            setNotice('Wyzwanie zostało odrzucone.');
            setActiveDuelId('');
            try { localStorage.removeItem(ACTIVE_DUEL_KEY); } catch { /* optional cache */ }
          }
          if (state.status === 'completed' && state.my_rewards && rewardSyncedId !== state.id) {
            onUpdateStats({
              xp: Number(state.my_rewards.xp) || 0,
              gems: Number(state.my_rewards.gems) || 0,
              duelWins: Number(state.my_rewards.duel_wins) || 0,
              duelLosses: Number(state.my_rewards.duel_losses) || 0,
              level: Math.max(1, Math.floor((Number(state.my_rewards.xp) || 0) / 100) + 1),
            });
            setRewardSyncedId(state.id);
          }
        } catch {
          // Keep the active duel ID across transient disconnects so the next poll can reconnect.
          setNotice('Brak połączenia z pojedynkiem. Zachowałem stan i spróbuję ponownie.');
        }
      }
      setError('');
    } catch (cause) {
      if (!quiet) setError(cause instanceof Error ? cause.message : 'Nie udało się pobrać pojedynków.');
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => { void refresh(true); }, 2500);
    return () => window.clearInterval(interval);
    // refresh reads activeDuelId and rewardSyncedId; restarting on these changes keeps its closure current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeDuelId, rewardSyncedId]);

  useEffect(() => {
    if (!duel || duel.status !== 'active' || !duel.round_started_at) return;
    const update = () => {
      const deadline = new Date(duel.round_started_at as string).getTime() + 15_000;
      setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    };
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [duel?.id, duel?.status, duel?.current_round, duel?.round_started_at]);

  useEffect(() => {
    if (!duel || duel.status !== 'active' || timeLeft > 0 || working) return;
    const current = cloudSyncService.getSession();
    if (!current) return;
    setWorking(true);
    cloudSyncService.advanceDuelTimeout(current, duel.id)
      .then(setDuel)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Nie udało się rozliczyć timeoutu.'))
      .finally(() => setWorking(false));
  }, [duel, timeLeft, working]);

  const rememberDuel = (id: string) => {
    setActiveDuelId(id);
    try { localStorage.setItem(ACTIVE_DUEL_KEY, id); } catch { /* server remains authoritative */ }
  };

  const challenge = async (friend: Friend) => {
    const current = cloudSyncService.getSession();
    if (!current) { setError('Zaloguj się, aby wysyłać wyzwania.'); return; }
    if (!UUID_RE.test(friend.id)) {
      setError(`Profil „${friend.name}” nie ma powiązanego identyfikatora konta online. Odśwież znajomych po połączeniu z Supabase.`);
      return;
    }
    setWorking(true); setError(''); setNotice('');
    try {
      const id = await cloudSyncService.createDuel(current, friend.id);
      rememberDuel(id);
      setDuel(await cloudSyncService.getDuelState(current, id));
      setNotice(`Wysłano wyzwanie do ${friend.name}.`);
      await refresh(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Nie udało się utworzyć wyzwania.');
    } finally { setWorking(false); }
  };

  const respond = async (row: DuelRow, accept: boolean) => {
    const current = cloudSyncService.getSession();
    if (!current) return;
    setWorking(true); setError(''); setNotice('');
    try {
      const state = await cloudSyncService.respondToDuel(current, row.id, accept);
      if (accept) {
        rememberDuel(row.id);
        setDuel(state);
        setNotice('Wyzwanie zaakceptowane. Pojedynek rozpoczęty.');
      } else {
        setNotice('Wyzwanie odrzucone.');
        setActiveDuelId('');
        try { localStorage.removeItem(ACTIVE_DUEL_KEY); } catch { /* optional cache */ }
      }
      await refresh(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Nie udało się odpowiedzieć na wyzwanie.');
    } finally { setWorking(false); }
  };

  const answer = async (index: number) => {
    const current = cloudSyncService.getSession();
    if (!current || !duel || duel.status !== 'active' || duel.my_answer || working) return;
    setWorking(true); setError('');
    try {
      setDuel(await cloudSyncService.submitDuelAnswer(current, duel.id, index));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Nie udało się wysłać odpowiedzi.');
    } finally { setWorking(false); }
  };

  const abandonView = () => {
    setDuel(null);
    setActiveDuelId('');
    setRewardSyncedId('');
    try { localStorage.removeItem(ACTIVE_DUEL_KEY); } catch { /* optional cache */ }
    void refresh(true);
  };

  if (!session) {
    return <div className="mx-auto max-w-xl rounded-3xl border border-[#2A373F] bg-[#172127] p-6 text-center">
      <ShieldCheck size={34} className="mx-auto mb-3 text-purple-400" />
      <h2 className="text-xl font-black text-white">Pojedynki online 1v1</h2>
      <p className="mt-2 text-sm text-gray-400">Zaloguj się do JS Duo, aby wysyłać wyzwania i rozgrywać zsynchronizowane rundy z innymi użytkownikami.</p>
    </div>;
  }

  return <div className="mx-auto max-w-2xl space-y-5 px-2 py-3 pb-8">
    <header className="rounded-3xl border-2 border-purple-500/40 bg-gradient-to-tr from-[#241738] to-[#1C262C] p-5 text-center shadow-xl">
      <Swords size={34} className="mx-auto mb-2 text-purple-400" />
      <h2 className="text-2xl font-black text-white">Pojedynki online 1v1</h2>
      <p className="mt-2 text-sm text-gray-300">Pięć rund, odpowiedzi sprawdzane na serwerze i nagrody naliczane tylko raz.</p>
      <div className="mt-4 flex justify-center gap-4 text-xs font-bold">
        <span className="text-duo-green">Wygrane: {userStats.duelWins}</span>
        <span className="text-duo-red">Przegrane: {userStats.duelLosses}</span>
      </div>
      <button onClick={() => void refresh()} disabled={loading || working} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Odśwież
      </button>
    </header>

    {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">{notice}</div>}

    {duel && duel.status === 'active' && duel.question && <section className="space-y-4 rounded-3xl border border-purple-500/40 bg-[#172127] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-wider text-purple-300">Runda {Math.min(duel.current_round + 1, duel.round_count)} / {duel.round_count}</p><h3 className="mt-1 text-lg font-black text-white">{duel.question.unit_title}</h3></div>
        <div className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2 font-black text-white"><Timer size={17} className={timeLeft <= 5 ? 'text-red-400' : 'text-purple-300'} />{timeLeft}s</div>
      </div>
      <div className="rounded-2xl bg-[#10191E] p-4">
        <p className="whitespace-pre-wrap font-bold text-white">{duel.question.question}</p>
        {duel.question.code_snippet && <pre className="mt-3 overflow-x-auto rounded-xl bg-black/30 p-3 text-sm text-gray-200"><code>{duel.question.code_snippet}</code></pre>}
      </div>
      <div className="grid gap-2">
        {duel.question.options.map((option, index) => <button key={index} onClick={() => void answer(index)} disabled={working || Boolean(duel.my_answer) || timeLeft <= 0} className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${duel.my_answer?.answer_index === index ? 'border-purple-400 bg-purple-500/20 text-white' : 'border-[#34444D] bg-[#10191E] text-gray-200 hover:border-purple-400'} disabled:cursor-not-allowed disabled:opacity-60`}>
          <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">{String.fromCharCode(65 + index)}</span>{option}
        </button>)}
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-black/20 p-3 text-sm">
        <span className="text-gray-300">Ty: <strong>{duel.challenger_id === userId ? duel.challenger_score : duel.opponent_score}</strong></span>
        <span className="text-gray-300">Rywal: <strong>{duel.challenger_id === userId ? duel.opponent_score : duel.challenger_score}</strong></span>
      </div>
      {duel.my_answer && <p className={`flex items-center gap-2 text-sm font-bold ${duel.my_answer.correct ? 'text-green-300' : 'text-red-300'}`}>
        {duel.my_answer.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
        {duel.my_answer.correct ? 'Poprawna odpowiedź' : 'Niepoprawna odpowiedź'} — czekamy na rywala lub koniec rundy.
      </p>}
      {duel.opponent_answered && <p className="text-sm text-purple-200">Rywal odpowiedział. Synchronizuję stan rundy…</p>}
    </section>}

    {duel && duel.status === 'pending' && <section className="rounded-2xl border border-purple-500/30 bg-[#172127] p-5 text-center">
      <UserCheck size={28} className="mx-auto mb-2 text-purple-300" />
      <h3 className="font-black text-white">Wyzwanie oczekuje na odpowiedź</h3>
      <p className="mt-1 text-sm text-gray-400">Ten panel odświeża się automatycznie. Możesz zamknąć aplikację i wrócić później.</p>
      <button onClick={abandonView} className="mt-4 rounded-xl border border-white/20 px-4 py-2 text-sm font-bold text-gray-200">Wróć do lobby</button>
    </section>}

    {duel && duel.status === 'completed' && <section className="rounded-3xl border border-yellow-500/30 bg-[#172127] p-5 text-center">
      <Trophy size={34} className="mx-auto mb-2 text-yellow-300" />
      <h3 className="text-xl font-black text-white">{duel.winner_id === userId ? 'Wygrana!' : duel.winner_id ? 'Tym razem przegrana' : 'Remis'}</h3>
      <p className="mt-2 text-sm text-gray-300">Wynik: {duel.challenger_score} : {duel.opponent_score}</p>
      {duel.my_rewards && <p className="mt-2 text-sm text-green-300">Stan serwerowy: {duel.my_rewards.xp} XP · {duel.my_rewards.gems} klejnotów</p>}
      <button onClick={abandonView} className="mt-4 rounded-xl bg-purple-500 px-5 py-3 font-black text-white">Wróć do lobby</button>
    </section>}

    <section className="rounded-3xl border border-[#2A373F] bg-[#172127] p-4 sm:p-5">
      <h3 className="mb-3 text-lg font-black text-white">Wyzwania przychodzące ({incoming.length})</h3>
      {!incoming.length && <p className="text-sm text-gray-500">Brak oczekujących wyzwań.</p>}
      <div className="space-y-2">{incoming.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#10191E] p-3">
        <div><p className="text-sm font-bold text-white">Wyzwanie od gracza</p><p className="text-xs text-gray-500">{new Date(row.created_at).toLocaleString()}</p></div>
        <div className="flex gap-2"><button disabled={working} onClick={() => void respond(row, true)} className="rounded-lg bg-duo-green px-3 py-2 text-xs font-black text-black disabled:opacity-50">Akceptuj</button><button disabled={working} onClick={() => void respond(row, false)} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold text-red-200 disabled:opacity-50">Odrzuć</button></div>
      </div>)}</div>
      <h3 className="mb-3 mt-6 text-lg font-black text-white">Wyślij wyzwanie</h3>
      {!friends.length && <p className="text-sm text-gray-500">Dodaj znajomych, aby wysłać wyzwanie.</p>}
      <div className="space-y-2">{friends.map((friend) => <div key={friend.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#10191E] p-3">
        <div><p className="font-bold text-white">{friend.avatar} {friend.name}</p><p className="text-xs text-gray-500">Poziom {friend.level} · {friend.status}</p></div>
        <button disabled={working || friend.id === userId} onClick={() => void challenge(friend)} className="rounded-lg bg-purple-500 px-3 py-2 text-xs font-black text-white disabled:opacity-50">Wyzwij</button>
      </div>)}</div>
      {outgoing.length > 0 && <p className="mt-3 text-xs text-gray-500">Wysłane wyzwania: {outgoing.length}. Stan odświeża się automatycznie.</p>}
    </section>
  </div>;
};
