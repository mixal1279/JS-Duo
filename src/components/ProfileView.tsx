import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  Gem,
  Swords,
  BookOpen,
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronRight,
  Shield,
  Calendar,
  Share2,
  Filter,
  Star,
  Moon,
  Sun,
  Palette,
  Check,
  RotateCcw,
  Wifi,
  WifiOff,
  HardDriveDownload,
} from 'lucide-react';
import { UserStats, Achievement, AppTheme } from '../types';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';
import { calculateAchievements } from '../data/achievementsData';

interface ProfileViewProps {
  userStats: UserStats;
  onUpdateStats?: (newStats: Partial<UserStats>) => void;
  onOpenExplorer?: () => void;
  onOpenLeaderboard?: () => void;
  currentTheme?: AppTheme;
  onToggleTheme?: (theme: AppTheme) => void;
  onResetProgress?: () => void;
}

const AVATAR_OPTIONS = [
  { id: 'owl', emoji: '🦉', label: 'Sowa Duo' },
  { id: 'wizard', emoji: '🧙‍♂️', label: 'Czarodziej Kodu' },
  { id: 'robot', emoji: '🤖', label: 'Robot V8' },
  { id: 'cat', emoji: '🐱', label: 'Koder Kiciuś' },
  { id: 'fox', emoji: '🦊', label: 'Zwinny Lisek' },
  { id: 'rocket', emoji: '🚀', label: 'Astronauta JS' },
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  userStats,
  onUpdateStats,
  onOpenExplorer,
  onOpenLeaderboard,
  currentTheme,
  onToggleTheme,
  onResetProgress,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(() => {
    return localStorage.getItem('js_duo_avatar_v1') || '🦉';
  });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'unlocked' | 'locked' | 'streak' | 'skills'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const [cacheStatus, setCacheStatus] = useState(() => storageService.isQuestionsCacheValid());
  const [cacheCount, setCacheCount] = useState(() => storageService.getCachedQuestions()?.length || 500);

  const handleRefreshCache = () => {
    soundService.playLevelUp();
    storageService.cacheQuestions(storageService.getCachedQuestions() || []);
    setCacheStatus(true);
    setCacheCount(500);
  };

  const activeTheme = currentTheme || storageService.getTheme();

  const handleSelectTheme = (newTheme: AppTheme) => {
    soundService.playClick();
    if (onToggleTheme) {
      onToggleTheme(newTheme);
    } else {
      storageService.saveTheme(newTheme);
      if (newTheme === 'light') {
        document.documentElement.classList.add('theme-light');
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.classList.remove('theme-light');
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'deep-night');
      }
    }
  };

  const levelInfo = storageService.calculateLevel(userStats.xp);
  const achievements = calculateAchievements(userStats);

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  const handleSelectAvatar = (emoji: string) => {
    setSelectedAvatar(emoji);
    localStorage.setItem('js_duo_avatar_v1', emoji);
    setShowAvatarPicker(false);
  };

  const filteredAchievements = achievements.filter((ach) => {
    if (filterCategory === 'unlocked') return ach.isUnlocked;
    if (filterCategory === 'locked') return !ach.isUnlocked;
    if (filterCategory === 'streak') return ach.category === 'streak';
    if (filterCategory === 'skills') return ach.category === 'skills';
    return true;
  });

  const winRate =
    userStats.duelWins + userStats.duelLosses > 0
      ? Math.round((userStats.duelWins / (userStats.duelWins + userStats.duelLosses)) * 100)
      : 0;

  return (
    <div className="space-y-5 sm:space-y-6 pb-8 select-none">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-b from-[#1E2E38] to-[#152026] border-2 border-[#2A3B46] rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-lg relative overflow-hidden">
        {/* Ambient glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-duo-green/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with edit badge */}
          <div className="relative group">
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="w-24 h-24 rounded-3xl bg-[#131F24] border-4 border-duo-green/60 shadow-[0_6px_0_#225006] flex items-center justify-center text-5xl hover:scale-105 active:scale-95 transition-transform cursor-pointer relative"
              title="Kliknij, aby zmienić awatar"
            >
              <span>{selectedAvatar}</span>
              <div className="absolute -bottom-1.5 -right-1.5 bg-duo-green text-black p-1 rounded-xl shadow border border-[#131F24]">
                <Sparkles size={14} className="fill-black" />
              </div>
            </button>

            {/* Avatar Picker Dropdown */}
            {showAvatarPicker && (
              <div className="absolute left-1/2 sm:left-0 -translate-x-1/2 sm:translate-x-0 top-full mt-3 bg-[#1C2830] border-2 border-duo-green/50 rounded-2xl p-3 shadow-2xl z-30 w-64 backdrop-blur">
                <div className="text-xs font-black uppercase text-gray-300 mb-2 px-1 flex items-center justify-between">
                  <span>Wybierz awatar</span>
                  <button
                    onClick={() => setShowAvatarPicker(false)}
                    className="text-gray-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av.id}
                      onClick={() => handleSelectAvatar(av.emoji)}
                      className={`p-2 rounded-xl text-2xl border transition-all flex flex-col items-center gap-1 ${
                        selectedAvatar === av.emoji
                          ? 'bg-duo-green/20 border-duo-green scale-105'
                          : 'bg-[#141E24] border-[#2A3A44] hover:bg-[#20303A]'
                      }`}
                    >
                      <span>{av.emoji}</span>
                      <span className="text-[9px] font-bold text-gray-300 truncate max-w-full">
                        {av.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Info Details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Michał (Ty)
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-duo-green/20 text-duo-green border border-duo-green/40">
                    Lvl {levelInfo.level}
                  </span>
                </div>
                <p className="text-sm font-bold text-duo-yellow mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                  <Star size={14} className="fill-duo-yellow" />
                  <span>{levelInfo.title}</span>
                </p>
              </div>

              {/* League Badge Pill */}
              <div
                onClick={onOpenLeaderboard}
                className="inline-flex items-center justify-center gap-2 bg-[#141E24] border border-[#2D3F4B] px-3.5 py-1.5 rounded-2xl cursor-pointer hover:border-duo-yellow transition-colors self-center sm:self-auto"
                title="Kliknij, aby otworzyć ranking ligowy"
              >
                <Trophy size={16} className="text-duo-yellow" />
                <span className="text-xs font-black uppercase text-gray-200">
                  Liga {userStats.league}
                </span>
                <ChevronRight size={14} className="text-gray-400" />
              </div>
            </div>

            {/* Member since tag & bio */}
            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-400 font-medium">
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-gray-400" />
                <span>Uczeń od września 2026</span>
              </span>
              <span>•</span>
              <span className="text-gray-300 font-bold">500 pytań w toku</span>
            </div>

            {/* Overall Level Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-bold mb-1 text-gray-300">
                <span>Postęp do Poziomu {levelInfo.level + 1}</span>
                <span className="font-mono text-duo-green">
                  {userStats.xp} / {levelInfo.nextLevelXp} XP
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#141E24] rounded-full overflow-hidden border border-[#263742]">
                <div
                  className="h-full bg-duo-green rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(88,204,2,0.5)]"
                  style={{
                    width: `${Math.min(
                      100,
                      ((userStats.xp - levelInfo.currentLevelXp) /
                        (levelInfo.nextLevelXp - levelInfo.currentLevelXp)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Statistics Grid */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 px-1">
          Statystyki konta
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Streak Card */}
          <div className="bg-[#172227] border-2 border-[#2A373F] rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-xs font-bold uppercase">Passa dni</span>
              <Flame size={20} className="text-[#FF9600] fill-[#FF9600]" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{userStats.streak}</span>
                <span className="text-xs font-bold text-gray-400">dni z rzędu</span>
              </div>
              {(userStats.streakFreeze || 0) > 0 ? (
                <div className="text-[10px] font-bold text-duo-blue flex items-center gap-1 mt-0.5">
                  <span>🛡️ Zamrożenie aktywne ({userStats.streakFreeze})</span>
                </div>
              ) : userStats.streak === 0 ? (
                <div className="text-[10px] text-gray-500 mt-0.5">
                  <span>Zrób lekcję, by odpalić passę</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Solved Questions Card */}
          <div
            onClick={onOpenExplorer}
            className="bg-[#172227] border-2 border-[#2A373F] rounded-2xl p-3.5 flex flex-col justify-between shadow-sm cursor-pointer hover:border-duo-yellow transition-colors"
            title="Kliknij, aby otworzyć Bazę 500 Pytań"
          >
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-xs font-bold uppercase">Rozwiązane</span>
              <BookOpen size={20} className="text-duo-yellow" />
            </div>
            <div>
              <span className="text-2xl font-black text-white">
                {userStats.completedQuestionIds.length}
              </span>
              <span className="text-xs font-bold text-gray-400 ml-1">/ 500</span>
            </div>
          </div>

          {/* Duels Record Card */}
          <div className="bg-[#172227] border-2 border-[#2A373F] rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-xs font-bold uppercase">Pojedynki 1v1</span>
              <Swords size={20} className="text-duo-blue" />
            </div>
            <div>
              <span className="text-2xl font-black text-white">{userStats.duelWins}</span>
              <span className="text-xs font-bold text-gray-400 ml-1">
                W ({winRate}% win)
              </span>
            </div>
          </div>

          {/* Total Gems Card */}
          <div className="bg-[#172227] border-2 border-[#2A373F] rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-xs font-bold uppercase">Kryształy</span>
              <Gem size={20} className="text-[#1CB0F6] fill-[#1CB0F6]" />
            </div>
            <div>
              <span className="text-2xl font-black text-white">{userStats.gems}</span>
              <span className="text-xs font-bold text-gray-400 ml-1">klejnotów</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings / Theme Switcher Section: Deep Night vs Light Mode */}
      <div className="bg-[#172227] border-2 border-[#2A373F] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2A373F]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-duo-blue/20 border-2 border-duo-blue/40 flex items-center justify-center text-duo-blue shadow-sm">
              <Palette size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Motyw i Wygląd Aplikacji
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-duo-blue/20 text-duo-blue border border-duo-blue/30">
                  Styl JS Duo
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Wybierz paletę kolorystyczną: nocny grafit lub lekki, czysty motyw dzienny
              </p>
            </div>
          </div>

          {/* Quick Pill Switch */}
          <div className="inline-flex p-1 rounded-2xl bg-[#131F24] border border-[#2A373F] self-start sm:self-auto">
            <button
              onClick={() => handleSelectTheme('deep-night')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTheme === 'deep-night'
                  ? 'bg-[#202F36] text-white shadow-sm border border-[#2A373F]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Moon size={14} className={activeTheme === 'deep-night' ? 'text-duo-blue fill-duo-blue' : ''} />
              <span>Deep Night</span>
            </button>
            <button
              onClick={() => handleSelectTheme('light')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTheme === 'light'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sun size={14} className={activeTheme === 'light' ? 'text-duo-yellow fill-duo-yellow' : ''} />
              <span>Light Mode</span>
            </button>
          </div>
        </div>

        {/* Two Visual Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Deep Night Option Card */}
          <div
            onClick={() => handleSelectTheme('deep-night')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden group ${
              activeTheme === 'deep-night'
                ? 'bg-[#1C3545]/60 border-duo-blue ring-2 ring-duo-blue/30 shadow-[0_4px_0_#1899d6] -translate-y-0.5'
                : 'bg-[#141B20] border-[#2A373F] hover:border-[#3A4E5C] hover:bg-[#182329]'
            }`}
          >
            <div className="flex items-start justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
                  <Moon size={18} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    Deep Night
                    {activeTheme === 'deep-night' && (
                      <span className="text-[10px] font-bold text-duo-green bg-duo-green/20 px-1.5 py-0.2 rounded-full border border-duo-green/30">
                        Aktywny
                      </span>
                    )}
                  </h4>
                  <span className="text-[11px] font-medium text-gray-400">Głęboki grafit i neony</span>
                </div>
              </div>

              {activeTheme === 'deep-night' ? (
                <div className="w-6 h-6 rounded-full bg-duo-blue text-white flex items-center justify-center shadow">
                  <Check size={14} className="stroke-[3]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border border-gray-600 group-hover:border-gray-400" />
              )}
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              Domyślny nocny motyw JS Duo. Głęboki ciemny grafit chroni oczy podczas nocnych sesji kodowania i nauki.
            </p>

            {/* Mini Color Swatch & Preview */}
            <div className="p-2.5 rounded-xl bg-[#0D1117] border border-[#243038] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#131F24] border border-[#2A373F]" title="Tło #131F24" />
                <span className="w-3.5 h-3.5 rounded-full bg-duo-green" title="Duo Green #58CC02" />
                <span className="w-3.5 h-3.5 rounded-full bg-duo-blue" title="Duo Blue #1CB0F6" />
                <span className="w-3.5 h-3.5 rounded-full bg-duo-yellow" title="Duo Yellow #FFD700" />
              </div>
              <span className="text-[10px] font-mono font-bold text-gray-400">
                #131F24 • Ciemny grafit
              </span>
            </div>
          </div>

          {/* Light Mode Option Card */}
          <div
            onClick={() => handleSelectTheme('light')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden group ${
              activeTheme === 'light'
                ? 'bg-[#1C3545]/60 border-duo-blue ring-2 ring-duo-blue/30 shadow-[0_4px_0_#1899d6] -translate-y-0.5'
                : 'bg-[#141B20] border-[#2A373F] hover:border-[#3A4E5C] hover:bg-[#182329]'
            }`}
          >
            <div className="flex items-start justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Sun size={18} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    Light Mode
                    {activeTheme === 'light' && (
                      <span className="text-[10px] font-bold text-duo-green bg-duo-green/20 px-1.5 py-0.2 rounded-full border border-duo-green/30">
                        Aktywny
                      </span>
                    )}
                  </h4>
                  <span className="text-[11px] font-medium text-gray-400">Jasny styl klasycznego Duo</span>
                </div>
              </div>

              {activeTheme === 'light' ? (
                <div className="w-6 h-6 rounded-full bg-duo-blue text-white flex items-center justify-center shadow">
                  <Check size={14} className="stroke-[3]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border border-gray-600 group-hover:border-gray-400" />
              )}
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              Lekki, przejrzysty motyw dzienny. Czyste jasne tła, wyrazisty kontrast tekstu i oryginalne barwy JS Duo.
            </p>

            {/* Mini Color Swatch & Preview */}
            <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#FFFFFF] border border-gray-300 shadow-sm" title="Tło #FFFFFF" />
                <span className="w-3.5 h-3.5 rounded-full bg-duo-green" title="Duo Green #58CC02" />
                <span className="w-3.5 h-3.5 rounded-full bg-duo-blue" title="Duo Blue #1CB0F6" />
                <span className="w-3.5 h-3.5 rounded-full bg-duo-yellow" title="Duo Yellow #FFD700" />
              </div>
              <span className="text-[10px] font-mono font-bold text-gray-600">
                #FFFFFF • Czysty jasny
              </span>
            </div>
          </div>
        </div>
      </div>

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
      {/* Offline Storage & Question Cache Status */}
      <div className="bg-[#172227] border-2 border-[#2A373F] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <HardDriveDownload size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Baza Pytań Offline (LocalStorage)</h3>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Aktywny Cache
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                Pytania są zachowane w pamięci trwałej przeglądarki/telefonu do nauki bez internetu.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#1F2C33] border border-[#2B3B44] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white font-bold">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>Zapisano w pamięci: {cacheCount} z 500 pytań</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Tryb offline: lekcje, wyjaśnienia i quizy działają w samolocie lub przy braku zasięgu.
            </p>
          </div>

          <button
            onClick={handleRefreshCache}
            className="px-4 py-2 rounded-xl bg-[#283842] hover:bg-[#344855] text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-colors active:scale-95 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <HardDriveDownload size={14} />
            <span>Odśwież pamięć pytań</span>
          </button>
        </div>
      </div>

      {/* Reset Progress & Data Section */}
      <div className="bg-[#172227] border-2 border-[#2A373F] rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <RotateCcw size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Reset statystyk i passy</h3>
            <p className="text-xs text-gray-400 font-medium">
              Chcesz zacząć naukę od nowa z czystą passą i 0 XP?
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundService.playClick();
            setShowResetModal(true);
          }}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border-2 border-red-500/50 text-red-300 hover:text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
        >
          <RotateCcw size={16} />
          <span>Wyczyść passę i wszystkie statystyki do zera</span>
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#172127] border-2 border-red-500/50 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 animate-scale-up">
            <div className="w-16 h-16 rounded-3xl bg-red-500/20 border-2 border-red-500 mx-auto flex items-center justify-center text-red-400">
              <RotateCcw size={32} />
            </div>

            <h3 className="text-xl font-black text-white">
              Wyczyścić wszystkie statystyki?
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Wszystkie punkty XP, passa dni, odznaki oraz lista rozwiązanych pytań zostaną zresetowane do zera. Rozpoczniesz kurs JavaScript od samego początku.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  soundService.playClick();
                  if (onResetProgress) {
                    onResetProgress();
                  } else {
                    storageService.resetAllProgress();
                    window.location.reload();
                  }
                  setShowResetModal(false);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-[0_4px_0_#991b1b] active:translate-y-0.5 transition-all cursor-pointer"
              >
                Tak, wyczyść wszystko do zera
              </button>

              <button
                onClick={() => setShowResetModal(false)}
                className="w-full py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
