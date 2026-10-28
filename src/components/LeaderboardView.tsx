import React from 'react';
import { Trophy, Flame } from 'lucide-react';
import { LeaderboardUser, UserStats } from '../types';

interface LeaderboardViewProps {
  userStats: UserStats;
  users: LeaderboardUser[];
  isSignedIn?: boolean;
  loading?: boolean;
  error?: string | null;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  users,
  isSignedIn = false,
  loading = false,
  error = null,
}) => {
  // Use the same server-sourced XP for ordering and display so local unsynced
  // progress cannot temporarily put the current user at an incorrect rank.
  const sortedUsers = [...users].sort((a, b) => b.xp - a.xp);

  const currentUserRank = sortedUsers.findIndex((u) => u.isCurrentUser) + 1;

  if (!isSignedIn) {
    return <div className="mx-auto max-w-xl rounded-3xl border border-[#293246] bg-[#151B2A] p-6 text-center">
      <Trophy size={34} className="mx-auto mb-3 text-duo-yellow" />
      <h2 className="text-xl font-black text-white">Ranking Codexa</h2>
      <p className="mt-2 text-sm leading-6 text-gray-400">Zaloguj się na konto, aby zobaczyć prawdziwy ranking społeczności.</p>
    </div>;
  }

  if (loading) {
    return <div role="status" className="mx-auto max-w-xl rounded-3xl border border-[#293246] bg-[#151B2A] p-6 text-center text-sm font-semibold text-gray-300">Pobieranie rankingu z Supabase…</div>;
  }

  if (error) {
    return <div role="alert" className="mx-auto max-w-xl rounded-3xl border border-duo-red/30 bg-[#151B2A] p-6 text-center">
      <h2 className="font-black text-white">Nie udało się pobrać rankingu</h2>
      <p className="mt-2 break-words text-sm text-gray-400">{error}</p>
    </div>;
  }

  if (!sortedUsers.length) {
    return <div className="mx-auto max-w-xl rounded-3xl border border-[#293246] bg-[#151B2A] p-6 text-center text-sm text-gray-400">Ranking jest jeszcze pusty. Ukończ lekcję, aby rozpocząć zdobywanie XP.</div>;
  }

  return (
    <div className="max-w-xl mx-auto px-2 sm:px-4 py-2 sm:py-4 pb-8 select-none">
      {/* League Banner */}
      <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-5 sm:mb-6 bg-gradient-to-r from-[#182338] to-[#151B2A] border-2 border-[#42E8D4]/25 shadow-lg text-center relative overflow-hidden">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Trophy size={26} className="text-[#42E8D4] fill-yellow-400 shrink-0" />
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
            Ranking globalny
          </h2>
        </div>
        <p className="text-xs text-gray-300 mb-3">
          Użytkownicy posortowani według XP zdobytego na koncie.
        </p>

      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-3 gap-2 mb-5 items-end pt-4">
        {/* 2nd Place */}
        {sortedUsers[1] && (
          <div className="flex flex-col items-center bg-[#151B2A] border border-[#293246] p-3 rounded-2xl text-center">
            <span className="text-lg">🥈</span>
            <span className="text-2xl my-1">{sortedUsers[1].avatar}</span>
            <span className="text-xs font-bold text-white truncate w-full">
              {sortedUsers[1].name}
            </span>
            <span className="text-[11px] font-extrabold text-gray-400">
              {sortedUsers[1].xp} XP
            </span>
          </div>
        )}

        {/* 1st Place */}
        {sortedUsers[0] && (
          <div className="flex flex-col items-center bg-gradient-to-b from-[#202A3B] to-[#151B2A] border-2 border-[#42E8D4]/45 p-4 rounded-3xl text-center shadow-lg -translate-y-2">
            <span className="text-2xl">👑</span>
            <span className="text-3xl my-1">{sortedUsers[0].avatar}</span>
            <span className="text-xs font-black text-yellow-400 truncate w-full">
              {sortedUsers[0].name}
            </span>
            <span className="text-xs font-black text-white">
              {sortedUsers[0].xp} XP
            </span>
          </div>
        )}

        {/* 3rd Place */}
        {sortedUsers[2] && (
          <div className="flex flex-col items-center bg-[#151B2A] border border-[#293246] p-3 rounded-2xl text-center">
            <span className="text-lg">🥉</span>
            <span className="text-2xl my-1">{sortedUsers[2].avatar}</span>
            <span className="text-xs font-bold text-white truncate w-full">
              {sortedUsers[2].name}
            </span>
            <span className="text-[11px] font-extrabold text-gray-400">
              {sortedUsers[2].xp} XP
            </span>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {sortedUsers.map((user, idx) => {
          const rank = idx + 1;
          const isMe = user.isCurrentUser;

          return (
            <div
              key={user.id}
              className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border-2 transition-all ${
                isMe
                  ? 'bg-[#182338] border-duo-blue shadow-[0_3px_0_#6D42D8] -translate-y-0.5'
                  : 'bg-[#151B2A] border-[#293246] hover:bg-[#202A3B]'
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

                <div className="w-10 h-10 rounded-xl bg-[#202A3B] flex items-center justify-center text-xl shrink-0">
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
                <span className="text-sm font-black text-white">{user.xp} XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
