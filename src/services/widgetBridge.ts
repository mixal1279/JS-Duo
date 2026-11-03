import { registerPlugin } from '@capacitor/core';
import { DailyQuest, UserStats } from '../types';

export interface WidgetBridgePluginInterface {
  updateWidgetData(options: {
    statsJson?: string;
    streak?: number;
    hearts?: number;
    lastActiveDate?: string;
    dailyXp?: number;
    dailyXpTarget?: number;
    dailyQuestCompletedCount?: number;
    dailyQuestTotalCount?: number;
    nextDailyQuestTitle?: string;
  }): Promise<void>;
}

export const WidgetBridge = registerPlugin<WidgetBridgePluginInterface>('WidgetBridge');

export async function syncWidgetStats(stats: UserStats, quests: DailyQuest[]) {
  try {
    const statsJson = JSON.stringify(stats);
    const xpQuest = quests.find((quest) => quest.type === 'xp');
    await WidgetBridge.updateWidgetData({
      statsJson,
      streak: stats.streak,
      hearts: stats.hearts,
      lastActiveDate: stats.lastActiveDate,
      dailyXp: xpQuest?.current ?? 0,
      dailyXpTarget: xpQuest?.target ?? 30,
      dailyQuestCompletedCount: quests.filter((quest) => quest.current >= quest.target).length,
      dailyQuestTotalCount: quests.length,
      nextDailyQuestTitle: quests.find((quest) => quest.current < quest.target)?.title ?? '',
    });
  } catch {
    // Native widget is optional on web/PWA and must never interrupt the app.
  }
}
