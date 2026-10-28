import React from 'react';

interface MascotOwlProps {
  mood?: 'happy' | 'excited' | 'thinking' | 'sad' | 'surprised';
  size?: number;
  className?: string;
}

/** Codexa's original code-spark mascot: a geometric companion, not an animal character. */
export const MascotOwl: React.FC<MascotOwlProps> = ({
  mood = 'happy',
  size = 72,
  className = '',
}) => {
  const expression = mood === 'sad' ? 'M39 61 Q50 52 61 61' :
    mood === 'thinking' ? 'M39 59 Q50 64 61 57' :
    mood === 'surprised' ? 'M43 59 Q50 67 57 59' :
    'M39 57 Q50 68 61 57';

  return (
    <div className={`inline-flex items-center justify-center transition-transform hover:scale-105 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Maskotka Codexa">
        <defs>
          <linearGradient id="codexa-spark" x1="18" y1="12" x2="82" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#42E8D4" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <path d="M50 5 87 26v43L50 92 13 69V26L50 5Z" fill="#111827" stroke="url(#codexa-spark)" strokeWidth="4" strokeLinejoin="round" />
        <path d="M32 37 22 50l10 13M68 37l10 13-10 13" stroke="#42E8D4" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m56 33-12 34" stroke="#A78BFA" strokeWidth="5" strokeLinecap="round" />
        <circle cx="37" cy="47" r="3" fill="#F8FAFC" />
        <circle cx="63" cy="47" r="3" fill="#F8FAFC" />
        <path d={expression} stroke="#F8FAFC" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M50 5v-2M87 26l5-2M13 26l-5-2" stroke="#42E8D4" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
};
