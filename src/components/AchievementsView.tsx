import React, { useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { UserStats, Achievement } from '../types';
import { calculateAchievements } from '../data/achievementsData';

interface AchievementsViewProps {
  userStats: UserStats;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({ userStats }) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'unlocked' | 'locked' | 'streak' | 'skills'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const achievements = calculateAchievements(userStats);
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  const filteredAchievements = achievements.filter((ach) => {
    if (filterCategory === 'unlocked') return ach.isUnlocked;
    if (filterCategory === 'locked') return !ach.isUnlocked;
    if (filterCategory === 'streak') return ach.category === 'streak';
    if (filterCategory === 'skills') return ach.category === 'skills';
    return true;
  });

  return (
    <div className="space-y-4 pb-8 select-none">
      {/* Main Section: ACHIEVEMENTS / OSIĄGNIĘCIA */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#172227] border-2 border-[#2A373F] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-duo-yellow/20 border-2 border-duo-yellow/50 flex items-center justify-center text-2xl text-duo-yellow shadow-sm">
              🏆
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Osiągnięcia i Odznaki</span>
                <span className="text-xs font-extrabold bg-duo-yellow/20 text-duo-yellow px-2 py-0.5 rounded-full border border-duo-yellow/40">
                  {unlockedCount} / {totalCount}
                </span>
              </h2>
              <p className="text-xs font-bold text-gray-400 mt-0.5">
                Zdobywaj unikalne odznaki za kamienie milowe w nauce JavaScriptu
              </p>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="sm:w-48 bg-[#121B20] p-2.5 rounded-2xl border border-[#263742]">
            <div className="flex items-center justify-between text-[11px] font-black text-gray-300 mb-1">
              <span>Odblokowano</span>
              <span className="text-duo-yellow">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-[#202E36] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-duo-yellow to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-black">
          {[
            { id: 'all', label: 'Wszystkie' },
            { id: 'unlocked', label: `Odblokowane (${unlockedCount})` },
            { id: 'locked', label: `Do zdobycia (${totalCount - unlockedCount})` },
            { id: 'streak', label: 'Passa & Czas' },
            { id: 'skills', label: 'Umiejętności Kodowania' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap border-2 ${
                filterCategory === tab.id
                  ? 'bg-duo-blue border-duo-blue text-white shadow-[0_2px_0_#1899d6]'
                  : 'bg-[#172227] border-[#2A373F] text-gray-400 hover:text-white hover:bg-[#1E2B32]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Achievements Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredAchievements.map((ach) => {
            const isDone = ach.isUnlocked;
            const pct = Math.min(100, Math.round((ach.current / ach.target) * 100));

            return (
              <div
                key={ach.id}
                onClick={() => setSelectedAchievement(ach)}
                className={`relative p-4 rounded-3xl border-2 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 ${
                  isDone
                    ? 'bg-gradient-to-br from-[#1C2C36] to-[#15232B] border-duo-yellow/60 hover:border-duo-yellow shadow-[0_4px_12px_rgba(255,215,0,0.12)]'
                    : 'bg-[#152026] border-[#253540] hover:border-[#3A4E5C] opacity-90'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Badge Shield Icon Container */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 border-2 transition-transform ${
                      isDone
                        ? 'bg-gradient-to-b from-duo-yellow/30 to-amber-600/20 border-duo-yellow text-duo-yellow shadow-[0_0_15px_rgba(255,215,0,0.3)]'
                        : 'bg-[#1B2730] border-[#2D3E4A] text-gray-500 grayscale'
                    }`}
                  >
                    <span>{ach.icon}</span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3
                        className={`text-base font-black truncate ${
                          isDone ? 'text-white' : 'text-gray-300'
                        }`}
                      >
                        {ach.title}
                      </h3>

                      {isDone ? (
                        <span className="flex items-center gap-1 text-[11px] font-black text-duo-green bg-duo-green/15 px-2 py-0.5 rounded-full border border-duo-green/40 shrink-0">
                          <CheckCircle2 size={12} />
                          <span>ZDOBYTO</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-[#1F2C34] px-2 py-0.5 rounded-full border border-[#2D3F4B] shrink-0">
                          <Lock size={11} />
                          <span>{pct}%</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 font-medium mt-1 leading-snug line-clamp-2">
                      {ach.description}
                    </p>

                    {/* Progress Bar & Values */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className="text-gray-400 font-mono">
                          {ach.current} / {ach.target} {ach.unit}
                        </span>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-duo-yellow font-bold flex items-center gap-0.5">
                            +{ach.rewardGems} 💎
                          </span>
                          <span className="text-duo-green font-bold">
                            +{ach.rewardXp} XP
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-2 bg-[#10171B] rounded-full overflow-hidden border border-[#22313B]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDone
                              ? 'bg-duo-green shadow-[0_0_8px_rgba(88,204,2,0.4)]'
                              : 'bg-duo-yellow'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedAchievement(null)}
        >
          <div
            className="bg-[#18252C] border-2 border-[#2D404D] rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedAchievement(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-xl bg-[#202F37] border border-[#2D3F4B]"
            >
              ✕
            </button>

            {/* Big Badge Visual */}
            <div
              className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center text-5xl mb-4 border-4 shadow-xl ${
                selectedAchievement.isUnlocked
                  ? 'bg-gradient-to-b from-duo-yellow/30 to-amber-600/30 border-duo-yellow shadow-[0_0_30px_rgba(255,215,0,0.3)] animate-bounce-subtle'
                  : 'bg-[#1B2730] border-[#2E414E] text-gray-500'
              }`}
            >
              <span>{selectedAchievement.icon}</span>
            </div>

            <div className="mb-2">
              <span
                className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  selectedAchievement.isUnlocked
                    ? 'bg-duo-green/20 text-duo-green border-duo-green/40'
                    : 'bg-gray-700/40 text-gray-400 border-gray-600/40'
                }`}
              >
                {selectedAchievement.isUnlocked ? 'Odznaka Odblokowana' : 'W trakcie zdobywania'}
              </span>
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight">
              {selectedAchievement.title}
            </h3>

            <p className="text-sm text-gray-300 font-medium mt-2 mb-4 leading-relaxed">
              {selectedAchievement.description}
            </p>

            {/* Progress breakdown */}
            <div className="bg-[#121B20] p-3 rounded-2xl border border-[#263742] mb-5">
              <div className="flex items-center justify-between text-xs font-black text-gray-300 mb-1.5">
                <span>Twój aktualny wynik:</span>
                <span className="font-mono text-duo-yellow">
                  {selectedAchievement.current} / {selectedAchievement.target}{' '}
                  {selectedAchievement.unit}
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#202E36] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    selectedAchievement.isUnlocked ? 'bg-duo-green' : 'bg-duo-yellow'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (selectedAchievement.current / selectedAchievement.target) * 100
                      )
                    )}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-around mt-3 pt-2.5 border-t border-[#22313A] text-xs font-bold">
                <div className="text-duo-yellow">Nagroda: +{selectedAchievement.rewardGems} 💎</div>
                <div className="text-duo-green">+{selectedAchievement.rewardXp} XP</div>
              </div>
            </div>

            <button
              onClick={() => setSelectedAchievement(null)}
              className="w-full py-3 rounded-2xl font-black uppercase tracking-wider bg-duo-green text-black hover:bg-[#46a302] transition-colors shadow-[0_4px_0_#388402] active:translate-y-0.5"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
