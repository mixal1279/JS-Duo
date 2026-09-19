import React from 'react';
import { Flame, Gem, Heart, Bell, BookOpen, Sparkles } from 'lucide-react';
import { UserStats } from '../types';
import { storageService } from '../services/storageService';

interface NavbarProps {
  stats: UserStats;
  onOpenExplorer: () => void;
  onOpenNotifications: () => void;
  onRefillHearts: () => void;
  onOpenProfile?: () => void;
  onShowStreakToast?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  onOpenExplorer,
  onOpenNotifications,
  onRefillHearts,
  onOpenProfile,
  onShowStreakToast,
}) => {
  const levelInfo = storageService.calculateLevel(stats.xp);
  const currentXpProgress = Math.min(100, ((stats.xp - levelInfo.currentLevelXp) / (levelInfo.nextLevelXp - levelInfo.currentLevelXp)) * 100);

  return (
    <header className="sticky top-0 z-30 bg-[#131F24]/95 backdrop-blur border-b border-[#2A373F] px-4 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Left: Brand */}
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Kliknij, aby otworzyć Profil i Osiągnięcia"
        >
          <div className="w-9 h-9 rounded-xl bg-duo-green flex items-center justify-center shadow-[0_3px_0_#46a302] transform active:translate-y-0.5 group-hover:scale-105 transition-all">
            <span className="font-mono font-black text-black text-sm tracking-tighter">JS</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white font-sans group-hover:text-duo-green transition-colors">
                JS Duo
              </span>
              <span className="text-[10px] uppercase font-bold bg-[#FFD700]/20 text-[#FFD700] px-1.5 py-0.5 rounded border border-[#FFD700]/40">
                500 pytań
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium hidden sm:block">
              {levelInfo.title}
            </p>
          </div>
        </div>

        {/* Center/Right: Stats Bar */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Streak Flame */}
          <button
            onClick={onShowStreakToast}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#232E35] border border-[#2A373F] hover:border-[#FF9600] text-[#FF9600] font-bold text-xs sm:text-sm cursor-pointer transition-colors active:scale-95"
            title={`Passa nauki: ${stats.streak} dni z rzędu! (Kliknij, aby wyświetlić komunikat)`}
          >
            <Flame size={18} className="fill-[#FF9600] animate-pulse-subtle" />
            <span>{stats.streak}</span>
          </button>

          {/* Gems */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#232E35] border border-[#2A373F] text-[#1CB0F6] font-bold text-xs sm:text-sm cursor-default"
            title={`Kryształy: ${stats.gems}`}
          >
            <Gem size={17} className="fill-[#1CB0F6]" />
            <span>{stats.gems}</span>
          </div>

          {/* Hearts */}
          <button
            onClick={onRefillHearts}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border font-bold text-xs sm:text-sm transition-transform active:scale-95 ${
              stats.hearts > 0
                ? 'bg-[#232E35] border-[#2A373F] text-[#FF4B4B]'
                : 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
            }`}
            title="Serca/Życia. Kliknij, aby uzupełnić!"
          >
            <Heart size={17} className={stats.hearts > 0 ? 'fill-[#FF4B4B]' : 'text-red-400'} />
            <span>{stats.hearts}/{stats.maxHearts}</span>
          </button>

          {/* Level & XP Mini Pill */}
          <div
            onClick={onOpenProfile}
            className="hidden md:flex flex-col items-end pl-1 cursor-pointer group"
            title="Kliknij, aby otworzyć Profil i Osiągnięcia"
          >
            <div className="flex items-center gap-1 text-[11px] font-bold text-gray-300 group-hover:text-duo-yellow transition-colors">
              <Sparkles size={12} className="text-yellow-400" />
              <span>Poz. {levelInfo.level}</span>
              <span className="text-gray-400">({stats.xp} XP)</span>
            </div>
            <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-duo-green rounded-full transition-all duration-500"
                style={{ width: `${currentXpProgress}%` }}
              />
            </div>
          </div>

          {/* 500 Questions Bank Explorer Button */}
          <button
            onClick={onOpenExplorer}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-[#232E35] hover:bg-[#2F3D46] border border-[#2A373F] text-gray-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Przeglądaj wszystkie 500 pytań z wyjaśnieniami"
          >
            <BookOpen size={16} className="text-duo-yellow" />
            <span className="hidden sm:inline">500 Pytań</span>
          </button>

          {/* Notification Reminders Bell */}
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-xl bg-[#232E35] hover:bg-[#2F3D46] border border-[#2A373F] text-gray-300 hover:text-white transition-colors relative"
            title="Powiadomienia i przypomnienia o nauce"
          >
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-duo-blue"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
