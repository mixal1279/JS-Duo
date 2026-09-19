import React, { useState, useEffect } from 'react';
import { X, Bell, Clock, Sparkles, Check, AlertCircle, Send } from 'lucide-react';
import { NotificationConfig } from '../types';
import { notificationService } from '../services/notificationService';
import { soundService } from '../services/soundService';

interface NotificationSettingsModalProps {
  config: NotificationConfig;
  streak: number;
  onClose: () => void;
  onSave: (config: NotificationConfig) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  config,
  streak,
  onClose,
  onSave,
}) => {
  const [enabled, setEnabled] = useState(config.enabled);
  const [time, setTime] = useState(config.time || '18:00');
  const [tone, setTone] = useState<NotificationConfig['tone']>(config.tone || 'friendly');
  const [permissionGranted, setPermissionGranted] = useState(notificationService.checkPermission());
  const [testSent, setTestSent] = useState(false);
  const [simulating24h, setSimulating24h] = useState(false);
  const [hoursInactive, setHoursInactive] = useState(() => Math.round(notificationService.getHoursSinceLastLogin() * 10) / 10);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleRequestPermission = async () => {
    soundService.playClick();
    const granted = await notificationService.requestPermission();
    setPermissionGranted(granted);
    if (granted) {
      setEnabled(true);
    }
  };

  const handleTestNotification = () => {
    soundService.playCorrect();
    const msg = notificationService.getMotivationalMessage(tone, streak);
    notificationService.triggerNotification(msg.title, msg.body);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSimulate24hInactivity = async () => {
    soundService.playCorrect();
    setSimulating24h(true);
    await notificationService.simulate24HourInactivity(streak, tone);
    setHoursInactive(25);
    setTimeout(() => setSimulating24h(false), 3500);
  };

  const handleSave = () => {
    soundService.playClick();
    onSave({
      enabled,
      time,
      tone,
      hasBrowserPermission: permissionGranted,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto safe-area-pad select-none">
      <div className="bg-[#172127] border-2 border-[#2A373F] rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[92dvh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A373F] pb-3 sm:pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-duo-blue/20 text-duo-blue border border-duo-blue/40">
              <Bell size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Przypomnienia o Nauce
              </h3>
              <p className="text-xs text-gray-400">Powiadomienia push w stylu Duolingo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Permission Status */}
        <div className="p-3 rounded-2xl bg-[#1C262C] border border-[#2A373F] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {permissionGranted ? (
              <Check size={18} className="text-duo-green" />
            ) : (
              <AlertCircle size={18} className="text-yellow-400" />
            )}
            <span className="text-xs font-bold text-gray-200">
              {permissionGranted
                ? 'Powiadomienia przeglądarki aktywne'
                : 'Wymagana zgoda na powiadomienia'}
            </span>
          </div>

          {!permissionGranted && (
            <button
              onClick={handleRequestPermission}
              className="px-3 py-1.5 rounded-xl bg-duo-blue hover:bg-duo-blueDark text-white text-xs font-black uppercase tracking-wider"
            >
              Włącz
            </button>
          )}
        </div>

        {/* Toggle Enabled */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-sm text-white">Codzienne przypomnienie</h4>
            <p className="text-xs text-gray-400">Powiadom o zagrożonym streaku</p>
          </div>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 accent-duo-green rounded cursor-pointer"
          />
        </div>

        {/* Time Selector */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">
            Godzina przypomnienia
          </label>
          <div className="flex items-center gap-2 bg-[#1C262C] border border-[#2A373F] p-2.5 rounded-2xl">
            <Clock size={16} className="text-duo-blue" />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-transparent text-white text-sm font-bold focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Motivational Tone */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">
            Styl motywacji Sowy
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'friendly' as const, label: 'Przyjazny', emoji: '🦉' },
              { id: 'coder' as const, label: 'Programistyczny', emoji: '💻' },
              { id: 'strict' as const, label: 'Bezwzględny', emoji: '⚠️' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className={`py-2 px-1 rounded-2xl border text-center transition-all ${
                  tone === t.id
                    ? 'bg-duo-green/20 border-duo-green text-duo-green font-black'
                    : 'bg-[#1C262C] border-[#2A373F] text-gray-400'
                }`}
              >
                <div className="text-base">{t.emoji}</div>
                <div className="text-[11px] mt-0.5">{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 24h Inactivity Push System Card */}
        <div className="p-3.5 rounded-2xl bg-[#1C262C] border border-[#2A373F] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Przypomnienie po 24h braku aktywności
              </h4>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-duo-green/20 text-duo-green border border-duo-green/40">
              Aktywne
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Automatyczny Push w przeglądarce, gdy nie zalogujesz się przez 24 godziny, aby uchronić Twój streak {streak} dni.
          </p>
          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-[#26353E]">
            <span>Czas od ostatniej sesji:</span>
            <span className="font-bold text-white">{hoursInactive} godz.</span>
          </div>
          <button
            type="button"
            onClick={handleSimulate24hInactivity}
            disabled={simulating24h}
            className="w-full mt-1.5 py-2 px-3 rounded-xl bg-duo-blue/20 hover:bg-duo-blue/30 text-duo-blue border border-duo-blue/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles size={14} className="animate-spin-slow" />
            <span>
              {simulating24h
                ? 'Wysyłanie Push po 24h nieobecności... 🚀'
                : 'Przetestuj powiadomienie Push (Symulacja 24h)'}
            </span>
          </button>
        </div>

        {/* Test Notification Trigger */}
        <div className="pt-2">
          <button
            onClick={handleTestNotification}
            className="w-full py-2.5 rounded-2xl bg-[#232E35] hover:bg-[#2C3B44] text-gray-200 border border-[#2A373F] text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
          >
            <Send size={14} className="text-duo-yellow" />
            <span>{testSent ? 'Wysłano powiadomienie testowe! 🎉' : 'Wyślij testowe powiadomienie teraz'}</span>
          </button>
        </div>

        {/* Save & Close */}
        <div className="pt-2 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-2xl bg-duo-green hover:bg-duo-greenDark text-black font-black text-xs uppercase tracking-wider shadow-[0_3px_0_#46a302] active:translate-y-0.5"
          >
            Zapisz ustawienia
          </button>
        </div>
      </div>
    </div>
  );
};
