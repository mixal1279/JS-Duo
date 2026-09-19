import React, { useEffect, useState } from 'react';
import { Flame, X, Trophy, ArrowRight, Sparkles } from 'lucide-react';

interface StreakToastProps {
  streak: number;
  onClose: () => void;
  onOpenProfile?: () => void;
  autoCloseDuration?: number; // ms, default 6000
}

export const StreakToast: React.FC<StreakToastProps> = ({
  streak,
  onClose,
  onOpenProfile,
  autoCloseDuration = 6000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Smooth entry
    const entryTimer = setTimeout(() => setIsVisible(true), 50);

    // Progress bar animation step
    const intervalTime = 50;
    const step = (intervalTime / autoCloseDuration) * 100;
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(progressInterval);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, autoCloseDuration);

    return () => {
      clearTimeout(entryTimer);
      clearTimeout(dismissTimer);
      clearInterval(progressInterval);
    };
  }, [autoCloseDuration]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // allow exit transition
  };

  const getStreakMessage = () => {
    if (streak >= 100) return 'Niewiarygodne! Masz odznakę 100 dni passy!';
    if (streak >= 30) return 'Ponad miesiąc regularnej nauki! Nie gaś płomienia!';
    if (streak >= 7) return 'Cały tydzień żelaznej dyscypliny!';
    if (streak > 1) return 'Świetna robota! Jedna lekcja dzisiaj utrzyma tempo.';
    if (streak === 1) return 'Pierwszy dzień zaliczony! Dziś walczysz o 2. dzień.';
    return 'Rozwiąż lekcję dzisiaj, aby odpalić płomień passy!';
  };

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-50 transition-all duration-300 transform ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
      } max-w-sm w-[92vw] sm:w-80`}
    >
      <div className="relative bg-gradient-to-r from-[#202E38] via-[#1A262E] to-[#162127] border-2 border-[#FF9600]/60 rounded-3xl p-4 shadow-[0_10px_30px_rgba(255,150,0,0.25)] backdrop-blur-md overflow-hidden">
        {/* Glow effect behind flame */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-[#FF9600]/20 rounded-full blur-2xl -ml-6 -mt-6 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-xl bg-[#141F25]/80 hover:bg-[#253642] transition-colors border border-[#2D3E4A]"
          aria-label="Zamknij powiadomienie o passie"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-3.5 relative z-10">
          {/* Flame Icon Container with animation */}
          <div className="relative shrink-0">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-b from-[#FF9600]/30 to-[#FF4B4B]/20 border-2 border-[#FF9600] flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(255,150,0,0.4)]">
              <span className="animate-bounce-subtle">🔥</span>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#131F24] rounded-full px-1.5 py-0.2 border border-[#FF9600] text-[10px] font-black text-[#FF9600]">
              {streak}d
            </div>
          </div>

          {/* Toast Text */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#FF9600]">
                Passa Dni
              </span>
              <Sparkles size={12} className="text-duo-yellow fill-duo-yellow animate-pulse" />
            </div>

            <h4 className="text-base font-black text-white leading-tight">
              {streak} {streak === 1 ? 'dzień' : 'dni'} passy!
            </h4>

            <p className="text-[11px] text-gray-300 font-medium mt-0.5 leading-snug line-clamp-2">
              {getStreakMessage()}
            </p>
          </div>
        </div>

        {/* Action Link to Profile / Achievements */}
        {onOpenProfile && (
          <div className="mt-3 pt-2.5 border-t border-[#2A3B46] flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-gray-400">
              Cel: <strong className="text-duo-yellow">100 dni</strong>
            </span>
            <button
              onClick={() => {
                handleDismiss();
                onOpenProfile();
              }}
              className="font-black text-xs text-duo-yellow hover:text-yellow-300 flex items-center gap-1 transition-colors group cursor-pointer"
            >
              <span>Zobacz odznakę</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Bottom countdown progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#121B20]">
          <div
            className="h-full bg-gradient-to-r from-[#FF9600] to-duo-yellow transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
