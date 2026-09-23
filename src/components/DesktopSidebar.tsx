import React from 'react';
import {
  Compass,
  Trophy,
  Swords,
  MessageSquareText,
  Target,
  BookOpen,
  Bell,
  Heart,
  Keyboard,
  Sparkles,
  User,
  Award,
  Code2
} from 'lucide-react';
import { TabType } from './BottomNavigation';
import { UserStats } from '../types';
import { storageService } from '../services/storageService';
import { CyberCatLogo } from './CyberCatLogo';

interface DesktopSidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  stats: UserStats;
  unreadChatCount?: number;
  onOpenExplorer: () => void;
  onOpenNotifications: () => void;
  onRefillHearts: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentTab,
  onSelectTab,
  stats,
  unreadChatCount = 0,
  onOpenExplorer,
  onOpenNotifications,
  onRefillHearts,
}) => {
  const levelInfo = storageService.calculateLevel(stats.xp);

  const navItems = [
    { id: 'path' as TabType, label: 'Nauka', icon: Compass, shortcut: '1' },
    { id: 'playground' as TabType, label: 'Laboratorium JS', icon: Code2, shortcut: '2' },
    { id: 'quests' as TabType, label: 'Wyzwania', icon: Target, shortcut: '3' },
    { id: 'leaderboard' as TabType, label: 'Ranking', icon: Trophy, shortcut: '4' },
    { id: 'duels' as TabType, label: 'Pojedynki 1v1', icon: Swords, shortcut: '5' },
    { id: 'chat' as TabType, label: 'Społeczność', icon: MessageSquareText, badge: unreadChatCount, shortcut: '6' },
    { id: 'profile' as TabType, label: 'Osiągnięcia & Profil', icon: Award, shortcut: '7' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 border-r border-[#2A373F] bg-[#131F24] p-4 sticky top-0 h-screen overflow-y-auto select-none z-20">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-3 mb-6">
        <CyberCatLogo size={46} className="cursor-pointer transform hover:scale-105 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-black text-2xl tracking-tight text-white font-sans">
              JS Duo
            </h1>
          </div>
          <span className="text-[11px] font-bold text-gray-400">
            Duolingo dla JavaScript
          </span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-150 border-2 ${
                isActive
                  ? 'bg-[#1C3545] border-duo-blue text-duo-blue shadow-[0_3px_0_#1899d6]'
                  : 'bg-transparent border-transparent text-gray-300 hover:bg-[#202F36] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-duo-blue' : 'text-gray-400'} />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-2">
                {item.badge && item.badge > 0 ? (
                  <span className="bg-duo-red text-white text-xs font-black px-2 py-0.5 rounded-full min-w-[20px] text-center shadow">
                    {item.badge}
                  </span>
                ) : null}
                <kbd className="hidden lg:inline-block text-[10px] font-mono text-gray-400 bg-[#202F36] border border-[#2A373F] px-1.5 py-0.5 rounded">
                  {item.shortcut}
                </kbd>
              </div>
            </button>
          );
        })}

        {/* Divider */}
        <div className="my-4 border-t border-[#243138]" />

        {/* 500 Questions Bank Button */}
        <button
          onClick={onOpenExplorer}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl font-black text-sm uppercase tracking-wider bg-transparent border-2 border-transparent text-gray-300 hover:bg-[#202F36] hover:text-white transition-all"
        >
          <div className="flex items-center gap-3.5">
            <BookOpen size={24} className="text-duo-yellow" />
            <span>Baza 500 Pytań</span>
          </div>
          <span className="text-[10px] font-bold bg-[#FFD700]/20 text-duo-yellow px-2 py-0.5 rounded border border-[#FFD700]/40">
            500
          </span>
        </button>

        {/* Notifications & Reminders Button */}
        <button
          onClick={onOpenNotifications}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl font-black text-sm uppercase tracking-wider bg-transparent border-2 border-transparent text-gray-300 hover:bg-[#202F36] hover:text-white transition-all"
        >
          <div className="flex items-center gap-3.5">
            <Bell size={24} className="text-duo-blue" />
            <span>Przypomnienia</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-duo-blue animate-pulse" />
        </button>

        {/* Serca i Trening */}
        <button
          onClick={onRefillHearts}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl font-black text-sm uppercase tracking-wider bg-transparent border-2 border-transparent text-gray-300 hover:bg-[#202F36] hover:text-white transition-all"
        >
          <div className="flex items-center gap-3.5">
            <Heart size={24} className="text-duo-red fill-duo-red" />
            <span>Serca & Trening</span>
          </div>
          <span className="text-xs font-black text-duo-red">
            {stats.hearts}/{stats.maxHearts}
          </span>
        </button>
      </nav>

      {/* User Mini Profile Card (Clickable) */}
      <div className="pt-4 border-t border-[#243138] mt-auto">
        <button
          onClick={() => onSelectTab('profile')}
          className={`w-full p-3 rounded-2xl flex items-center gap-3 border-2 transition-all cursor-pointer text-left ${
            currentTab === 'profile'
              ? 'bg-[#1C3545] border-duo-blue shadow-[0_3px_0_#1899d6]'
              : 'bg-[#1C262C] border-[#2A373F] hover:border-duo-yellow/60 hover:bg-[#202E36]'
          }`}
          title="Kliknij, aby otworzyć Profil i Osiągnięcia"
        >
          <div className="w-10 h-10 rounded-xl bg-duo-yellow/20 border border-duo-yellow/40 flex items-center justify-center text-xl shrink-0">
            🦉
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-white truncate">Michał (Ty)</span>
              <span className="text-[10px] font-bold text-duo-green bg-duo-green/15 px-1.5 py-0.5 rounded">
                Lvl {levelInfo.level}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 truncate">{levelInfo.title}</p>
          </div>
        </button>
      </div>
    </aside>
  );
};
