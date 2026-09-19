import React, { useState, useEffect } from 'react';
import { Swords, Zap, Timer, Trophy, UserCheck, RefreshCw, ArrowRight, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Friend, Question, UserStats } from '../types';
import { ALL_QUESTIONS } from '../data/questionsData';
import { CodeBlock } from './CodeBlock';
import { MascotOwl } from './MascotOwl';
import { soundService } from '../services/soundService';

interface DuelViewProps {
  friends: Friend[];
  userStats: UserStats;
  onUpdateStats: (newStats: Partial<UserStats>) => void;
}

export const DuelView: React.FC<DuelViewProps> = ({
  friends,
  userStats,
  onUpdateStats,
}) => {
  const [duelState, setDuelState] = useState<'lobby' | 'matchmaking' | 'battle' | 'results'>('lobby');
  const [opponent, setOpponent] = useState<Friend | null>(null);
  const [duelQuestions, setDuelQuestions] = useState<Question[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [opponentAnswered, setOpponentAnswered] = useState<boolean>(false);
  const [opponentGotCorrect, setOpponentGotCorrect] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [roundFinished, setRoundFinished] = useState(false);

  // Matchmaking or challenge initiation
  const startDuel = (selectedFriend?: Friend) => {
    setDuelState('matchmaking');
    soundService.playClick();

    setTimeout(() => {
      const chosenOpponent = selectedFriend || friends[Math.floor(Math.random() * friends.length)];
      setOpponent(chosenOpponent);

      // Pick 5 random questions across the 500 questions bank
      const shuffled = [...ALL_QUESTIONS].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 5);
      setDuelQuestions(selected);

      setCurrentRound(0);
      setUserScore(0);
      setOpponentScore(0);
      setUserAnswer(null);
      setOpponentAnswered(false);
      setRoundFinished(false);
      setTimeLeft(15);
      setDuelState('battle');
    }, 1200);
  };

  const currentQ = duelQuestions[currentRound];

  // Round Timer
  useEffect(() => {
    if (duelState !== 'battle' || roundFinished) return;

    if (timeLeft <= 0) {
      handleTimeOut();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [duelState, timeLeft, roundFinished]);

  // Simulate Opponent Behavior (answers between 3 and 8 seconds with ~75% accuracy)
  useEffect(() => {
    if (duelState !== 'battle' || roundFinished || opponentAnswered) return;

    const delay = Math.floor(Math.random() * 4000) + 3000;
    const oppTimer = setTimeout(() => {
      const isCorrect = Math.random() < 0.75;
      setOpponentAnswered(true);
      setOpponentGotCorrect(isCorrect);
      if (isCorrect) {
        setOpponentScore((prev) => prev + (currentQ?.points || 15));
      }
    }, delay);

    return () => clearTimeout(oppTimer);
  }, [duelState, currentRound, roundFinished, opponentAnswered]);

  const handleSelectAnswer = (idx: number) => {
    if (userAnswer !== null || roundFinished) return;
    setUserAnswer(idx);
    soundService.playClick();

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      soundService.playCorrect();
      setUserScore((prev) => prev + currentQ.points);
    } else {
      soundService.playWrong();
    }

    // Wait 1.5s to show both answers before next round or finish
    setTimeout(() => {
      setRoundFinished(true);
    }, 1200);
  };

  const handleTimeOut = () => {
    setRoundFinished(true);
    soundService.playWrong();
  };

  const handleNextRound = () => {
    if (currentRound + 1 < duelQuestions.length) {
      setCurrentRound((prev) => prev + 1);
      setUserAnswer(null);
      setOpponentAnswered(false);
      setOpponentGotCorrect(false);
      setRoundFinished(false);
      setTimeLeft(15);
    } else {
      // Duel finished
      setDuelState('results');
      const won = userScore > opponentScore;
      if (won) {
        soundService.playLevelUp();
        confetti({ particleCount: 100, spread: 80 });
        onUpdateStats({
          xp: userStats.xp + 50,
          gems: userStats.gems + 20,
          duelWins: userStats.duelWins + 1,
        });
      } else {
        onUpdateStats({
          duelLosses: userStats.duelLosses + 1,
        });
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto px-2 sm:px-4 py-2 sm:py-4 pb-8 select-none">
      {/* LOBBY VIEW */}
      {duelState === 'lobby' && (
        <div>
          {/* Hero Banner */}
          <div className="rounded-3xl p-5 mb-6 bg-gradient-to-tr from-[#241738] to-[#1C262C] border-2 border-purple-500/50 shadow-xl text-center">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-3xl bg-purple-500/20 border-2 border-purple-400/60 flex items-center justify-center">
                <Swords size={34} className="text-purple-400" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Pojedynki 1v1 ze Znajomymi
            </h2>
            <p className="text-xs text-gray-300 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
              Zmierz się w szybkim 5-rundowym starciu na wiedzę z JavaScriptu! Kto szybciej i celniej odpowie, zgarnia +50 XP oraz diamenty.
            </p>

            {/* Duel Stats pill */}
            <div className="inline-flex items-center gap-4 px-4 py-2 rounded-2xl bg-black/40 border border-white/10 text-xs font-bold mb-4">
              <span className="text-duo-green">Wygrane: {userStats.duelWins}</span>
              <span className="text-gray-500">|</span>
              <span className="text-duo-red">Przegrane: {userStats.duelLosses}</span>
              <span className="text-gray-500">|</span>
              <span className="text-yellow-400">
                Winrate:{' '}
                {userStats.duelWins + userStats.duelLosses > 0
                  ? Math.round((userStats.duelWins / (userStats.duelWins + userStats.duelLosses)) * 100)
                  : 0}
                %
              </span>
            </div>

            <div>
              <button
                onClick={() => startDuel()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-black text-sm uppercase tracking-wider shadow-[0_4px_0_#4c1d95] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                <span>Szybki pojedynek (Dobierz rywala)</span>
              </button>
            </div>
          </div>

          {/* Friends List with Duel Action */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-400">
                Twoi Znajomi ({friends.length})
              </h3>
              <span className="text-xs text-duo-green font-bold">
                {friends.filter((f) => f.status === 'online').length} online
              </span>
            </div>

            <div className="space-y-2.5">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1C262C] border border-[#2A373F] hover:bg-[#223038] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <span className="text-2xl">{friend.avatar}</span>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#1C262C] ${
                          friend.status === 'online'
                            ? 'bg-duo-green'
                            : friend.status === 'w grze'
                            ? 'bg-yellow-400'
                            : 'bg-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{friend.name}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span>Poz. {friend.level}</span>
                        <span>•</span>
                        <span className="text-purple-300 font-medium">
                          {friend.duelWins} wygranych pojedynków
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => startDuel(friend)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Swords size={14} />
                    <span>Zaproś</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MATCHMAKING ANIMATION */}
      {duelState === 'matchmaking' && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mb-6 flex items-center justify-center">
            <Swords size={32} className="text-purple-400" />
          </div>
          <h3 className="text-xl font-black text-white mb-1">Szukanie rywala...</h3>
          <p className="text-xs text-gray-400">Dobieramy programistę o zbliżonym poziomie w JS Duo</p>
        </div>
      )}

      {/* ACTIVE BATTLE */}
      {duelState === 'battle' && currentQ && (
        <div>
          {/* Split Top Scoreboard */}
          <div className="bg-[#1C262C] border-2 border-[#2A373F] rounded-3xl p-3.5 mb-4 shadow-lg">
            <div className="flex items-center justify-between">
              {/* User Side */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-duo-blue/20 border border-duo-blue flex items-center justify-center text-xl">
                  🦉
                </div>
                <div>
                  <span className="text-xs font-black text-duo-blue">Ty</span>
                  <div className="text-base font-black text-white">{userScore} pkt</div>
                </div>
              </div>

              {/* Center: Timer & Round */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Runda {currentRound + 1}/5
                </span>
                <div
                  className={`flex items-center gap-1 text-sm font-black px-2.5 py-0.5 rounded-full mt-0.5 ${
                    timeLeft <= 5
                      ? 'bg-red-500/20 text-red-400 border border-red-500 animate-pulse'
                      : 'bg-black/30 text-yellow-400'
                  }`}
                >
                  <Timer size={14} />
                  <span>{timeLeft}s</span>
                </div>
              </div>

              {/* Opponent Side */}
              <div className="flex items-center gap-2 text-right">
                <div>
                  <span className="text-xs font-black text-purple-400">{opponent?.name}</span>
                  <div className="text-base font-black text-white">{opponentScore} pkt</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500 flex items-center justify-center text-xl">
                  {opponent?.avatar || '🦁'}
                </div>
              </div>
            </div>

            {/* Live Opponent Status Indicator */}
            <div className="mt-2 pt-2 border-t border-[#2A373F] flex items-center justify-between text-[11px] font-bold">
              <span className="text-gray-400">
                {userAnswer !== null ? 'Oddałeś odpowiedź!' : 'Wybierz odpowiedź...'}
              </span>
              <span className={opponentAnswered ? 'text-duo-green' : 'text-gray-500'}>
                {opponentAnswered ? 'Rywal odpowiedział! ⚡' : 'Rywal jeszcze myśli...'}
              </span>
            </div>
          </div>

          {/* Question Prompt */}
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-black text-white mb-2 leading-snug">
              {currentQ.question}
            </h3>
            {currentQ.codeSnippet && <CodeBlock code={currentQ.codeSnippet} />}
          </div>

          {/* Options */}
          <div className="space-y-2.5 mb-6">
            {currentQ.options.map((opt, idx) => {
              const isSelected = userAnswer === idx;
              let btnStyle = 'bg-[#202F36] border-[#2A373F] text-gray-200 hover:bg-[#253942]';

              if (userAnswer !== null) {
                if (idx === currentQ.correctIndex) {
                  btnStyle = 'bg-green-950/40 border-duo-green text-green-300';
                } else if (isSelected) {
                  btnStyle = 'bg-red-950/40 border-duo-red text-red-300';
                } else {
                  btnStyle = 'bg-[#202F36] opacity-40 border-[#2A373F] text-gray-400';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={userAnswer !== null}
                  onClick={() => handleSelectAnswer(idx)}
                  className={`w-full p-3.5 rounded-2xl border-2 text-left font-bold text-sm flex items-center justify-between transition-all ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {userAnswer !== null && idx === currentQ.correctIndex && (
                    <CheckCircle2 size={18} className="text-duo-green shrink-0" />
                  )}
                  {userAnswer !== null && isSelected && idx !== currentQ.correctIndex && (
                    <XCircle size={18} className="text-duo-red shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Next Round Button */}
          {roundFinished && (
            <button
              onClick={handleNextRound}
              className="w-full py-3.5 rounded-2xl bg-duo-green hover:bg-duo-greenDark text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_0_#46a302] active:translate-y-0.5"
            >
              <span>{currentRound + 1 === 5 ? 'Zobacz wyniki pojedynku' : 'Następna runda'}</span>
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      )}

      {/* RESULTS SCREEN */}
      {duelState === 'results' && (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          {userScore > opponentScore ? (
            <>
              <div className="text-5xl mb-3 animate-bounce">🏆</div>
              <h2 className="text-2xl sm:text-3xl font-black text-yellow-400 mb-1">
                Zwycięstwo w pojedynku!
              </h2>
              <p className="text-xs text-gray-300 mb-6">
                Pokonałeś programistę {opponent?.name} wiedzą z JavaScriptu!
              </p>
            </>
          ) : userScore === opponentScore ? (
            <>
              <div className="text-5xl mb-3">🤝</div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-200 mb-1">Remis!</h2>
              <p className="text-xs text-gray-300 mb-6">Wyrównane starcie dwóch tytanów kodu!</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3">💔</div>
              <h2 className="text-2xl sm:text-3xl font-black text-duo-red mb-1">Porażka</h2>
              <p className="text-xs text-gray-300 mb-6">
                {opponent?.name} był tym razem szybszy. Przećwicz lekcje i zrewanżuj się!
              </p>
            </>
          )}

          {/* Score Comparison Box */}
          <div className="flex items-center justify-center gap-6 bg-[#1C262C] border-2 border-[#2A373F] p-5 rounded-3xl w-full max-w-sm mb-6">
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-1">🦉</span>
              <span className="text-xs font-bold text-gray-400">Ty</span>
              <span className="text-2xl font-black text-white">{userScore}</span>
            </div>
            <div className="text-xl font-black text-gray-500">VS</div>
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-1">{opponent?.avatar || '🦁'}</span>
              <span className="text-xs font-bold text-gray-400">{opponent?.name}</span>
              <span className="text-2xl font-black text-white">{opponentScore}</span>
            </div>
          </div>

          {userScore > opponentScore && (
            <div className="flex items-center gap-3 mb-6 bg-duo-green/10 border border-duo-green/40 px-4 py-2 rounded-2xl text-xs font-black text-duo-green">
              <span>+50 XP</span>
              <span>•</span>
              <span>+20 Kryształów</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <button
              onClick={() => startDuel(opponent || undefined)}
              className="flex-1 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow"
            >
              <RefreshCw size={15} />
              <span>Rewanż</span>
            </button>
            <button
              onClick={() => setDuelState('lobby')}
              className="flex-1 py-3.5 rounded-2xl bg-[#232E35] hover:bg-[#2C3B44] text-gray-200 font-bold text-xs uppercase tracking-wider"
            >
              Powrót do lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
