import { NotificationConfig } from '../types';
import { soundService } from './soundService';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface InactivityCheckResult {
  notified: boolean;
  reason: string;
  hoursInactive: number;
}

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  type: 'welcome' | 'daily' | 'inactivity' | 'hearts' | 'streak' | 'test';
}

export interface MonitorOptions {
  getStreak: () => number;
  getTone?: () => NotificationConfig['tone'];
  getEnabled?: () => boolean;
  getTime?: () => string;
  getLastActiveDate?: () => string | undefined;
  getHearts?: () => number;
  getMaxHearts?: () => number;
  onPracticeRequested?: () => void;
}

const STORAGE_LAST_LOGIN_KEY = 'js_duo_last_login_ts_v1';
const STORAGE_LAST_NOTIF_SENT_KEY = 'js_duo_last_inactivity_notif_ts_v1';
const STORAGE_LAST_DAILY_REMINDER_DATE_KEY = 'js_duo_last_daily_reminder_date_v1';
const STORAGE_LAST_HEARTS_RESTORED_KEY = 'js_duo_last_hearts_full_ts_v1';
const STORAGE_NOTIF_HISTORY_KEY = 'js_duo_notif_history_v1';
const INACTIVITY_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class NotificationService {
  private inAppListeners: Array<(msg: { title: string; body: string; icon?: string }) => void> = [];
  private monitorInterval: any = null;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private practiceRequestedListeners: Array<() => void> = [];
  private previousHeartsCount: number | null = null;

  private isCapacitor = typeof window !== 'undefined' && Capacitor.isNativePlatform();

  constructor() {
    try {
      this.initCapacitorNotifications();
    } catch (e) {
      console.warn('Capacitor init failed gracefully:', e);
    }
    try {
      this.initServiceWorker();
    } catch (e) {
      console.warn('SW init failed gracefully:', e);
    }
    try {
      this.ensureInitialLoginTimestamp();
    } catch (e) {
      console.warn('Login timestamp init failed gracefully:', e);
    }
    try {
      this.initServiceWorkerMessageListener();
    } catch (e) {
      console.warn('SW listener failed gracefully:', e);
    }
  }

  // Initialize native Capacitor Local Notifications
  private async initCapacitorNotifications() {
    if (!this.isCapacitor) return;

    try {
      if (Capacitor.isPluginAvailable('LocalNotifications')) {
        LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
          console.log('Capacitor Local notification clicked:', notificationAction);
          this.practiceRequestedListeners.forEach((l) => l());
        });
      }
    } catch (e) {
      console.warn('Error initializing Capacitor local notifications:', e);
    }
  }

  // Register service worker if available in browser
  async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        this.swRegistration = reg;

        // Wait until service worker is active
        navigator.serviceWorker.ready.then((readyReg) => {
          this.swRegistration = readyReg;
        });

        return reg;
      } catch (err) {
        console.info('Service Worker registration skipped or unavailable:', err);
        return null;
      }
    }
    return null;
  }

  // Listen to messages from Service Worker (e.g. when user clicks notification or action button)
  private initServiceWorkerMessageListener() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NOTIFICATION_CLICKED') {
          if (event.data.action === 'practice' || event.data.action === 'open') {
            this.practiceRequestedListeners.forEach((l) => l());
          }
        }
      });
    }
  }

  // Allow app to subscribe to notification click actions
  onPracticeRequested(listener: () => void) {
    this.practiceRequestedListeners.push(listener);
    return () => {
      this.practiceRequestedListeners = this.practiceRequestedListeners.filter((l) => l !== listener);
    };
  }

  // Trigger practice requested (e.g. from in-app toast click)
  triggerPracticeRequested() {
    this.practiceRequestedListeners.forEach((l) => l());
  }

  // Ensure there is always a recorded login timestamp
  private ensureInitialLoginTimestamp() {
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem(STORAGE_LAST_LOGIN_KEY);
      if (!existing) {
        localStorage.setItem(STORAGE_LAST_LOGIN_KEY, Date.now().toString());
      }
    }
  }

  // Check if native app or browser notifications permission is granted
  checkPermission(): boolean {
    if (this.isCapacitor) {
      // In native apps, we check synchronously with fallback to localStorage cache or default true once granted
      return localStorage.getItem('js_duo_native_permission_granted') === 'true';
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }

  // Get granular status: 'granted' | 'denied' | 'default' | 'unsupported'
  getPermissionState(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (this.isCapacitor) {
      const stored = localStorage.getItem('js_duo_native_permission_state');
      if (stored === 'granted' || stored === 'denied' || stored === 'prompt') {
        return stored === 'prompt' ? 'default' : (stored as any);
      }
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  }

  // Request permission from the user and send welcome push if granted
  async requestPermission(): Promise<boolean> {
    // 1. Native Capacitor Local Notifications flow
    if (this.isCapacitor) {
      try {
        let granted = false;

        if (Capacitor.isPluginAvailable('LocalNotifications')) {
          try {
            const localPerm = await LocalNotifications.requestPermissions();
            if (localPerm.display === 'granted') {
              granted = true;
            }
          } catch (e) {
            console.warn('LocalNotifications permission request warning:', e);
          }
        }

        localStorage.setItem('js_duo_native_permission_granted', granted ? 'true' : 'false');

        if (granted) {
          soundService.playLevelUp();
          await this.sendPushNotification('🎉 Powiadomienia włączone w aplikacji!', {
            body: 'Sowa Duo będzie pilnować Twojej codziennej passy i przypominać o nauce JavaScript!',
            icon: '/favicon.png',
            tag: 'welcome-notification',
            type: 'welcome',
          });
          return true;
        }
        return false;
      } catch (capErr) {
        console.warn('Error requesting Capacitor local permissions:', capErr);
      }
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      // Support both Promise-based and legacy callback-based requestPermission
      let result: NotificationPermission;
      try {
        const promise = Notification.requestPermission();
        if (promise && typeof promise.then === 'function') {
          result = await promise;
        } else {
          result = await new Promise<NotificationPermission>((resolve) => {
            Notification.requestPermission((status) => resolve(status));
          });
        }
      } catch {
        // Fallback for older browsers
        result = await new Promise<NotificationPermission>((resolve) => {
          Notification.requestPermission((status) => resolve(status));
        });
      }

      if (result === 'granted') {
        soundService.playLevelUp();
        // Send instant confirmation notification
        await this.sendPushNotification('🎉 Powiadomienia włączone!', {
          body: 'Sowa Duo będzie pilnować Twojej codziennej passy i przypominać o nauce JavaScript!',
          icon: '/favicon.png',
          tag: 'welcome-notification',
          type: 'welcome',
        });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return false;
    }
  }

  // In-app listener subscription for toast or modal popups
  subscribeInApp(listener: (msg: { title: string; body: string; icon?: string }) => void) {
    this.inAppListeners.push(listener);
    return () => {
      this.inAppListeners = this.inAppListeners.filter((l) => l !== listener);
    };
  }

  // Record user activity / login session (resets the 24h timer)
  recordActivity(customTimestamp?: number): void {
    if (typeof window === 'undefined') return;
    const ts = customTimestamp !== undefined ? customTimestamp : Date.now();
    localStorage.setItem(STORAGE_LAST_LOGIN_KEY, ts.toString());
  }

  // Get timestamp of the last logged activity
  getLastLoginTime(): number {
    if (typeof window === 'undefined') return Date.now();
    const stored = localStorage.getItem(STORAGE_LAST_LOGIN_KEY);
    if (!stored) {
      const now = Date.now();
      localStorage.setItem(STORAGE_LAST_LOGIN_KEY, now.toString());
      return now;
    }
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) ? Date.now() : parsed;
  }

  // Get hours since last login
  getHoursSinceLastLogin(): number {
    const elapsedMs = Date.now() - this.getLastLoginTime();
    return Math.max(0, elapsedMs / (1000 * 60 * 60));
  }

  // Timestamp of the last 24h notification dispatched
  getLastInactivityNotificationTime(): number {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem(STORAGE_LAST_NOTIF_SENT_KEY);
    return stored ? parseInt(stored, 10) || 0 : 0;
  }

  private setLastInactivityNotificationTime(ts: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_LAST_NOTIF_SENT_KEY, ts.toString());
  }

  // Date of the last daily reminder dispatched (e.g. '2026-09-22')
  getLastDailyReminderDate(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_LAST_DAILY_REMINDER_DATE_KEY) || '';
  }

  private setLastDailyReminderDate(dateStr: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_LAST_DAILY_REMINDER_DATE_KEY, dateStr);
  }

  // Notification history
  getNotificationHistory(): NotificationHistoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_NOTIF_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private addToHistory(item: NotificationHistoryItem): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getNotificationHistory();
      const updated = [item, ...current].slice(0, 10);
      localStorage.setItem(STORAGE_NOTIF_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // Storage might be full or private
    }
  }

  clearNotificationHistory(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_NOTIF_HISTORY_KEY);
  }

  // Send native browser Push notification with service worker or Notification API
  async sendPushNotification(
    title: string,
    options?: NotificationOptions & { type?: NotificationHistoryItem['type'] }
  ): Promise<boolean> {
    const notifOptions: NotificationOptions = {
      body: options?.body || '',
      icon: options?.icon || '/favicon.png',
      badge: options?.badge || '/favicon.png',
      tag: options?.tag || 'js-duo-notification',
      requireInteraction: options?.requireInteraction ?? true,
      data: options?.data || { url: typeof window !== 'undefined' ? window.location.href : '/' },
      ...options,
    };

    // Play chime sound
    soundService.playNotification();

    // 1. Dispatch In-App Toast
    this.inAppListeners.forEach((listener) =>
      listener({
        title,
        body: notifOptions.body || '',
        icon: typeof notifOptions.icon === 'string' ? notifOptions.icon : undefined,
      })
    );

    // Save to history
    this.addToHistory({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      title,
      body: notifOptions.body || '',
      timestamp: Date.now(),
      type: options?.type || 'test',
    });

    // 2. Dispatch via Capacitor Native Notification (shows on OS status bar even when app is closed / backgrounded)
    if (this.isCapacitor && Capacitor.isPluginAvailable('LocalNotifications')) {
      try {
        const notifId = Math.floor(Math.random() * 1000000) + 1;
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body: notifOptions.body || '',
              id: notifId,
              schedule: { at: new Date(Date.now() + 100) },
              extra: {
                tag: notifOptions.tag,
                type: options?.type || 'test',
              },
            },
          ],
        });
        return true;
      } catch (nativeErr) {
        console.warn('Capacitor native notification dispatch failed, falling back:', nativeErr);
      }
    }

    // 3. Dispatch native browser notification if permitted (Web / PWA)
    if (this.checkPermission()) {
      try {
        // Preferred: Active Service Worker
        if ('serviceWorker' in navigator) {
          try {
            const readyReg = await Promise.race([
              navigator.serviceWorker.ready,
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
            ]);

            const targetReg = readyReg || this.swRegistration;
            if (targetReg && 'showNotification' in targetReg) {
              await targetReg.showNotification(title, {
                ...notifOptions,
                // Actions supported in Service Worker Notifications
                // @ts-expect-error - Actions are part of ServiceWorker NotificationOptions
                actions: [
                  { action: 'practice', title: 'Ćwicz teraz 🚀' },
                  { action: 'dismiss', title: 'Później' },
                ],
              });
              return true;
            }
          } catch (swErr) {
            console.warn('SW notification fallback to window Notification:', swErr);
          }
        }

        // Fallback: standard window Notification constructor
        if (typeof Notification !== 'undefined') {
          const notif = new Notification(title, notifOptions);
          notif.onclick = () => {
            window.focus();
            notif.close();
            this.practiceRequestedListeners.forEach((l) => l());
          };
          return true;
        }
      } catch (err) {
        console.warn('Native push notification error (handled gracefully):', err);
        return false;
      }
    }

    return false;
  }

  // Backwards-compatible synchronous trigger
  triggerNotification(title: string, body: string) {
    this.sendPushNotification(title, { body, type: 'test' });
  }

  // Motivational message for 24-hour absence / inactivity
  get24HourInactivityMessage(streak: number, tone: NotificationConfig['tone'] = 'friendly'): { title: string; body: string } {
    if (tone === 'strict') {
      return {
        title: `⚠️ Twój streak (${streak} dni) wisi na włosku!`,
        body: `Minęły już 24 godziny od ostatniej nauki w JS Duo! Rozwiąż choć 1 lekcję natychmiast, zanim Twój streak przepadnie na zawsze.`,
      };
    } else if (tone === 'coder') {
      return {
        title: `💻 ERR_IDLE_TIMEOUT: 24h bez commita wiedzy!`,
        body: `Twój streak (${streak} dni) czeka na wznowienie pętli. Opanuj nowe zagadnienia z JS i utrzymaj branch w stanie zielonym!`,
      };
    } else {
      return {
        title: `🦉 Sowa JS Duo tęskni! Czas na codzienną sesję`,
        body: `Nie logowałeś się przez ostatnie 24 godziny. Poświęć 3 minuty na JavaScript i uratuj swoją wspaniałą passę ${streak} dni!`,
      };
    }
  }

  // Daily Scheduled Message based on user's chosen reminder time
  getDailyReminderMessage(streak: number, tone: NotificationConfig['tone'] = 'friendly'): { title: string; body: string } {
    if (tone === 'strict') {
      return {
        title: `⏰ Czas na lekcję! Nie zawiedź Sowy Duo.`,
        body: `Twój streak wynosi ${streak} dni. Zrób dzisiejszą sesję zanim minie północ, inaczej stracisz swoje postępy!`,
      };
    } else if (tone === 'coder') {
      return {
        title: `🚀 const streak = ${streak}; // Codzienny stand-up JS!`,
        body: `Pora na krótki sprint kodowania. 5 szybkich pytań z JavaScriptu utrzyma Twoje umiejętności na najwyższym poziomie.`,
      };
    } else {
      return {
        title: `🦉 Czas na Twoją codzienną dawkę JavaScriptu!`,
        body: `Utrzymaj swoją passę ${streak} ${streak === 1 ? 'dnia' : 'dni'}! Tylko 3 minuty dzielą Cię od kolejnego poziomu programisty.`,
      };
    }
  }

  // Hearts restored message
  getHeartsRestoredMessage(): { title: string; body: string } {
    return {
      title: `❤️ Wszystkie serca zregenerowane! (5/5)`,
      body: `Twoja energia jest w 100% odnowiona! Wracaj na ścieżkę nauki i zdobywaj kolejne poziomy w JS Duo.`,
    };
  }

  // General motivational message based on tone
  getMotivationalMessage(tone: NotificationConfig['tone'], streak: number): { title: string; body: string } {
    return this.getDailyReminderMessage(streak, tone);
  }

  /**
   * Schedule offline alarms via Capacitor LocalNotifications so that notifications fire even when app is closed
   */
  async scheduleNativeBackgroundAlarms(timeStr: string, streak: number, tone: NotificationConfig['tone']) {
    if (!this.isCapacitor || !Capacitor.isPluginAvailable('LocalNotifications')) return;

    try {
      // Cancel previous scheduled alarms
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }

      const next = this.getNextReminderTime(timeStr);
      const msg = this.getDailyReminderMessage(streak, tone);

      // Schedule daily reminder at specified hour
      await LocalNotifications.schedule({
        notifications: [
          {
            title: msg.title,
            body: msg.body,
            id: 1001,
            schedule: {
              at: next.date,
            },
            extra: {
              type: 'daily',
            },
          },
          // Schedule 24h inactivity warning
          {
            title: `⚠️ Twój streak (${streak} dni) wisi na włosku!`,
            body: 'Minęły 24 godziny od ostatniej nauki w JS Duo! Rozwiąż 1 lekcję i uratuj passę.',
            id: 1002,
            schedule: {
              at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
            extra: {
              type: 'inactivity',
            },
          },
        ],
      });
      console.log('Capacitor native background alarms successfully scheduled for:', next.date);
    } catch (e) {
      console.warn('Error scheduling Capacitor native alarms:', e);
    }
  }

  // Calculate next scheduled reminder time string and date object
  getNextReminderTime(timeStr: string = '18:00'): { label: string; date: Date } {
    const [hours, minutes] = (timeStr || '18:00').split(':').map((v) => parseInt(v, 10) || 0);
    const now = new Date();
    const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

    let isTomorrow = false;
    if (now.getTime() >= reminderDate.getTime()) {
      reminderDate.setDate(reminderDate.getDate() + 1);
      isTomorrow = true;
    }

    const diffMinutes = Math.round((reminderDate.getTime() - now.getTime()) / (1000 * 60));
    let diffLabel = '';
    if (diffMinutes < 60) {
      diffLabel = `(za ${diffMinutes} min)`;
    } else {
      const diffHours = Math.round(diffMinutes / 60);
      diffLabel = `(za ok. ${diffHours} godz.)`;
    }

    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const label = `${isTomorrow ? 'Jutro' : 'Dzisiaj'} o ${formattedTime} ${diffLabel}`;

    return { label, date: reminderDate };
  }

  /**
   * Check if daily scheduled reminder should be dispatched
   */
  async checkDailyReminderAndNotify(
    streak: number,
    timeStr: string = '18:00',
    tone: NotificationConfig['tone'] = 'friendly',
    lastActiveDate?: string,
    force: boolean = false
  ): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const lastSentDate = this.getLastDailyReminderDate();

    // If user already practiced today and we are not forcing, no need to remind
    if (!force && lastActiveDate === today) {
      return false;
    }

    // If already sent today and not forcing, do not spam
    if (!force && lastSentDate === today) {
      return false;
    }

    // Check if current time has passed the configured hour:minute
    if (!force) {
      const [targetH, targetM] = (timeStr || '18:00').split(':').map((v) => parseInt(v, 10) || 0);
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      const isTimeReached = currentH > targetH || (currentH === targetH && currentM >= targetM);
      if (!isTimeReached) {
        return false;
      }
    }

    // Send daily reminder
    const msg = this.getDailyReminderMessage(streak, tone);
    await this.sendPushNotification(msg.title, {
      body: msg.body,
      icon: '/favicon.png',
      tag: 'js-duo-daily-reminder',
      requireInteraction: true,
      type: 'daily',
    });

    this.setLastDailyReminderDate(today);
    return true;
  }

  /**
   * Check if user has been inactive for 24 hours and dispatch Push notification
   */
  async checkInactivityAndNotify(
    streak: number,
    tone: NotificationConfig['tone'] = 'friendly',
    force: boolean = false
  ): Promise<InactivityCheckResult> {
    const hoursInactive = this.getHoursSinceLastLogin();
    const lastLogin = this.getLastLoginTime();
    const lastNotifSent = this.getLastInactivityNotificationTime();
    const elapsedSinceLastLogin = Date.now() - lastLogin;
    const elapsedSinceLastNotif = Date.now() - lastNotifSent;

    // Must be >= 24h since last login
    const isOver24h = elapsedSinceLastLogin >= INACTIVITY_THRESHOLD_MS;

    // Avoid spamming: do not notify again if we already sent one in the last 20 hours
    const notSpammedRecently = elapsedSinceLastNotif >= 20 * 60 * 60 * 1000;

    if (force || (isOver24h && notSpammedRecently)) {
      const msg = this.get24HourInactivityMessage(streak, tone);
      await this.sendPushNotification(msg.title, {
        body: msg.body,
        icon: '/favicon.png',
        tag: 'js-duo-24h-inactivity-reminder',
        requireInteraction: true,
        type: 'inactivity',
      });

      this.setLastInactivityNotificationTime(Date.now());

      return {
        notified: true,
        reason: force ? 'Wysłano wymuszone powiadomienie testowe' : 'Wysłano powiadomienie po 24h nieobecności',
        hoursInactive,
      };
    }

    let reason = 'Czas od ostatniego logowania nie przekracza 24h';
    if (isOver24h && !notSpammedRecently) {
      reason = 'Powiadomienie zostało już wysłane w ciągu ostatnich 24h';
    }

    return {
      notified: false,
      reason,
      hoursInactive,
    };
  }

  /**
   * Check if hearts were regenerated to maximum and send alert
   */
  async checkHeartsRestoredAndNotify(currentHearts: number, maxHearts: number = 5): Promise<boolean> {
    if (this.previousHeartsCount === null) {
      this.previousHeartsCount = currentHearts;
      return false;
    }

    const wasLow = this.previousHeartsCount < maxHearts;
    const isNowFull = currentHearts >= maxHearts;
    this.previousHeartsCount = currentHearts;

    if (wasLow && isNowFull) {
      const lastSent = parseInt(localStorage.getItem(STORAGE_LAST_HEARTS_RESTORED_KEY) || '0', 10);
      // Throttle to at most once per 2 hours
      if (Date.now() - lastSent > 2 * 60 * 60 * 1000) {
        const msg = this.getHeartsRestoredMessage();
        await this.sendPushNotification(msg.title, {
          body: msg.body,
          icon: '/favicon.png',
          tag: 'js-duo-hearts-full',
          type: 'hearts',
        });
        localStorage.setItem(STORAGE_LAST_HEARTS_RESTORED_KEY, Date.now().toString());
        return true;
      }
    }
    return false;
  }

  /**
   * Helper to simulate 24-hour inactivity for testing
   */
  async simulate24HourInactivity(streak: number, tone: NotificationConfig['tone'] = 'friendly'): Promise<InactivityCheckResult> {
    const simulatedPastTime = Date.now() - 25 * 60 * 60 * 1000;
    this.recordActivity(simulatedPastTime);
    this.setLastInactivityNotificationTime(0);

    return this.checkInactivityAndNotify(streak, tone, true);
  }

  /**
   * Helper to simulate daily scheduled reminder immediately
   */
  async simulateDailyReminder(streak: number, timeStr: string, tone: NotificationConfig['tone'] = 'friendly'): Promise<boolean> {
    return this.checkDailyReminderAndNotify(streak, timeStr, tone, undefined, true);
  }

  /**
   * Helper to simulate hearts restored notification
   */
  async simulateHeartsRestored(): Promise<boolean> {
    const msg = this.getHeartsRestoredMessage();
    return this.sendPushNotification(msg.title, {
      body: msg.body,
      icon: '/favicon.png',
      tag: 'js-duo-hearts-full-sim',
      type: 'hearts',
    });
  }

  /**
   * Starts periodic unified background monitoring (Daily scheduled + 24h Inactivity + Hearts)
   */
  startUnifiedMonitor(options: MonitorOptions): () => void {
    this.stopInactivityMonitor();

    const {
      getStreak,
      getTone = () => 'friendly',
      getEnabled = () => true,
      getTime = () => '18:00',
      getLastActiveDate = () => undefined,
      getHearts,
      getMaxHearts = () => 5,
      onPracticeRequested,
    } = options;

    if (onPracticeRequested) {
      this.onPracticeRequested(onPracticeRequested);
    }

    let lastScheduledTime = '';

    const runChecks = () => {
      if (!getEnabled()) return;

      const streak = getStreak();
      const tone = getTone();
      const time = getTime();
      const lastActive = getLastActiveDate();

      // Ensure native offline alarms are scheduled in Android/iOS so notifications fire when app is closed (only once per time change)
      if (this.isCapacitor && lastScheduledTime !== time) {
        lastScheduledTime = time;
        this.scheduleNativeBackgroundAlarms(time, streak, tone);
      }

      // 1. Daily scheduled reminder
      this.checkDailyReminderAndNotify(streak, time, tone, lastActive);

      // 2. 24h absence / inactivity check
      this.checkInactivityAndNotify(streak, tone);

      // 3. Hearts full check
      if (getHearts) {
        this.checkHeartsRestoredAndNotify(getHearts(), getMaxHearts());
      }
    };

    // Run immediately
    runChecks();

    // Run every 30 seconds
    this.monitorInterval = setInterval(runChecks, 30 * 1000);

    // Also run on tab refocus / visibility
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        runChecks();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      this.stopInactivityMonitor();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }

  /**
   * Backwards-compatible startInactivityMonitor
   */
  startInactivityMonitor(
    getStreak: () => number,
    getTone: () => NotificationConfig['tone'] = () => 'friendly',
    getEnabled: () => boolean = () => true
  ): () => void {
    return this.startUnifiedMonitor({
      getStreak,
      getTone,
      getEnabled,
    });
  }

  /**
   * Stop background inactivity monitoring
   */
  stopInactivityMonitor(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }
}

export const notificationService = new NotificationService();
