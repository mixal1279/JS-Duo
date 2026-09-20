import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { soundService } from '../services/soundService';

interface InAppNotifMessage {
  id: string;
  title: string;
  body: string;
  icon?: string;
}

export const InAppNotificationToast: React.FC = () => {
  const [notification, setNotification] = useState<InAppNotifMessage | null>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribeInApp((msg) => {
      soundService.playLevelUp();
      const newNotif: InAppNotifMessage = {
        id: Date.now().toString(),
        title: msg.title,
        body: msg.body,
        icon: msg.icon,
      };
      setNotification(newNotif);

      // Auto dismiss after 6 seconds
      const timer = setTimeout(() => {
        setNotification((current) => (current?.id === newNotif.id ? null : current));
      }, 6000);

      return () => clearTimeout(timer);
    });

    return unsubscribe;
  }, []);

  if (!notification) return null;

  return (
    <aside aria-label="Powiadomienie w aplikacji" className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-md w-[calc(100%-2rem)] px-2 select-none animate-slide-down pointer-events-auto">
      <div className="bg-[#172630] border-2 border-duo-blue/70 rounded-2xl p-4 shadow-2xl flex items-start gap-3 backdrop-blur-md">
        <div className="w-10 h-10 rounded-2xl bg-duo-blue/20 border border-duo-blue flex items-center justify-center text-xl shrink-0 shadow-inner">
          {notification.icon?.startsWith('http') || notification.icon?.endsWith('.svg') ? (
            <Bell size={20} className="text-duo-blue" />
          ) : (
            '🦉'
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-black text-white truncate">
              {notification.title}
            </h4>
            <span className="text-[10px] uppercase font-extrabold text-duo-blue bg-duo-blue/20 px-1.5 py-0.2 rounded border border-duo-blue/30 shrink-0">
              JS Duo
            </span>
          </div>
          <p className="text-xs text-gray-300 mt-1 leading-relaxed line-clamp-3">
            {notification.body}
          </p>
        </div>

        <button
          onClick={() => setNotification(null)}
          className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
          title="Zamknij"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
};
