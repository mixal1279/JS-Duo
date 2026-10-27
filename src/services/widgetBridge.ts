import { registerPlugin } from '@capacitor/core';
import { UserStats } from '../types';
import { storageService, getLocalDateString } from './storageService';
import { getDuoMood } from './duoMoodService';

export interface WidgetBridgePluginInterface {
  updateWidgetData(options: {
    statsJson?: string;
    streak?: number;
    hearts?: number;
    lastActiveDate?: string;
    dailyXp?: number;
    dailyXpTarget?: number;
    mood?: string;
  }): Promise<void>;
}

export const WidgetBridge = registerPlugin<WidgetBridgePluginInterface>('WidgetBridge');

export async function syncWidgetStats(stats: UserStats) {
  try {
    const statsJson = JSON.stringify(stats);
    const xpQuest = storageService.getQuests().find((quest) => quest.type === 'xp');
    await WidgetBridge.updateWidgetData({
      statsJson,
      streak: stats.streak,
      hearts: stats.hearts,
      lastActiveDate: stats.lastActiveDate,
      dailyXp: xpQuest?.current ?? 0,
      dailyXpTarget: xpQuest?.target ?? 30,
      mood: getDuoMood(new Date(), stats.lastActiveDate),
    });
  } catch (e) {
    // If running in browser or unsupported, gracefully ignore
  }
}
