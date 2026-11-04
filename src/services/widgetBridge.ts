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

/** Przekazuje jeden spójny snapshot do natywnego widgetu Androida. */
export async function syncWidgetStats(stats: UserStats, quests: DailyQuest[]): Promise<boolean> {
  const xpQuest = quests.find((quest) => quest.type === 'xp');
  const dane = {
    statsJson: JSON.stringify(stats),
    streak: Math.max(0, Number(stats.streak) || 0),
    hearts: stats.hearts,
    lastActiveDate: stats.lastActiveDate,
    dailyXp: xpQuest?.current ?? 0,
    dailyXpTarget: xpQuest?.target ?? 30,
    dailyQuestCompletedCount: quests.filter((quest) => quest.current >= quest.target).length,
    dailyQuestTotalCount: quests.length,
    nextDailyQuestTitle: quests.find((quest) => quest.current < quest.target)?.title ?? '',
  };

  try {
    await WidgetBridge.updateWidgetData(dane);
    console.info('[WidgetBridge] Widget zaktualizowany', {
      streak: dane.streak,
      lastActiveDate: dane.lastActiveDate,
      dailyXp: dane.dailyXp,
    });
    return true;
  } catch (error) {
    // Brak natywnego pluginu w przeglądarce jest normalny, ale na Androidzie błąd musi być widoczny.
    console.error('[WidgetBridge] Nie udało się zaktualizować widgetu:', error);
    return false;
  }
}
