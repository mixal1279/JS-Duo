import React from 'react';
import { Compass, Trophy, Swords, MessageSquareText, Target } from 'lucide-react';

export type TabType = 'path' | 'quests' | 'leaderboard' | 'duels' | 'chat';

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
    { id: 'quests' as TabType, label: 'Wyzwania', icon: Target },
    { id: 'leaderboard' as TabType, label: 'Ranking', icon: Trophy },
    { id: 'duels' as TabType, label: 'Pojedynki', icon: Swords },
    { id: 'chat' as TabType, label: 'Społeczność', icon: MessageSquareText, badge: unreadChatCount },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#131F24]/95 backdrop-blur border-t border-[#2A373F] px-2 py-1.5 safe-bottom">
      <div className="max-w-xl mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 min-w-[64px] ${
                isActive
                  ? 'text-duo-green font-extrabold scale-105'
                  : 'text-gray-400 hover:text-gray-200 font-semibold'
              }`}
            >
              <div
                className={`relative p-1 rounded-xl transition-colors ${
                  isActive ? 'bg-duo-green/15 text-duo-green' : 'text-gray-400'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-duo-red text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center border-2 border-[#131F24]">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] tracking-tight mt-0.5">{tab.label}</span>
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
