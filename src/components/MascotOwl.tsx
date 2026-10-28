import React from 'react';

interface MascotOwlProps {
  mood?: 'happy' | 'excited' | 'thinking' | 'sad' | 'surprised';
  size?: number;
  className?: string;
}

const moodAsset: Record<NonNullable<MascotOwlProps['mood']>, string> = {
  happy: 'duo-happy.svg',
  excited: 'duo-happy.svg',
  thinking: 'duo-worried.svg',
  sad: 'duo-sad.svg',
  surprised: 'duo-panicked.svg',
};

/** Cyberkot: Codexa's original neon cat mascot, used throughout lessons and feedback. */
export const MascotOwl: React.FC<MascotOwlProps> = ({
  mood = 'happy',
  size = 72,
  className = '',
}) => (
  <div
    className={`inline-flex items-center justify-center shrink-0 transition-transform hover:scale-105 ${className}`}
    style={{ width: size, height: size }}
  >
    <img
      src={`./pwa-icons/${moodAsset[mood]}`}
      alt={`Cyberkot Codexa — ${mood === 'sad' ? 'smutny' : mood === 'thinking' ? 'zastanawiający się' : mood === 'surprised' ? 'zaskoczony' : 'wesoły'}`}
      className="w-full h-full object-contain drop-shadow-lg pointer-events-none"
      draggable={false}
    />
  </div>
);
