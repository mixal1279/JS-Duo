import { NotificationConfig } from '../types';

class NotificationService {
  private inAppListeners: Array<(msg: { title: string; body: string; icon?: string }) => void> = [];

  checkPermission(): boolean {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }

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

  subscribeInApp(listener: (msg: { title: string; body: string; icon?: string }) => void) {
    this.inAppListeners.push(listener);
    return () => {
      this.inAppListeners = this.inAppListeners.filter(l => l !== listener);
    };
  }

  triggerNotification(title: string, body: string) {
    // Send in-app
    this.inAppListeners.forEach(listener => listener({ title, body }));

    // Send native push if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
        });
      } catch (err) {
        console.warn('Native notification failed:', err);
      }
    }
  }

  getMotivationalMessage(tone: NotificationConfig['tone'], streak: number): { title: string; body: string } {
    if (tone === 'strict') {
      return {
        title: `⚠️ Twój streak (${streak} dni) jest w śmiertelnym niebezpieczeństwie!`,
        body: 'Nie odkładaj JavaScriptu na jutro. Senior developerzy nie robią wymówek. Rozwiąż chociaż 1 lekcję teraz!'
      };
    } else if (tone === 'coder') {
      return {
        title: `💻 while(alive) { learnJS(); }`,
        body: `Twój streak wynosi ${streak} dni! Zostało jeszcze kilka pytań z Event Loopa i Promises do opanowania.`
      };
    } else {
      return {
        title: `🦉 Hej! Czas na 5 minut z JavaScriptem!`,
        body: `Utrzymaj swoją wspaniałą passę ${streak} dni nauki. Nowe wyzwania czekają na Ciebie w JS Duo!`
      };
    }
  }
}

export const notificationService = new NotificationService();
