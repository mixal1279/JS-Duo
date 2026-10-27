import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock3, LoaderCircle, Swords, Trophy, UserRound, XCircle } from 'lucide-react';
import { AuthSession, DuelPlayer, DuelSummary, OnlineDuelState, cloudSyncService } from '../services/cloudSyncService';
import { UserStats } from '../types';
import { CodeBlock } from './CodeBlock';

interface OnlineDuelViewProps {
  session: AuthSession | null;
  userStats: UserStats;
  onUpdateStats: (newStats: Partial<UserStats>) => void;
}

const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Wystąpił nieznany błąd.';

export const OnlineDuelView: React.FC<OnlineDuelViewProps> = ({ session, userStats, onUpdateStats }) => {
  const [players, setPlayers] = useState<DuelPlayer[]>([]);
  const [duels, setDuels] = useState<DuelSummary[]>([]);
  const [selectedDuelId, setSelectedDuelId] = useState<string | null>(null);
  const [duel, setDuel] = useState<OnlineDuelState | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyPlayerId, setBusyPlayerId] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const timeoutInFlight = useRef(false);
  const rewardedDuelIds = useRef(new Set<string>());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const loadPlayers = async () => {
      try {
        const result = await cloudSyncService.loadDuelPlayers(session);
        if (!cancelled) setPlayers(result);
      } catch (cause) {
        if (!cancelled) setError(errorMessage(cause));
      }
    };
    void loadPlayers();
    const timer = window.setInterval(() => { void loadPlayers(); }, 15000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const result = await cloudSyncService.loadMyDuels(session);
        if (cancelled) return;
        setDuels(result);
        const selectedStillExists = selectedDuelId && result.some((item) => item.id === selectedDuelId);
        if (!selectedStillExists && !selectedDuelId) {
          const ongoing = result.find((item) => item.status === 'active');
          if (ongoing) setSelectedDuelId(ongoing.id);
        }
      } catch (cause) {
        if (!cancelled) setError(errorMessage(cause));
      }
    };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 2500);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [session, selectedDuelId]);

  useEffect(() => {
    if (!session || !selectedDuelId) {
      setDuel(null);
      return;
    }
    let cancelled = false;
    const refreshState = async () => {
      try {
        const result = await cloudSyncService.getDuelState(session, selectedDuelId);
        if (cancelled) return;
        setDuel(result);
        setError('');
        if (result.status === 'active' && result.round_started_at) {
          const elapsed = (Date.now() - Date.parse(result.round_started_at)) / 1000;
          if (elapsed >= 15 && !timeoutInFlight.current) {
            timeoutInFlight.current = true;
            try {
              const advanced = await cloudSyncService.advanceDuelTimeout(session, selectedDuelId);
              if (!cancelled) setDuel(advanced);
            } catch (cause) {
              if (!cancelled) setError(errorMessage(cause));
            } finally {
              timeoutInFlight.current = false;
            }
          }
        }
      } catch (cause) {
        if (!cancelled) setError(errorMessage(cause));
      }
    };
    void refreshState();
    const timer = window.setInterval(() => { void refreshState(); }, 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [session, selectedDuelId]);

  useEffect(() => {
    if (!duel || duel.status !== 'completed' || !session || rewardedDuelIds.current.has(duel.id)) return;
    rewardedDuelIds.current.add(duel.id);
    const storageKey = `js_duo_duel_rewarded_${duel.id}`;
    try {
      if (localStorage.getItem(storageKey) === '1') return;
      localStorage.setItem(storageKey, '1');
    } catch { /* The in-memory guard still prevents duplicate rewards during this session. */ }
    if (duel.winner_id === session.user.id) {
      onUpdateStats({
        xp: userStats.xp + 50,
        gems: userStats.gems + 20,
        duelWins: userStats.duelWins + 1,
      });
    } else if (duel.winner_id && duel.winner_id !== session.user.id) {
      onUpdateStats({ duelLosses: userStats.duelLosses + 1 });
    }
  }, [duel, session, userStats.xp, userStats.gems, userStats.duelWins, userStats.duelLosses, onUpdateStats]);

  const challenge = async (player: DuelPlayer) => {
    if (!session) return;
    setBusyPlayerId(player.id);
    setError('');
    try {
      const id = await cloudSyncService.createDuel(session, player.id);
      setSelectedDuelId(id);
      const state = await cloudSyncService.getDuelState(session, id);
      setDuel(state);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyPlayerId(null);
    }
  };

  const respond = async (item: DuelSummary, accept: boolean) => {
    if (!session) return;
    setBusyPlayerId(item.id);
    setError('');
    try {
      const state = await cloudSyncService.respondToDuel(session, item.id, accept);
      if (accept && state) {
        setSelectedDuelId(item.id);
        setDuel(state);
      } else if (selectedDuelId === item.id) {
        setSelectedDuelId(null);
        setDuel(null);
      }
      setDuels((current) => current.map((duelItem) => duelItem.id === item.id
        ? { ...duelItem, status: accept ? 'active' : 'declined' }
        : duelItem));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyPlayerId(null);
    }
  };

  const submitAnswer = async (answerIndex: number) => {
    if (!session || !duel || answering || duel.status !== 'active' || duel.my_answer) return;
    setAnswering(true);
    setError('');
    try {
      const state = await cloudSyncService.submitDuelAnswer(session, duel.id, answerIndex);
      setDuel(state);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setAnswering(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-xl mx-auto p-6 rounded-3xl bg-[#1C262C] border border-[#2A373F] text-center">
        <Swords size={36} className="mx-auto mb-3 text-purple-400" />
        <h2 className="text-xl font-black text-white mb-2">Pojedynki online 1v1</h2>
        <p className="text-sm text-gray-300">Zaloguj się na konto JS Duo, aby zapraszać prawdziwych graczy i rozgrywać pojedynki online.</p>
      </div>
    );
  }

  const incoming = duels.filter((item) => item.status === 'pending' && item.opponent_id === session.user.id);
  const outgoing = duels.filter((item) => item.status === 'pending' && item.challenger_id === session.user.id);
  const active = duels.filter((item) => item.status === 'active');
  const secondsLeft = duel?.round_started_at
    ? Math.max(0, 15 - Math.floor((now - Date.parse(duel.round_started_at)) / 1000))
    : 15;
  const opponentId = duel?.challenger_id === session.user.id ? duel.opponent_id : duel?.challenger_id;
  const opponent = players.find((player) => player.id === opponentId);
  const myScore = duel?.challenger_id === session.user.id ? duel.challenger_score : duel?.opponent_score;
  const theirScore = duel?.challenger_id === session.user.id ? duel.opponent_score : duel?.challenger_score;

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 py-3 pb-10 space-y-5">
      <div className="rounded-3xl p-5 bg-gradient-to-tr from-[#241738] to-[#1C262C] border-2 border-purple-500/40 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-500/20 flex items-center justify-center">
          <Swords size={30} className="text-purple-300" />
        </div>
        <h2 className="text-2xl font-black text-white">Pojedynki online 1v1</h2>
        <p className="mt-2 text-sm text-gray-300">Rzuć wyzwanie graczowi. Oboje dostaniecie te same 5 pytań, a punkty będą naliczane przez Supabase.</p>
        <div className="mt-4 flex justify-center gap-5 text-sm font-bold">
          <span className="text-emerald-400">Wygrane: {userStats.duelWins}</span>
          <span className="text-rose-400">Przegrane: {userStats.duelLosses}</span>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      {incoming.length > 0 && (
        <section className="rounded-2xl border border-purple-500/40 bg-[#1C262C] p-4">
          <h3 className="font-black text-white mb-3">Otrzymane wyzwania ({incoming.length})</h3>
          <div className="space-y-2">
            {incoming.map((item) => {
              const challenger = players.find((player) => player.id === item.challenger_id);
              return <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 p-3">
                <span className="text-sm text-gray-200">{challenger?.display_name || challenger?.username || 'Gracz'} rzuca Ci wyzwanie</span>
                <div className="flex gap-2">
                  <button disabled={busyPlayerId === item.id} onClick={() => void respond(item, true)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Akceptuj</button>
                  <button disabled={busyPlayerId === item.id} onClick={() => void respond(item, false)} className="rounded-lg bg-gray-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Odrzuć</button>
                </div>
              </div>;
            })}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="rounded-2xl border border-[#2A373F] bg-[#1C262C] p-4">
          <h3 className="font-black text-white mb-2">Wysłane wyzwania</h3>
          {outgoing.map((item) => {
            const target = players.find((player) => player.id === item.opponent_id);
            return <div key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm text-gray-300">
              <span>Czekasz na odpowiedź: {target?.display_name || target?.username || 'Gracz'}</span>
              <button onClick={() => setSelectedDuelId(item.id)} className="text-purple-300 font-bold">Otwórz</button>
            </div>;
          })}
        </section>
      )}

      {active.length > 0 && (
        <section className="rounded-2xl border border-[#2A373F] bg-[#1C262C] p-4">
          <h3 className="font-black text-white mb-2">Aktywne pojedynki</h3>
          {active.map((item) => <button key={item.id} onClick={() => setSelectedDuelId(item.id)} className={`block w-full rounded-xl p-3 text-left text-sm mb-2 ${item.id === selectedDuelId ? 'bg-purple-500/20 border border-purple-400/40 text-white' : 'bg-black/20 text-gray-300'}`}>
            Pojedynek • {item.id.slice(0, 8)}
          </button>)}
        </section>
      )}

      {selectedDuelId && duel && (
        <section className="rounded-3xl border border-purple-500/30 bg-[#1C262C] p-4 sm:p-5">
          {duel.status === 'pending' && (
            <div className="py-8 text-center">
              <Clock3 size={32} className="mx-auto mb-3 text-yellow-400" />
              <h3 className="font-black text-white text-lg">Czekamy na odpowiedź</h3>
              <p className="text-sm text-gray-400 mt-1">Pojedynek rozpocznie się po zaakceptowaniu wyzwania przez drugiego gracza.</p>
            </div>
          )}
          {duel.status === 'active' && duel.question && (
            <>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="text-xs text-purple-300 font-bold uppercase tracking-wide">Runda {duel.current_round + 1}/{duel.round_count}</div>
                  <div className="font-black text-white truncate">{opponent?.display_name || opponent?.username || 'Przeciwnik'}</div>
                </div>
                <div className={`rounded-xl px-3 py-2 font-black tabular-nums ${secondsLeft <= 5 ? 'bg-red-500/20 text-red-300' : 'bg-black/30 text-yellow-300'}`}>
                  <Clock3 size={14} className="inline mr-1" />{secondsLeft}s
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3"><div className="text-xs text-blue-300">Ty</div><div className="text-xl font-black text-white">{myScore ?? 0} pkt</div></div>
                <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3"><div className="text-xs text-purple-300">Rywal</div><div className="text-xl font-black text-white">{theirScore ?? 0} pkt</div></div>
              </div>
              <div className="text-xs text-gray-400 mb-2">{duel.question.unit_title}</div>
              <h3 className="text-lg font-extrabold text-white mb-3">{duel.question.question}</h3>
              {duel.question.code_snippet && <div className="mb-4"><CodeBlock code={duel.question.code_snippet} /></div>}
              <div className="space-y-2">
                {duel.question.options.map((option, index) => {
                  const picked = duel.my_answer?.answer_index === index;
                  return <button key={`${duel.question?.id}-${index}`} disabled={Boolean(duel.my_answer) || answering} onClick={() => void submitAnswer(index)} className={`w-full rounded-xl border p-3 text-left text-sm font-semibold transition-colors ${picked ? (duel.my_answer?.correct ? 'border-emerald-400 bg-emerald-500/15 text-emerald-100' : 'border-red-400 bg-red-500/15 text-red-100') : 'border-[#35434C] bg-[#111B20] text-gray-200 hover:border-purple-400'} disabled:opacity-70`}>
                    <span className="inline-flex w-6 h-6 rounded-lg bg-white/5 items-center justify-center mr-2 text-xs">{String.fromCharCode(65 + index)}</span>{option}
                  </button>;
                })}
              </div>
              {duel.my_answer && <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
                {duel.my_answer.correct ? <CheckCircle2 size={17} className="text-emerald-400" /> : <XCircle size={17} className="text-red-400" />}
                {duel.my_answer.correct ? 'Dobra odpowiedź. Czekamy na rywala…' : 'Odpowiedź zapisana. Czekamy na rywala…'}
              </div>}
              {duel.opponent_answered && !duel.my_answer && <div className="mt-3 text-sm text-gray-400">Rywal już odpowiedział. Wybierz odpowiedź przed końcem czasu.</div>}
              {answering && <div className="mt-3 text-xs text-gray-400"><LoaderCircle size={14} className="inline animate-spin mr-1" />Zapisywanie odpowiedzi…</div>}
            </>
          )}
          {duel.status === 'completed' && (
            <div className="py-7 text-center">
              <Trophy size={40} className="mx-auto mb-3 text-yellow-300" />
              <h3 className="text-2xl font-black text-white">{duel.winner_id === session.user.id ? 'Wygrywasz!' : duel.winner_id ? 'Tym razem przegrana' : 'Remis!'}</h3>
              <p className="mt-2 text-gray-300">{myScore ?? 0} : {theirScore ?? 0}</p>
              <p className="mt-2 text-sm text-gray-400">{duel.winner_id === session.user.id ? 'Nagroda: +50 XP i +20 klejnotów.' : 'Dzięki za pojedynek.'}</p>
              <button onClick={() => { setSelectedDuelId(null); setDuel(null); }} className="mt-5 rounded-xl bg-purple-600 px-5 py-3 font-bold text-white">Wróć do lobby</button>
            </div>
          )}
          {(duel.status === 'declined' || duel.status === 'cancelled') && <div className="py-6 text-center text-gray-300">To wyzwanie zostało odrzucone lub anulowane.</div>}
        </section>
      )}

      <section className="rounded-2xl border border-[#2A373F] bg-[#1C262C] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-white">Gracze JS Duo</h3>
          <span className="text-xs text-gray-400">{players.length} kont</span>
        </div>
        {loading ? <p className="text-sm text-gray-400">Ładowanie graczy…</p> : players.length === 0 ? (
          <div className="text-sm text-gray-400 py-3"><UserRound size={18} className="inline mr-2" />Na razie nie ma innych kont do zaproszenia.</div>
        ) : <div className="space-y-2">
          {players.map((player) => <div key={player.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl">{player.avatar_emoji || '🦉'}</span>
              <div className="min-w-0"><div className="font-bold text-white truncate">{player.display_name || player.username}</div><div className="text-xs text-gray-500 truncate">@{player.username}</div></div>
            </div>
            <button disabled={busyPlayerId === player.id} onClick={() => void challenge(player)} className="shrink-0 rounded-xl bg-purple-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">
              {busyPlayerId === player.id ? 'Wysyłanie…' : 'Wyzwij'}
            </button>
          </div>)}
        </div>}
      </section>
    </div>
  );
};
