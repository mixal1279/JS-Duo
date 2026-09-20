import React, { useState, useEffect } from 'react';
import { Bell, Check, Sparkles, X, ShieldAlert } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { soundService } from '../services/soundService';

interface NotificationBannerProps {
  onOpenSettings: () => void;
  streak: number;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  onOpenSettings,
  streak,
}) => {
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('js_duo_dismissed_notif_banner') === 'true';
  });
  const [justGranted, setJustGranted] = useState(false);

  useEffect(() => {
    setPermissionState(notificationService.getPermissionState());
  }, []);

  if (isDismissed || permissionState === 'granted' || permissionState === 'unsupported') {
    if (justGranted) {
      return (
        <div className="mx-auto max-w-xl px-3 sm:px-4 mb-4">
          <div className="bg-emerald-950/60 border-2 border-emerald-500/50 rounded-2xl p-3 flex items-center justify-between gap-3 text-emerald-200 animate-fade-in shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Check size={18} />
              </div>
              <span className="text-xs font-bold">
                Powiadomienia zostały włączone! Sowa Duo będzie pilnować Twojej passy.
              </span>
            </div>
            <button
              onClick={() => setJustGranted(false)}
              className="text-emerald-400 hover:text-white p-1 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleRequestPermission = async () => {
    soundService.playClick();
    const granted = await notificationService.requestPermission();
    const newState = notificationService.getPermissionState();
    setPermissionState(newState);

    if (granted) {
      soundService.playLevelUp();
      setJustGranted(true);
      setTimeout(() => setJustGranted(false), 5000);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('js_duo_dismissed_notif_banner', 'true');
  };

  return (
    <div className="mx-auto max-w-xl px-3 sm:px-4 mb-4 select-none animate-slide-down">
      <div className="bg-gradient-to-r from-[#172630] via-[#1B323D] to-[#172630] border-2 border-duo-blue/50 rounded-2xl p-3.5 sm:p-4 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-duo-blue/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-duo-blue/20 border border-duo-blue/50 flex items-center justify-center text-duo-blue shrink-0 shadow-inner">
              <Bell size={20} className="animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-black text-white tracking-wide">
                  Nie trać passy ({streak} {streak === 1 ? 'dzień' : 'dni'})!
                </h4>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-duo-blue/30 text-duo-blue border border-duo-blue/40">
                  Zezwolenie
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed mt-0.5">
                {permissionState === 'denied'
                  ? 'Powiadomienia są zablokowane w Twojej przeglądarce. Odblokuj je w ustawieniach strony (ikona kłódki 🔒).'
                  : 'Zezwól na powiadomienia, aby Sowa Duo przypominała Ci o codziennej nauce JavaScriptu.'}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {permissionState !== 'denied' ? (
                  <button
                    onClick={handleRequestPermission}
                    className="px-4 py-2 rounded-xl bg-duo-blue hover:bg-duo-blueDark text-white font-black text-xs uppercase tracking-wider shadow-[0_3px_0_#1899d6] active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bell size={14} />
                    <span>Zezwól na powiadomienia</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenSettings}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider shadow-[0_3px_0_#b45309] active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert size={14} />
                    <span>Jak odblokować?</span>
                  </button>
                )}

                <button
                  onClick={onOpenSettings}
                  className="px-3 py-2 rounded-xl bg-[#232E35] hover:bg-[#2F3D46] border border-[#2A373F] text-gray-300 hover:text-white font-bold text-xs transition-colors"
                >
                  Ustawienia
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
            title="Przypomnij później"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
