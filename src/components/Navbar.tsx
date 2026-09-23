import React from 'react';
import { Flame, Gem, Heart, Bell, BookOpen, Sparkles } from 'lucide-react';
import { UserStats } from '../types';
import { storageService } from '../services/storageService';
import { CyberCatLogo } from './CyberCatLogo';

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
    <header className="sticky top-0 z-30 bg-[#131F24]/95 backdrop-blur border-b border-[#2A373F] px-2.5 sm:px-4 py-1.5 sm:py-2.5 safe-top select-none">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-1">
        {/* Left: Brand */}
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
          title="Kliknij, aby otworzyć Profil i Osiągnięcia"
        >
          <CyberCatLogo size={36} className="transform active:translate-y-0.5 group-hover:scale-105 transition-all shadow-[0_0_12px_rgba(168,85,247,0.4)]" />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white font-sans group-hover:text-cyan-400 transition-colors">
                JS Duo
              </span>
              <span className="text-[9px] uppercase font-bold bg-[#FFD700]/20 text-[#FFD700] px-1 py-0.2 rounded border border-[#FFD700]/40 hidden xs:inline-block sm:hidden">
                500
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium hidden sm:block">
              {levelInfo.title}
            </p>
          </div>
        </div>

        {/* Center/Right: Stats Bar */}
        <div className="flex items-center gap-1 sm:gap-2.5">
          {/* Streak Flame */}
          <button
            onClick={onShowStreakToast}
            className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-xl bg-[#232E35] border border-[#2A373F] hover:border-[#FF9600] text-[#FF9600] font-bold text-xs sm:text-sm cursor-pointer transition-colors active:scale-95 shrink-0"
            title={`Passa nauki: ${stats.streak} dni z rzędu!`}
          >
            <Flame size={15} className="fill-[#FF9600] animate-pulse-subtle" />
            <span>{stats.streak}</span>
          </button>

          {/* Gems */}
          <div
            className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-xl bg-[#232E35] border border-[#2A373F] text-[#1CB0F6] font-bold text-xs sm:text-sm cursor-default shrink-0"
            title={`Kryształy: ${stats.gems}`}
          >
            <Gem size={15} className="fill-[#1CB0F6]" />
            <span>{stats.gems}</span>
          </div>

          {/* Hearts */}
          <button
            onClick={onRefillHearts}
            className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-xl border font-bold text-xs sm:text-sm transition-transform active:scale-95 shrink-0 ${
              stats.hearts > 0
                ? 'bg-[#232E35] border-[#2A373F] text-[#FF4B4B]'
                : 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
            }`}
            title="Serca/Życia. Kliknij, aby uzupełnić!"
          >
            <Heart size={15} className={stats.hearts > 0 ? 'fill-[#FF4B4B]' : 'text-red-400'} />
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
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-[#232E35] hover:bg-[#2F3D46] border border-[#2A373F] text-gray-200 text-xs font-bold flex items-center gap-1 transition-colors active:scale-95 shrink-0"
            title="Przeglądaj wszystkie 500 pytań z wyjaśnieniami"
          >
            <BookOpen size={15} className="text-duo-yellow" />
            <span className="hidden md:inline">500 Pytań</span>
          </button>

          {/* Notification Reminders Bell */}
          <button
            onClick={onOpenNotifications}
            className="p-1.5 sm:p-2 rounded-xl bg-[#232E35] hover:bg-[#2F3D46] border border-[#2A373F] text-gray-300 hover:text-white transition-colors relative active:scale-95 shrink-0"
            title="Powiadomienia i przypomnienia o nauce"
          >
            <Bell size={15} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-duo-blue"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
