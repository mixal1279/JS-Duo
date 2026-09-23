import { registerPlugin } from '@capacitor/core';
import { UserStats } from '../types';

export interface WidgetBridgePluginInterface {
  updateWidgetData(options: {
    statsJson?: string;
    streak?: number;
    hearts?: number;
    lastActiveDate?: string;
  }): Promise<void>;
}

export const WidgetBridge = registerPlugin<WidgetBridgePluginInterface>('WidgetBridge');

export async function syncWidgetStats(stats: UserStats) {
  try {
    const statsJson = JSON.stringify(stats);
    await WidgetBridge.updateWidgetData({
      statsJson,
      streak: stats.streak,
      hearts: stats.hearts,
      lastActiveDate: stats.lastActiveDate,
    });
  } catch (e) {
    // If running in browser or unsupported, gracefully ignore
  }
}
