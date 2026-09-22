import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  Clock,
  Sparkles,
  Check,
  AlertCircle,
  Send,
  Heart,
  Flame,
  HelpCircle,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { NotificationConfig } from '../types';
import { notificationService, NotificationHistoryItem } from '../services/notificationService';
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
  const [notifyOnHeartsFull, setNotifyOnHeartsFull] = useState(config.notifyOnHeartsFull ?? true);
  const [notifyOnStreakFreeze, setNotifyOnStreakFreeze] = useState(config.notifyOnStreakFreeze ?? true);

  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'default' | 'unsupported'>(() =>
    notificationService.getPermissionState()
  );
  const [permissionGranted, setPermissionGranted] = useState(() => notificationService.checkPermission());

  const [testingDaily, setTestingDaily] = useState(false);
  const [testingInactivity, setTestingInactivity] = useState(false);
  const [testingHearts, setTestingHearts] = useState(false);
  const [showHelpUnblock, setShowHelpUnblock] = useState(false);
  const [history, setHistory] = useState<NotificationHistoryItem[]>(() =>
    notificationService.getNotificationHistory()
  );

  const nextReminder = notificationService.getNextReminderTime(time);
  const hoursInactive = Math.round(notificationService.getHoursSinceLastLogin() * 10) / 10;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const refreshHistory = () => {
    setHistory(notificationService.getNotificationHistory());
  };

  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleRequestPermission = async () => {
    soundService.playClick();
    const granted = await notificationService.requestPermission();
    const newState = notificationService.getPermissionState();
    setPermissionState(newState);
    setPermissionGranted(granted);
    if (granted) {
      setEnabled(true);
      refreshHistory();
    } else if (newState === 'denied' || isInsideIframe) {
      setShowHelpUnblock(true);
    }
  };

  const handleTestDailyReminder = async () => {
    soundService.playClick();
    setTestingDaily(true);
    await notificationService.simulateDailyReminder(streak, time, tone);
    refreshHistory();
    setTimeout(() => setTestingDaily(false), 2500);
  };

  const handleSimulate24hInactivity = async () => {
    soundService.playClick();
    setTestingInactivity(true);
    await notificationService.simulate24HourInactivity(streak, tone);
    refreshHistory();
    setTimeout(() => setTestingInactivity(false), 2500);
  };

  const handleTestHeartsRestored = async () => {
    soundService.playClick();
    setTestingHearts(true);
    await notificationService.simulateHeartsRestored();
    refreshHistory();
    setTimeout(() => setTestingHearts(false), 2500);
  };

  const handleClearHistory = () => {
    soundService.playClick();
    notificationService.clearNotificationHistory();
    setHistory([]);
  };

  const handleSave = () => {
    soundService.playClick();
    if (enabled) {
      notificationService.scheduleNativeBackgroundAlarms(time, streak, tone);
    }
    onSave({
      enabled,
      time,
      tone,
      hasBrowserPermission: permissionGranted,
      notifyOnHeartsFull,
      notifyOnStreakFreeze,
    });
    onClose();
  };

  const previewMessage = notificationService.getDailyReminderMessage(streak, tone);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto safe-area-pad select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#172127] border-2 border-[#2A373F] rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92dvh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A373F] pb-3 sm:pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-duo-blue/20 text-duo-blue border border-duo-blue/40 shadow-inner">
              <Bell size={22} className="animate-pulse-subtle" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Powiadomienia Push</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-duo-green/20 text-duo-green border border-duo-green/40">
                  Systemowe Push & App
                </span>
              </h3>
              <p className="text-xs text-gray-400">Powiadomienia na pulpicie i telefonie nad innymi aplikacjami</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Browser / App Permission Status Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1C262C] border border-[#2A373F] space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {permissionGranted ? (
                <div className="w-8 h-8 rounded-xl bg-duo-green/20 border border-duo-green/40 flex items-center justify-center text-duo-green shrink-0">
                  <CheckCircle2 size={18} />
                </div>
              ) : permissionState === 'denied' ? (
                <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                  <AlertCircle size={18} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-duo-blue/20 border border-duo-blue/40 flex items-center justify-center text-duo-blue shrink-0">
                  <Bell size={18} />
                </div>
              )}
              <div>
                <span className="text-xs sm:text-sm font-black text-white block">
                  {permissionGranted
                    ? 'Powiadomienia systemowe są włączone'
                    : permissionState === 'denied'
                    ? 'Powiadomienia systemowe są zablokowane'
                    : 'Wymagana zgoda na alerty systemowe'}
                </span>
                <span className="text-[11px] text-gray-400">
                  {permissionGranted
                    ? 'Dostaniesz powiadomienie na ekranie nawet gdy używasz innych aplikacji.'
                    : permissionState === 'denied'
                    ? 'Zezwól na powiadomienia w ustawieniach systemu/aplikacji.'
                    : 'Zezwól, aby otrzymywać powiadomienia nad innymi aplikacjami.'}
                </span>
              </div>
            </div>

            {!permissionGranted && permissionState !== 'denied' && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleRequestPermission}
                  className="px-3.5 py-2 rounded-xl bg-duo-blue hover:bg-duo-blueDark text-white text-xs font-black uppercase tracking-wider shadow-[0_3px_0_#1899d6] active:translate-y-0.5 cursor-pointer"
                >
                  Zezwól
                </button>
              </div>
            )}

            {(permissionState === 'denied' || isInsideIframe) && (
              <button
                onClick={() => setShowHelpUnblock(!showHelpUnblock)}
                className="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 text-xs font-bold shrink-0 cursor-pointer"
              >
                {showHelpUnblock ? 'Ukryj pomoc' : 'Instrukcja'}
              </button>
            )}
          </div>

          {/* Unblock / Direct URL guide if in iframe or denied */}
          {showHelpUnblock && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-xs text-amber-200 bg-amber-950/40 border border-amber-500/30 rounded-xl p-3.5 space-y-2.5"
            >
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <HelpCircle size={15} />
                <span>Dlaczego przeglądarka może blokować powiadomienia?</span>
              </div>

              {isInsideIframe && (
                <div className="bg-[#1A262D] p-2.5 rounded-lg border border-amber-500/40 space-y-1.5">
                  <p className="text-gray-200 text-[11px] leading-relaxed">
                    <b>Przeglądarki (Chrome, Safari, Firefox, Edge)</b> ze względów bezpieczeństwa blokują wyświetlanie systemowego okna zgody na powiadomienia wewnątrz ramki (iframe) edytora.
                  </p>
                  <p className="text-gray-300 text-[11px]">
                    Otwórz aplikację bezpośrednio w nowej karcie przeglądarki, aby nadać uprawnienie:
                  </p>
                  <a
                    href={typeof window !== 'undefined' ? window.location.href : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-duo-green hover:bg-duo-greenDark text-black font-extrabold text-xs shadow transition-colors"
                  >
                    <span>Otwórz w nowej karcie</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}

              <div className="space-y-1 text-gray-300 text-[11px]">
                <p className="font-bold text-gray-200">Jeśli powiadomienia są zablokowane w przeglądarce:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Kliknij ikonę kłódki 🔒 lub suwaków (Ustawienia witryny) obok adresu URL w pasku przeglądarki.</li>
                  <li>Znajdź sekcję <b>Powiadomienia (Notifications)</b> i zmień na <b>Zezwalaj (Allow)</b>.</li>
                  <li>Upewnij się, że w systemie operacyjnym (Windows / macOS / Android) Twoja przeglądarka nie ma wyłączonych powiadomień w ustawieniach systemowych (np. Tryb skupienia / Nie przeszkadzać).</li>
                </ol>
              </div>
            </motion.div>
          )}
        </div>

        {/* Daily Schedule Configuration */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1C262C] border border-[#2A373F] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-duo-blue" />
              <div>
                <h4 className="font-extrabold text-sm text-white">Codzienne przypomnienie</h4>
                <p className="text-xs text-gray-400">Regularna motywacja do powtórki materiału</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-duo-green"></div>
            </label>
          </div>

          {enabled && (
            <div className="space-y-2 pt-1 border-t border-[#26353E]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-gray-300">Godzina przypomnienia:</span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-[#172127] border border-[#2A373F] text-white text-sm font-extrabold px-3 py-1.5 rounded-xl focus:outline-none focus:border-duo-blue"
                />
              </div>

              {/* Dynamic Next Reminder badge */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 bg-[#172127] px-3 py-1.5 rounded-xl border border-[#24323B]">
                <span>Najbliższe powiadomienie:</span>
                <span className="font-extrabold text-duo-blue">{nextReminder.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tone Selector & Live Preview */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1C262C] border border-[#2A373F] space-y-3">
          <label className="block text-xs font-black uppercase tracking-wider text-gray-400">
            Styl powiadomień Sowy Duo
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'friendly' as const, label: 'Przyjazny', emoji: '🦉', desc: 'Ciepła i miła motywacja' },
              { id: 'coder' as const, label: 'Programista', emoji: '💻', desc: 'Klimat JS i konsoli' },
              { id: 'strict' as const, label: 'Bezwzględny', emoji: '⚠️', desc: 'Niebezpieczeństwo utraty' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className={`py-2 px-1.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  tone === t.id
                    ? 'bg-duo-green/20 border-duo-green text-duo-green font-black shadow-[0_2px_0_#46a302]'
                    : 'bg-[#172127] border-[#2A373F] text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="text-xl">{t.emoji}</div>
                <div className="text-xs mt-0.5">{t.label}</div>
              </button>
            ))}
          </div>

          {/* Interactive Live Message Preview */}
          <div className="bg-[#172127] border border-[#2A373F] rounded-xl p-2.5 space-y-1">
            <span className="text-[10px] uppercase font-black text-gray-400 block tracking-wider">
              Podgląd treści powiadomienia:
            </span>
            <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <span>{previewMessage.title}</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-snug">{previewMessage.body}</p>
          </div>
        </div>

        {/* Advanced Notification Toggles */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1C262C] border border-[#2A373F] space-y-2.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
            Automatyczne alerty specjalne
          </h4>

          {/* 24h absence */}
          <div className="flex items-center justify-between py-1 border-b border-[#26353E]">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-[#FF9600]" />
              <div>
                <span className="text-xs font-bold text-white block">Ochrona passy po 24h braku sesji</span>
                <span className="text-[10px] text-gray-400">Ostatnia sesja: {hoursInactive}h temu</span>
              </div>
            </div>
            <span className="text-[10px] font-black text-duo-green px-2 py-0.5 rounded bg-duo-green/20 border border-duo-green/40">
              Aktywne
            </span>
          </div>

          {/* Full hearts */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-duo-red fill-duo-red" />
              <div>
                <span className="text-xs font-bold text-white block">Powiadomienie o pełnych sercach (5/5)</span>
                <span className="text-[10px] text-gray-400">Informuje, gdy energia całkowicie się odnowi</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifyOnHeartsFull}
              onChange={(e) => setNotifyOnHeartsFull(e.target.checked)}
              className="w-4 h-4 accent-duo-green rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Push Testing Center */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1C262C] border border-[#2A373F] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-duo-yellow" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Centrum testowania Push
              </h4>
            </div>
            <span className="text-[10px] text-gray-400">Sprawdź natychmiast</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleTestDailyReminder}
              disabled={testingDaily}
              className="py-2.5 px-2 rounded-xl bg-[#232E35] hover:bg-[#2C3B44] text-gray-200 border border-[#2A373F] text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Send size={14} className="text-duo-blue" />
              <span>{testingDaily ? 'Wysyłanie...' : 'Test: Codzienne'}</span>
            </button>

            <button
              type="button"
              onClick={handleSimulate24hInactivity}
              disabled={testingInactivity}
              className="py-2.5 px-2 rounded-xl bg-[#232E35] hover:bg-[#2C3B44] text-gray-200 border border-[#2A373F] text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Flame size={14} className="text-[#FF9600]" />
              <span>{testingInactivity ? 'Wysyłanie...' : 'Test: Passa 24h'}</span>
            </button>

            <button
              type="button"
              onClick={handleTestHeartsRestored}
              disabled={testingHearts}
              className="py-2.5 px-2 rounded-xl bg-[#232E35] hover:bg-[#2C3B44] text-gray-200 border border-[#2A373F] text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Heart size={14} className="text-duo-red fill-duo-red" />
              <span>{testingHearts ? 'Wysyłanie...' : 'Test: Serca 5/5'}</span>
            </button>
          </div>
        </div>

        {/* History of Sent Notifications */}
        {history.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-[#1C262C] border border-[#2A373F] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-gray-300 uppercase tracking-wider text-[11px]">
                Ostatnie powiadomienia ({history.length})
              </span>
              <button
                onClick={handleClearHistory}
                className="text-gray-400 hover:text-red-400 flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                title="Wyczyść historię"
              >
                <Trash2 size={12} />
                <span>Wyczyść</span>
              </button>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-xl bg-[#172127] border border-[#24323B] flex items-start justify-between gap-2 text-[11px]"
                >
                  <div className="min-w-0">
                    <span className="font-extrabold text-white block truncate">{item.title}</span>
                    <span className="text-gray-400 block truncate">{item.body}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 shrink-0">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save & Apply Button */}
        <div className="pt-2 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-2xl bg-duo-green hover:bg-duo-greenDark text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_3px_0_#46a302] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} />
            <span>Zapisz ustawienia powiadomień</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
