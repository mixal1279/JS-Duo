import React from 'react';
import { Compass, Trophy, Swords, MessageSquareText, Target, User, Code2 } from 'lucide-react';

export type TabType = 'path' | 'quests' | 'leaderboard' | 'duels' | 'playground' | 'chat' | 'profile';

interface BottomNavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unreadChatCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
  unreadChatCount = 0,
}) => {
  const tabs = [
    { id: 'path' as TabType, label: 'Nauka', icon: Compass },
    { id: 'playground' as TabType, label: 'Kod', icon: Code2 },
    { id: 'quests' as TabType, label: 'Wyzwania', icon: Target },
    { id: 'leaderboard' as TabType, label: 'Ranking', icon: Trophy },
    { id: 'duels' as TabType, label: 'Pojedynki', icon: Swords },
    { id: 'chat' as TabType, label: 'Czat', icon: MessageSquareText, badge: unreadChatCount },
    { id: 'profile' as TabType, label: 'Profil', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#131F24]/95 backdrop-blur border-t border-[#2A373F] px-1 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] select-none">
      <div className="max-w-xl mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 min-w-[48px] min-h-[48px] active:scale-95 ${
                isActive
                  ? 'text-duo-green font-extrabold scale-105'
                  : 'text-gray-400 hover:text-gray-200 font-semibold'
              }`}
            >
              <div
                className={`relative p-1.5 rounded-xl transition-colors ${
                  isActive ? 'bg-duo-green/15 text-duo-green' : 'text-gray-400'
                }`}
              >
                <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-duo-red text-white text-[10px] font-bold px-1 py-0.2 rounded-full min-w-[15px] text-center border-2 border-[#131F24]">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-bold tracking-tight mt-0.5 truncate max-w-[55px]">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 bg-duo-green rounded-full mt-0.5 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

