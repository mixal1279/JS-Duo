import { UserStats, DailyQuest, LeaderboardUser, Friend, ChatMessage, NotificationConfig, AppTheme } from '../types';
import { INITIAL_LEADERBOARD, INITIAL_FRIENDS, INITIAL_CHAT_MESSAGES } from '../data/mockUsers';

const STATS_KEY = 'js_duo_user_stats_v3_clean';
const QUESTS_KEY = 'js_duo_daily_quests_v3_clean';
const LEADERBOARD_KEY = 'js_duo_leaderboard_v3_clean';
const FRIENDS_KEY = 'js_duo_friends_v3_clean';
const CHAT_KEY = 'js_duo_chat_v4_clean';
const NOTIF_KEY = 'js_duo_notification_cfg_v3_clean';
const THEME_KEY = 'js_duo_theme_v3_clean';

// Automatyczne czyszczenie przestarzałych wersji z pamięci lokalnej
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    ['js_duo_user_stats_v1', 'js_duo_daily_quests_v1', 'js_duo_user_stats_v2', 'js_duo_daily_quests_v2', 'js_duo_chat_v3_clean'].forEach((k) => {
      localStorage.removeItem(k);
    });
  } catch {
    // ignore
  }
}

// Czyste, świeże statystyki początkowe (Passa 0, 0 XP, Poziom 1, Liga Brązowa)
export const DEFAULT_USER_STATS: UserStats = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: '',
  gems: 50, // Początkowy pakiet startowy w stylu Duolingo
  hearts: 5,
  maxHearts: 5,
  completedQuestionIds: [],
  completedLessonKeys: [],
  unlockedUnit: 1,
  duelWins: 0,
  duelLosses: 0,
  league: 'Brązowa',
  streakFreeze: 0,
};

export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDaysDifference = (fromDateStr: string, toDateStr: string): number => {
  if (!fromDateStr || !toDateStr) return 0;
  const parts1 = fromDateStr.split('-').map(Number);
  const parts2 = toDateStr.split('-').map(Number);
  if (parts1.length < 3 || parts2.length < 3) return 0;
  const utc1 = Date.UTC(parts1[0], parts1[1] - 1, parts1[2]);
  const utc2 = Date.UTC(parts2[0], parts2[1] - 1, parts2[2]);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / MS_PER_DAY);
};

export const DEFAULT_DAILY_QUESTS: DailyQuest[] = [
  {
    id: 'q1',
    title: 'Codzienna dawka kodu',
    description: 'Zdobądź dzisiaj 30 XP w lekcjach',
    target: 30,
    current: 0,
    xpReward: 25,
    gemsReward: 10,
    claimed: false,
    type: 'xp',
  },
  {
    id: 'q2',
    title: 'Bezbłędny programista',
    description: 'Rozwiąż 5 pytań bez utraty serca',
    target: 5,
    current: 0,
    xpReward: 35,
    gemsReward: 15,
    claimed: false,
    type: 'perfect',
  },
  {
    id: 'q3',
    title: 'Mistrz Ścieżki',
    description: 'Ukończ 2 pełne lekcje',
    target: 2,
    current: 0,
    xpReward: 30,
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
  validateAndSyncStreak(stats: UserStats): { stats: UserStats; wasReset: boolean; freezeUsed: boolean } {
    if (!stats.lastActiveDate || stats.streak === 0) {
      return { stats, wasReset: false, freezeUsed: false };
    }

    const today = getLocalDateString();
    const diffDays = getDaysDifference(stats.lastActiveDate, today);

    // diffDays <= 0: active today (or future time), streak is safe
    // diffDays === 1: active yesterday, today is pending practice, streak is still alive!
    if (diffDays <= 1) {
      return { stats, wasReset: false, freezeUsed: false };
    }

    // diffDays >= 2: The user missed at least one full day!
    // Check if user has streak freeze
    const freezes = stats.streakFreeze || 0;
    if (freezes > 0 && diffDays === 2) {
      // 1 freeze protects exactly 1 missed day (yesterday)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateString(yesterday);

      const protectedStats: UserStats = {
        ...stats,
        streakFreeze: freezes - 1,
        lastActiveDate: yesterdayStr, // freeze marks yesterday as saved
      };
      this.saveStats(protectedStats);
      return { stats: protectedStats, wasReset: false, freezeUsed: true };
    }

    // Passa została przerwana - reset do 0
    const resetStats: UserStats = {
      ...stats,
      streak: 0,
    };
    this.saveStats(resetStats);
    return { stats: resetStats, wasReset: true, freezeUsed: false };
  },

  getStats(): UserStats {
    try {
      const data = localStorage.getItem(STATS_KEY);
      if (data) {
        const parsed: UserStats = JSON.parse(data);
        const { stats } = this.validateAndSyncStreak(parsed);
        return stats;
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_USER_STATS };
  },

  saveStats(stats: UserStats) {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error(e);
    }
  },

  resetAllProgress(): UserStats {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STATS_KEY);
        localStorage.removeItem(QUESTS_KEY);
        localStorage.removeItem(LEADERBOARD_KEY);
      }
    } catch (e) {
      console.error(e);
    }
    return { ...DEFAULT_USER_STATS };
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

  getTheme(): AppTheme {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'deep-night') return saved as AppTheme;
    } catch {
      // fallback
    }
    return 'deep-night';
  },

  saveTheme(theme: AppTheme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
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
