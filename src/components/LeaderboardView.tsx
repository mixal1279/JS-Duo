import React, { useState } from 'react';
import { Trophy, Flame, ChevronUp, ChevronDown, Clock, Shield } from 'lucide-react';
import { LeaderboardUser, UserStats } from '../types';

interface LeaderboardViewProps {
  userStats: UserStats;
  users: LeaderboardUser[];
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  userStats,
  users,
}) => {
  const [activeTab, setActiveTab] = useState<'league' | 'global'>('league');

  // Sorted list based on XP
  const sortedUsers = [...users].sort((a, b) => {
    // Inject real-time user XP into the user's item
    const xpA = a.isCurrentUser ? userStats.xp : a.xp;
    const xpB = b.isCurrentUser ? userStats.xp : b.xp;
    return xpB - xpA;
  });

  const currentUserRank = sortedUsers.findIndex((u) => u.isCurrentUser) + 1;

  const leagues = ['Brązowa', 'Srebrna', 'Złota', 'Szafirowa', 'Rubinowa', 'Diamentowa'] as const;

  return (
    <div className="max-w-xl mx-auto px-2 sm:px-4 py-2 sm:py-4 pb-8 select-none">
      {/* League Banner */}
      <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-5 sm:mb-6 bg-gradient-to-r from-[#1C2C35] to-[#17232A] border-2 border-yellow-500/50 shadow-lg text-center relative overflow-hidden">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Trophy size={26} className="text-yellow-400 fill-yellow-400 shrink-0" />
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
            Liga {userStats.league}
          </h2>
        </div>
        <p className="text-xs text-gray-300 mb-3">
          Top 5 graczy awansuje do wyższej ligi na koniec tygodnia!
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] font-bold text-gray-300">
          <Clock size={13} className="text-duo-yellow" />
          <span>Koniec ligi za: 2 dni 14 godz.</span>
        </div>

        {/* League Badges Row */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mt-4 pt-3 border-t border-white/10 overflow-x-auto scrollbar-none touch-pan-x">
          {leagues.map((lg) => {
            const isCurrent = lg === userStats.league;
            return (
              <span
                key={lg}
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  isCurrent
                    ? 'bg-yellow-400 text-black shadow font-black'
                    : 'text-gray-500 bg-white/5'
                }`}
              >
                {lg}
              </span>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-[#1E2930] p-1 rounded-2xl mb-4 border border-[#2A373F]">
        <button
          onClick={() => setActiveTab('league')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
            activeTab === 'league'
              ? 'bg-duo-green text-black shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Twoja Liga ({userStats.league})
        </button>
        <button
          onClick={() => setActiveTab('global')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
            activeTab === 'global'
              ? 'bg-duo-green text-black shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Globalny TOP 100
        </button>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-3 gap-2 mb-5 items-end pt-4">
        {/* 2nd Place */}
        {sortedUsers[1] && (
          <div className="flex flex-col items-center bg-[#1B262C] border border-[#2A373F] p-3 rounded-2xl text-center">
            <span className="text-lg">🥈</span>
            <span className="text-2xl my-1">{sortedUsers[1].avatar}</span>
            <span className="text-xs font-bold text-white truncate w-full">
              {sortedUsers[1].name}
            </span>
            <span className="text-[11px] font-extrabold text-gray-400">
              {sortedUsers[1].isCurrentUser ? userStats.xp : sortedUsers[1].xp} XP
            </span>
          </div>
        )}

        {/* 1st Place */}
        {sortedUsers[0] && (
          <div className="flex flex-col items-center bg-[#233540] border-2 border-yellow-500/60 p-4 rounded-3xl text-center shadow-lg -translate-y-2">
            <span className="text-2xl">👑</span>
            <span className="text-3xl my-1">{sortedUsers[0].avatar}</span>
            <span className="text-xs font-black text-yellow-400 truncate w-full">
              {sortedUsers[0].name}
            </span>
            <span className="text-xs font-black text-white">
              {sortedUsers[0].isCurrentUser ? userStats.xp : sortedUsers[0].xp} XP
            </span>
          </div>
        )}

        {/* 3rd Place */}
        {sortedUsers[2] && (
          <div className="flex flex-col items-center bg-[#1B262C] border border-[#2A373F] p-3 rounded-2xl text-center">
            <span className="text-lg">🥉</span>
            <span className="text-2xl my-1">{sortedUsers[2].avatar}</span>
            <span className="text-xs font-bold text-white truncate w-full">
              {sortedUsers[2].name}
            </span>
            <span className="text-[11px] font-extrabold text-gray-400">
              {sortedUsers[2].isCurrentUser ? userStats.xp : sortedUsers[2].xp} XP
            </span>
          </div>
        )}
      </div>

      {/* Promotion Zone Label */}
      <div className="flex items-center gap-2 text-xs font-bold text-duo-green px-2 mb-2">
        <ChevronUp size={16} />
        <span>STREFA AWANSU (Miejsca 1 - 5)</span>
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {sortedUsers.map((user, idx) => {
          const rank = idx + 1;
          const isMe = user.isCurrentUser;
          const displayXp = isMe ? userStats.xp : user.xp;
          const isPromotion = rank <= 5;
          const isDemotion = rank >= sortedUsers.length - 2;

          return (
            <div
              key={user.id}
              className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border-2 transition-all ${
                isMe
                  ? 'bg-[#1C3545] border-duo-blue shadow-[0_3px_0_#1899d6] -translate-y-0.5'
                  : 'bg-[#1C262C] border-[#2A373F] hover:bg-[#223038]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 text-center font-black text-sm ${
                    rank === 1
                      ? 'text-yellow-400'
                      : rank === 2
                      ? 'text-gray-300'
                      : rank === 3
                      ? 'text-amber-600'
                      : 'text-gray-500'
                  }`}
                >
                  {rank}
                </span>

                <div className="w-10 h-10 rounded-xl bg-[#28363F] flex items-center justify-center text-xl shrink-0">
                  {user.avatar}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm font-extrabold ${
                        isMe ? 'text-duo-blue' : 'text-white'
                      }`}
                    >
                      {user.name}
                    </span>
                    {user.badge && (
                      <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-bold hidden sm:inline">
                        {user.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 font-semibold">
                    <span className="flex items-center gap-0.5 text-[#FF9600]">
                      <Flame size={12} className="fill-[#FF9600]" />
                      {user.streak} dni
                    </span>
                    <span>• Poz. {user.level}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-white">{displayXp} XP</span>
                <div className="text-[10px] font-bold">
                  {isPromotion ? (
                    <span className="text-duo-green">Awans</span>
                  ) : isDemotion ? (
                    <span className="text-duo-red">Spadek</span>
                  ) : (
                    <span className="text-gray-500">Utrzymanie</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
