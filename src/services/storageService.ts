import { UserStats, DailyQuest, LeaderboardUser, Friend, ChatMessage, NotificationConfig } from '../types';
import { INITIAL_LEADERBOARD, INITIAL_FRIENDS, INITIAL_CHAT_MESSAGES } from '../data/mockUsers';

const STATS_KEY = 'js_duo_user_stats_v1';
const QUESTS_KEY = 'js_duo_daily_quests_v1';
const LEADERBOARD_KEY = 'js_duo_leaderboard_v1';
const FRIENDS_KEY = 'js_duo_friends_v1';
const CHAT_KEY = 'js_duo_chat_v1';
const NOTIF_KEY = 'js_duo_notification_cfg_v1';

export const DEFAULT_USER_STATS: UserStats = {
  xp: 350,
  level: 4,
  streak: 5,
  lastActiveDate: new Date().toISOString().split('T')[0],
  gems: 180,
  hearts: 5,
  maxHearts: 5,
  completedQuestionIds: [1, 2, 3, 4, 5],
  unlockedUnit: 2,
  duelWins: 4,
  duelLosses: 1,
  league: 'Złota',
};

export const DEFAULT_DAILY_QUESTS: DailyQuest[] = [
  {
    id: 'q1',
    title: 'Codzienna dawka wiedzy',
    description: 'Zdobądź dzisiaj 50 XP w lekcjach',
    target: 50,
    current: 25,
    xpReward: 30,
    gemsReward: 15,
    claimed: false,
    type: 'xp',
  },
  {
    id: 'q2',
    title: 'Bezbłędny programista',
    description: 'Rozwiąż 5 pytań bez utraty serca',
    target: 5,
    current: 3,
    xpReward: 40,
    gemsReward: 20,
    claimed: false,
    type: 'perfect',
  },
  {
    id: 'q3',
    title: 'Mistrz Ścieżki',
    description: 'Ukończ 2 pełne lekcje',
    target: 2,
    current: 1,
    xpReward: 35,
    gemsReward: 15,
    claimed: false,
    type: 'lessons',
  },
  {
    id: 'q4',
    title: 'Pojedynek na kod',
    description: 'Wygraj 1 pojedynek 1v1 ze znajomym',
    target: 1,
    current: 0,
    xpReward: 50,
    gemsReward: 25,
    claimed: false,
    type: 'duel',
  },
];

export const DEFAULT_NOTIF_CONFIG: NotificationConfig = {
  enabled: true,
  time: '18:00',
  tone: 'friendly',
  hasBrowserPermission: false,
};

export const storageService = {
  getStats(): UserStats {
    try {
      const data = localStorage.getItem(STATS_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return DEFAULT_USER_STATS;
  },

  saveStats(stats: UserStats) {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error(e);
    }
  },

  getQuests(): DailyQuest[] {
    try {
      const data = localStorage.getItem(QUESTS_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return DEFAULT_DAILY_QUESTS;
  },

  saveQuests(quests: DailyQuest[]) {
    try {
      localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
    } catch (e) {
      console.error(e);
    }
  },

  getLeaderboard(): LeaderboardUser[] {
    try {
      const data = localStorage.getItem(LEADERBOARD_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_LEADERBOARD;
  },

  saveLeaderboard(users: LeaderboardUser[]) {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  },

  getFriends(): Friend[] {
    try {
      const data = localStorage.getItem(FRIENDS_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_FRIENDS;
  },

  saveFriends(friends: Friend[]) {
    try {
      localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
    } catch (e) {
      console.error(e);
    }
  },

  getChatMessages(): ChatMessage[] {
    try {
      const data = localStorage.getItem(CHAT_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_CHAT_MESSAGES;
  },

  saveChatMessages(messages: ChatMessage[]) {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  },

  getNotificationConfig(): NotificationConfig {
    try {
      const data = localStorage.getItem(NOTIF_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return DEFAULT_NOTIF_CONFIG;
  },

  saveNotificationConfig(config: NotificationConfig) {
    try {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(config));
    } catch (e) {
      console.error(e);
    }
  },

  calculateLevel(xp: number): { level: number; title: string; nextLevelXp: number; currentLevelXp: number } {
    // 100 XP per level base with progressive scaling
    const level = Math.max(1, Math.floor(xp / 100) + 1);
    const currentLevelXp = (level - 1) * 100;
    const nextLevelXp = level * 100;

    let title = 'Początkujący Junior';
    if (level >= 30) title = 'JavaScript Guru';
    else if (level >= 25) title = 'Główny Architekt V8';
    else if (level >= 20) title = 'Ninja Pełnego Stosu';
    else if (level >= 15) title = 'Senior Developer JS';
    else if (level >= 10) title = 'Zaawansowany Koder';
    else if (level >= 5) title = 'Entuzjasta ES6';

    return { level, title, nextLevelXp, currentLevelXp };
  }
};
