import React, { useEffect } from 'react';
import { X, Heart, Gem, Zap, Sparkles } from 'lucide-react';
import { soundService } from '../services/soundService';

interface HeartRefillModalProps {
  currentHearts: number;
  maxHearts: number;
  currentGems: number;
  onClose: () => void;
  onRefillWithGems: () => void;
  onFreePractice: () => void;
}

export const HeartRefillModal: React.FC<HeartRefillModalProps> = ({
  currentHearts,
  maxHearts,
  currentGems,
  onClose,
  onRefillWithGems,
  onFreePractice,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 safe-area-pad select-none">
      <div className="bg-[#172127] border-2 border-[#2A373F] rounded-2xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 text-center shadow-2xl space-y-4 my-auto">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <div className="w-16 h-16 rounded-3xl bg-red-500/20 border-2 border-red-500 mx-auto flex items-center justify-center">
          <Heart size={36} className="text-duo-red fill-duo-red animate-pulse" />
        </div>

        <h3 className="text-xl font-black text-white">
          Serca i Życia ({currentHearts}/{maxHearts})
        </h3>
        <p className="text-xs text-gray-300">
          Serca chronią Cię przed błędami podczas lekcji. Gdy skończą Ci się serca, możesz je odnowić lub poćwiczyć!
        </p>

        <div className="space-y-2.5 pt-2">
          {/* Refill with gems */}
          <button
            disabled={currentGems < 50 || currentHearts >= maxHearts}
            onClick={() => {
              soundService.playLevelUp();
              onRefillWithGems();
            }}
            className="w-full py-3.5 rounded-2xl bg-duo-blue hover:bg-duo-blueDark text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Gem size={15} className="fill-white" />
            <span>Odnów wszystkie serca (50 diamentów)</span>
          </button>

          {/* Free practice */}
          <button
            onClick={() => {
              soundService.playClick();
              onFreePractice();
            }}
            className="w-full py-3.5 rounded-2xl bg-[#232E35] hover:bg-[#2C3B44] text-gray-200 border border-[#2A373F] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Zap size={15} className="text-yellow-400 fill-yellow-400" />
            <span>Darmowy trening (+1 serce)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
