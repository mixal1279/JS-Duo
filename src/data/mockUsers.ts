import { LeaderboardUser, Friend, ChatMessage } from '../types';

export const INITIAL_LEADERBOARD: LeaderboardUser[] = [
  { id: 'u1', name: 'KamilDev', avatar: '🦊', xp: 60, level: 1, streak: 2, badge: '🔥 Aktywny' },
  { id: 'u2', name: 'Zosia_React', avatar: '🐱', xp: 45, level: 1, streak: 1, badge: '⚡ Szybki start' },
  { id: 'u3', name: 'Piotr_Koder', avatar: '🐼', xp: 30, level: 1, streak: 1 },
  { id: 'u4', name: 'Michał (Ty)', avatar: '🦉', xp: 0, level: 1, streak: 0, isCurrentUser: true, badge: '🌱 Nowicjusz' },
  { id: 'u5', name: 'Ola_Frontend', avatar: '🦄', xp: 0, level: 1, streak: 0 },
  { id: 'u6', name: 'Bartek_V8', avatar: '🦁', xp: 0, level: 1, streak: 0 },
  { id: 'u7', name: 'Natalia_TS', avatar: '🐨', xp: 0, level: 1, streak: 0 },
  { id: 'u8', name: 'Tomek_Node', avatar: '🐸', xp: 0, level: 1, streak: 0 },
  { id: 'u9', name: 'Karol_Stack', avatar: '🐯', xp: 0, level: 1, streak: 0 },
  { id: 'u10', name: 'Ania_Codes', avatar: '🐰', xp: 0, level: 1, streak: 0 },
];

export const INITIAL_FRIENDS: Friend[] = [
  { id: 'f1', name: 'KamilDev', avatar: '🦊', level: 14, status: 'online', duelWins: 8, lastActive: 'teraz' },
  { id: 'f2', name: 'Zosia_React', avatar: '🐱', level: 12, status: 'online', duelWins: 5, lastActive: '5 min temu' },
  { id: 'f3', name: 'Piotr_Koder', avatar: '🐼', level: 11, status: 'w grze', duelWins: 12, lastActive: 'w trakcie gry' },
  { id: 'f4', name: 'Ola_Frontend', avatar: '🦄', level: 9, status: 'online', duelWins: 3, lastActive: 'teraz' },
  { id: 'f5', name: 'Bartek_V8', avatar: '🦁', level: 8, status: 'offline', duelWins: 6, lastActive: '2 godz. temu' },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];
