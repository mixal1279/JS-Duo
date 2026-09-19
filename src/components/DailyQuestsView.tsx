import React from 'react';
import { Target, Gift, Zap, Gem, CheckCircle, Clock, ShieldAlert, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DailyQuest, UserStats } from '../types';
import { soundService } from '../services/soundService';

interface DailyQuestsViewProps {
  quests: DailyQuest[];
  userStats: UserStats;
  onClaimQuest: (questId: string) => void;
  onBuyItem: (type: 'hearts' | 'freeze', cost: number) => void;
}

export const DailyQuestsView: React.FC<DailyQuestsViewProps> = ({
  quests,
  userStats,
  onClaimQuest,
  onBuyItem,
}) => {
  const allCompleted = quests.every((q) => q.current >= q.target);
  const allClaimed = quests.every((q) => q.claimed);

  const daysOfWeek = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];
  const todayIdx = (new Date().getDay() + 6) % 7; // 0 for Mon ... 6 for Sun

  const handleClaim = (q: DailyQuest) => {
    if (q.claimed || q.current < q.target) return;
    soundService.playLevelUp();
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.5 },
    });
    onClaimQuest(q.id);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 pb-24">
      {/* Daily Challenges Header */}
      <div className="rounded-3xl p-5 mb-6 bg-[#1B262C] border-2 border-duo-green/40 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target size={24} className="text-duo-green" />
            <h2 className="text-xl font-black text-white tracking-tight">
              Codzienne Wyzwania
            </h2>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400">
            <Clock size={13} />
            <span>Reset o 00:00</span>
          </div>
        </div>
        <p className="text-xs text-gray-300 mb-4">
          Wypełnij wyzwania każdego dnia, aby zdobyć dodatkowe XP, diamenty i utrzymać swoją passę!
        </p>

        {/* Streak Weekly Tracker */}
        <div className="bg-[#131F24] p-3 rounded-2xl border border-[#2A373F]">
          <div className="flex items-center justify-between text-xs font-bold text-gray-300 mb-2">
            <span>Passa w tym tygodniu:</span>
            <span className="text-[#FF9600] font-black">{userStats.streak} dni z rzędu 🔥</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {daysOfWeek.map((day, idx) => {
              const isPastOrToday = idx <= todayIdx;
              return (
                <div
                  key={day}
                  className={`py-2 rounded-xl border flex flex-col items-center gap-1 ${
                    idx === todayIdx
                      ? 'bg-orange-500/20 border-[#FF9600] text-[#FF9600] font-black'
                      : isPastOrToday
                      ? 'bg-[#1C2C35] border-duo-green/40 text-duo-green font-bold'
                      : 'bg-[#172026] border-[#2A373F] text-gray-500 font-medium'
                  }`}
                >
                  <span className="text-[10px] uppercase">{day}</span>
                  <span className="text-xs">{isPastOrToday ? '🔥' : '•'}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quests List */}
      <div className="space-y-3 mb-8">
        {quests.map((quest) => {
          const isDone = quest.current >= quest.target;
          const progressPercent = Math.min(100, (quest.current / quest.target) * 100);

          return (
            <div
              key={quest.id}
              className={`p-4 rounded-2xl border-2 transition-all ${
                quest.claimed
                  ? 'bg-[#151E24] border-[#243038] opacity-70'
                  : isDone
                  ? 'bg-[#1A2F25] border-duo-green shadow-md'
                  : 'bg-[#1C262C] border-[#2A373F]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    {quest.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{quest.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-xs font-black text-duo-yellow bg-black/40 px-2 py-1 rounded-lg">
                    <Zap size={13} className="fill-duo-yellow" />
                    +{quest.xpReward}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-black text-duo-blue bg-black/40 px-2 py-1 rounded-lg">
                    <Gem size={13} className="fill-duo-blue" />
                    +{quest.gemsReward}
                  </span>
                </div>
              </div>

              {/* Progress & Claim Button */}
              <div className="flex items-center justify-between gap-4 mt-3">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                    <span>Postęp</span>
                    <span>
                      {quest.current} / {quest.target}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isDone ? 'bg-duo-green' : 'bg-duo-blue'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {quest.claimed ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-gray-400 px-3 py-1.5">
                    <CheckCircle size={16} className="text-duo-green" />
                    Odebrano
                  </span>
                ) : (
                  <button
                    onClick={() => handleClaim(quest)}
                    disabled={!isDone}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      isDone
                        ? 'bg-duo-green hover:bg-duo-greenDark text-black shadow-[0_3px_0_#46a302] active:translate-y-0.5 cursor-pointer animate-pulse'
                        : 'bg-[#2A373F] text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Odbierz
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bonus Mega-Chest */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#2B2313] to-[#1F1C16] border-2 border-yellow-500/50 flex items-center justify-between gap-4 shadow-lg mb-8">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-2xl shrink-0">
            🎁
          </div>
          <div>
            <h4 className="font-black text-sm text-yellow-400">
              Skrzynia Mistrza Dnia
            </h4>
            <p className="text-xs text-gray-300 mt-0.5">
              Ukończ wszystkie 4 wyzwania, aby odebrać super-nagrodę (+100 XP i +50 diamentów)!
            </p>
          </div>
        </div>
        <button
          disabled={!allCompleted || allClaimed}
          onClick={() => {
            soundService.playLevelUp();
            confetti({ particleCount: 100, spread: 80 });
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase shrink-0 transition-all ${
            allCompleted && !allClaimed
              ? 'bg-yellow-400 text-black shadow-[0_3px_0_#b28900] active:translate-y-0.5 animate-bounce'
              : 'bg-[#2A373F] text-gray-500 cursor-not-allowed'
          }`}
        >
          {allClaimed ? 'Odebrano' : 'Otwórz'}
        </button>
      </div>

      {/* Item Shop for Gems */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-3 px-1">
          Sklep za Diamenty (Gems Shop)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#1C262C] border border-[#2A373F] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-duo-red">
                <Heart size={22} className="fill-duo-red" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Pełne Serca</h4>
                <p className="text-xs text-gray-400">Odnów 5 żyć natychmiast</p>
              </div>
            </div>
            <button
              onClick={() => onBuyItem('hearts', 50)}
              disabled={userStats.gems < 50 || userStats.hearts >= userStats.maxHearts}
              className="px-3 py-1.5 rounded-xl bg-duo-blue hover:bg-duo-blueDark text-white text-xs font-extrabold flex items-center gap-1 shadow disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Gem size={13} className="fill-white" />
              <span>50</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#1C262C] border border-[#2A373F] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-duo-blue">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Zamrożenie Passy</h4>
                <p className="text-xs text-gray-400">Chroni streak na 1 dzień</p>
              </div>
            </div>
            <button
              onClick={() => onBuyItem('freeze', 80)}
              disabled={userStats.gems < 80}
              className="px-3 py-1.5 rounded-xl bg-duo-blue hover:bg-duo-blueDark text-white text-xs font-extrabold flex items-center gap-1 shadow disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Gem size={13} className="fill-white" />
              <span>80</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
