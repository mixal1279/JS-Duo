import React from 'react';
import { Flame, Gem, Heart, Trophy, Keyboard, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { UserStats, DailyQuest } from '../types';
import { storageService } from '../services/storageService';

interface DesktopRightPanelProps {
  stats: UserStats;
  quests: DailyQuest[];
  onRefillHearts: () => void;
  onOpenLeaderboard: () => void;
  onOpenQuests: () => void;
}

export const DesktopRightPanel: React.FC<DesktopRightPanelProps> = ({
  stats,
  quests,
  onRefillHearts,
  onOpenLeaderboard,
  onOpenQuests,
}) => {
  const levelInfo = storageService.calculateLevel(stats.xp);
  const currentXpProgress = Math.min(
    100,
    ((stats.xp - levelInfo.currentLevelXp) / (levelInfo.nextLevelXp - levelInfo.currentLevelXp)) * 100
  );

  return (
    <div className="hidden lg:flex flex-col w-80 shrink-0 p-4 space-y-4 sticky top-0 h-screen overflow-y-auto">
      {/* Top Quick Stats Card */}
      <div className="bg-[#172227] border-2 border-[#2A373F] rounded-3xl p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Streak */}
          <div
            className="flex flex-col items-center p-2 rounded-2xl bg-[#1C2830] border border-[#263742]"
            title={`Passa nauki: ${stats.streak} dni z rzędu!`}
          >
            <div className="flex items-center gap-1 text-[#FF9600]">
              <Flame size={20} className="fill-[#FF9600] animate-pulse-subtle" />
              <span className="font-black text-base">{stats.streak}</span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Dni passy</span>
          </div>

          {/* Gems */}
          <div
            className="flex flex-col items-center p-2 rounded-2xl bg-[#1C2830] border border-[#263742]"
            title={`Kryształy: ${stats.gems}`}
          >
            <div className="flex items-center gap-1 text-[#1CB0F6]">
              <Gem size={19} className="fill-[#1CB0F6]" />
              <span className="font-black text-base">{stats.gems}</span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Kryształy</span>
          </div>

          {/* Hearts */}
          <button
            onClick={onRefillHearts}
            className={`flex flex-col items-center p-2 rounded-2xl border transition-transform active:scale-95 cursor-pointer ${
              stats.hearts > 0
                ? 'bg-[#1C2830] border-[#263742] text-[#FF4B4B]'
                : 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
            }`}
            title="Kliknij, aby odnowić serca"
          >
            <div className="flex items-center gap-1 text-[#FF4B4B]">
              <Heart size={19} className={stats.hearts > 0 ? 'fill-[#FF4B4B]' : 'text-red-400'} />
              <span className="font-black text-base">
                {stats.hearts}/{stats.maxHearts}
              </span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Serca</span>
          </button>
        </div>

        {/* Level and XP progress bar */}
        <div className="mt-4 pt-3 border-t border-[#24333D]">
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <div className="flex items-center gap-1.5 text-duo-yellow">
              <Sparkles size={14} />
              <span>Poziom {levelInfo.level}</span>
            </div>
            <span className="text-gray-400 font-mono">
              {stats.xp} / {levelInfo.nextLevelXp} XP
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#23313A] rounded-full overflow-hidden">
            <div
              className="h-full bg-duo-green rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(88,204,2,0.4)]"
              style={{ width: `${currentXpProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Daily Quests Mini Card */}
      <div className="bg-[#172227] border-2 border-[#2A373F] rounded-3xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Dzisiejsze zadania
          </h3>
          <button
            onClick={onOpenQuests}
            className="text-xs font-bold text-duo-blue hover:underline flex items-center gap-0.5"
          >
            <span>Więcej</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="space-y-2.5">
          {quests.slice(0, 3).map((quest) => {
            const isDone = quest.current >= quest.target;
            const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));

            return (
              <div key={quest.id} className="p-2.5 rounded-2xl bg-[#1C2830] border border-[#24333D]">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-gray-200 truncate pr-2">{quest.title}</span>
                  {isDone ? (
                    <span className="text-duo-green flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 size={13} />
                      <span>Gotowe</span>
                    </span>
                  ) : (
                    <span className="text-gray-400 font-mono text-[11px] shrink-0">
                      {quest.current}/{quest.target}
                    </span>
                  )}
                </div>
                <div className="w-full h-1.5 bg-[#253540] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isDone ? 'bg-duo-green' : 'bg-duo-yellow'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Keyboard Shortcuts Card */}
      <div className="bg-[#172227] border-2 border-[#2A373F] rounded-3xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-white">
          <div className="w-6 h-6 rounded-lg bg-duo-blue/20 border border-duo-blue/40 flex items-center justify-center text-duo-blue">
            <Keyboard size={14} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider">
            Skróty klawiszowe PC
          </h3>
        </div>

        <div className="space-y-1.5 text-xs text-gray-300">
          <div className="flex items-center justify-between py-1 border-b border-[#24333D]/60">
            <span className="text-gray-400">Wybór opcji</span>
            <span className="font-mono font-bold bg-[#1F2B33] px-2 py-0.5 rounded border border-[#2D3F4B] text-duo-yellow">
              1, 2, 3, 4
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#24333D]/60">
            <span className="text-gray-400">Sprawdź / Dalej</span>
            <span className="font-mono font-bold bg-[#1F2B33] px-2 py-0.5 rounded border border-[#2D3F4B] text-duo-green">
              Enter
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#24333D]/60">
            <span className="text-gray-400">Zamknij okno</span>
            <span className="font-mono font-bold bg-[#1F2B33] px-2 py-0.5 rounded border border-[#2D3F4B] text-gray-300">
              Esc
            </span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-gray-400">Przełącz zakładki</span>
            <span className="font-mono font-bold bg-[#1F2B33] px-2 py-0.5 rounded border border-[#2D3F4B] text-duo-blue">
              Klawisze 1-5
            </span>
          </div>
        </div>
      </div>

      {/* Diamond League Mini Card */}
      <div
        onClick={onOpenLeaderboard}
        className="bg-gradient-to-br from-[#1C2A33] to-[#162128] border-2 border-duo-yellow/40 rounded-3xl p-4 shadow-sm cursor-pointer hover:border-duo-yellow transition-all transform hover:-translate-y-0.5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-duo-yellow/20 border border-duo-yellow/50 flex items-center justify-center text-duo-yellow shadow">
            <Trophy size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black uppercase text-duo-yellow tracking-wider">
              Diamentowa Liga
            </h4>
            <p className="text-xs font-bold text-gray-200">
              Jesteś w Top 5 w tym tygodniu!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
