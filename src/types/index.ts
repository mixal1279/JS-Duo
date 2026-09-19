export type QuestionType = 'single-choice' | 'output-predict' | 'fill-gap' | 'code-order';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: number;
  unitId: number;
  unitTitle: string;
  lessonIndex: number;
  question: string;
  codeSnippet?: string;
  type: QuestionType;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
  points: number;
}

export interface Unit {
  id: number;
  title: string;
  description: string;
  color: string;
  totalQuestions: number;
  icon: string;
}

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  gems: number;
  hearts: number;
  maxHearts: number;
  completedQuestionIds: number[];
  unlockedUnit: number;
  duelWins: number;
  duelLosses: number;
  league: 'Brązowa' | 'Srebrna' | 'Złota' | 'Szafirowa' | 'Rubinowa' | 'Diamentowa';
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  gemsReward: number;
  claimed: boolean;
  type: 'xp' | 'lessons' | 'perfect' | 'duel';
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  isCurrentUser?: boolean;
  streak: number;
  badge?: string;
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  level: number;
  status: 'online' | 'w grze' | 'offline';
  duelWins: number;
  lastActive: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderName: string;
  senderAvatar: string;
  senderBadge?: string;
  isCurrentUser: boolean;
  text: string;
  codeSnippet?: string;
  linkedQuestionId?: number;
  timestamp: string;
  reactions: { [emoji: string]: number };
}

export interface NotificationConfig {
  enabled: boolean;
  time: string; // '18:00'
  tone: 'friendly' | 'strict' | 'coder';
  hasBrowserPermission: boolean;
}

export type AchievementCategory = 'streak' | 'skills' | 'duels' | 'mastery';

export type AppTheme = 'deep-night' | 'light';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: 1 | 2 | 3;
  target: number;
  current: number;
  unit: string;
  isUnlocked: boolean;
  unlockedDate?: string;
  rewardGems: number;
  rewardXp: number;
}
