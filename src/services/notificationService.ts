import { NotificationConfig } from '../types';

export interface InactivityCheckResult {
  notified: boolean;
  reason: string;
  hoursInactive: number;
}

const STORAGE_LAST_LOGIN_KEY = 'js_duo_last_login_ts_v1';
const STORAGE_LAST_NOTIF_SENT_KEY = 'js_duo_last_inactivity_notif_ts_v1';
const INACTIVITY_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class NotificationService {
  private inAppListeners: Array<(msg: { title: string; body: string; icon?: string }) => void> = [];
  private monitorInterval: any = null;
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initServiceWorker();
    this.ensureInitialLoginTimestamp();
  }

  // Register service worker if available in browser
  async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        this.swRegistration = reg;
        return reg;
      } catch (err) {
        console.info('Service Worker registration skipped or unavailable:', err);
        return null;
      }
    }
    return null;
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

  // Check if browser notifications permission is granted
  checkPermission(): boolean {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }

  // Request permission from the user
  async requestPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        return result === 'granted';
      } catch {
        return false;
      }
    }
    return false;
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

  // Send native browser Push notification with service worker or Notification API
  async sendPushNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    const notifOptions: NotificationOptions = {
      body: options?.body || '',
      icon: options?.icon || '/favicon.svg',
      badge: options?.badge || '/favicon.svg',
      tag: options?.tag || 'js-duo-notification',
      requireInteraction: options?.requireInteraction ?? true,
      data: options?.data || { url: window.location.href },
      ...options,
    };

    // 1. Send in-app message
    this.inAppListeners.forEach((listener) =>
      listener({
        title,
        body: notifOptions.body || '',
        icon: typeof notifOptions.icon === 'string' ? notifOptions.icon : undefined,
      })
    );

    // 2. Send native browser notification if permitted
    if (this.checkPermission()) {
      try {
        // Try via active service worker registration first
        if (this.swRegistration && 'showNotification' in this.swRegistration) {
          await this.swRegistration.showNotification(title, notifOptions);
          return true;
        }

        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && 'showNotification' in reg) {
            await reg.showNotification(title, notifOptions);
            return true;
          }
        }

        // Fallback to standard window Notification constructor
        const notif = new Notification(title, notifOptions);
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        return true;
      } catch (err) {
        console.warn('Native push notification error:', err);
        return false;
      }
    }

    return false;
  }

  // Backwards-compatible synchronous trigger
  triggerNotification(title: string, body: string) {
    this.sendPushNotification(title, { body });
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

  // General motivational message based on tone
  getMotivationalMessage(tone: NotificationConfig['tone'], streak: number): { title: string; body: string } {
    return this.get24HourInactivityMessage(streak, tone);
  }

  /**
   * Check if user has been inactive for 24 hours and dispatch Push notification
   * @param streak Current user streak in days
   * @param tone User's configured tone ('friendly' | 'strict' | 'coder')
   * @param force Force send regardless of time elapsed (e.g. for testing)
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
        icon: '/favicon.svg',
        tag: 'js-duo-24h-inactivity-reminder',
        requireInteraction: true,
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
   * Helper to simulate 24-hour inactivity for testing
   * Sets last login to 25 hours ago, runs the check and sends the push notification
   */
  async simulate24HourInactivity(streak: number, tone: NotificationConfig['tone'] = 'friendly'): Promise<InactivityCheckResult> {
    // Set last login to 25 hours ago
    const simulatedPastTime = Date.now() - (25 * 60 * 60 * 1000);
    this.recordActivity(simulatedPastTime);
    // Reset last notification sent time so it doesn't throttle
    this.setLastInactivityNotificationTime(0);

    return this.checkInactivityAndNotify(streak, tone, true);
  }

  /**
   * Starts periodic background inactivity monitoring
   */
  startInactivityMonitor(
    getStreak: () => number,
    getTone: () => NotificationConfig['tone'] = () => 'friendly',
    getEnabled: () => boolean = () => true
  ): () => void {
    // Stop any existing monitor
    this.stopInactivityMonitor();

    const runCheck = () => {
      if (!getEnabled()) return;
      this.checkInactivityAndNotify(getStreak(), getTone());
    };

    // Run immediately
    runCheck();

    // Periodic check every 60 seconds
    this.monitorInterval = setInterval(runCheck, 60 * 1000);

    // Also check when tab/window becomes visible again
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        runCheck();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    // Return cleanup function
    return () => {
      this.stopInactivityMonitor();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
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
