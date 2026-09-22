import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ArrowRight } from 'lucide-react';
import { notificationService } from '../services/notificationService';

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
      const newNotif: InAppNotifMessage = {
        id: Date.now().toString(),
        title: msg.title,
        body: msg.body,
        icon: msg.icon,
      };
      setNotification(newNotif);

      // Auto dismiss after 6.5 seconds
      const timer = setTimeout(() => {
        setNotification((current) => (current?.id === newNotif.id ? null : current));
      }, 6500);

      return () => clearTimeout(timer);
    });

    return unsubscribe;
  }, []);

  const handleClickToast = () => {
    // Dismiss toast and notify listeners (e.g. switch to path view)
    setNotification(null);
    notificationService.triggerPracticeRequested();
  };

  return (
    <AnimatePresence>
      {notification && (
        <aside
          aria-label="Powiadomienie w aplikacji"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] max-w-md w-[calc(100%-1.5rem)] sm:w-full px-2 select-none pointer-events-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="bg-[#172630]/95 border-2 border-duo-blue/70 rounded-2xl p-3.5 sm:p-4 shadow-2xl flex items-start gap-3 backdrop-blur-md cursor-pointer hover:border-duo-blue transition-colors group"
            onClick={handleClickToast}
          >
            <div className="w-10 h-10 rounded-2xl bg-duo-blue/20 border border-duo-blue flex items-center justify-center text-xl shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              {notification.icon?.startsWith('http') || notification.icon?.endsWith('.svg') ? (
                <Bell size={20} className="text-duo-blue" />
              ) : (
                '🦉'
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-duo-blue transition-colors">
                  {notification.title}
                </h4>
                <span className="text-[10px] uppercase font-extrabold text-duo-blue bg-duo-blue/20 px-1.5 py-0.5 rounded border border-duo-blue/30 shrink-0">
                  JS Duo
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed line-clamp-3">
                {notification.body}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-duo-blue mt-1.5 group-hover:underline">
                <span>Kliknij, aby przejść do nauki</span>
                <ArrowRight size={12} />
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setNotification(null);
              }}
              className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
              title="Zamknij"
            >
              <X size={16} />
            </button>
          </motion.div>
        </aside>
      )}
    </AnimatePresence>
  );
};
