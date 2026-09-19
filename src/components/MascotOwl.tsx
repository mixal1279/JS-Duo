import React from 'react';

interface MascotOwlProps {
  mood?: 'happy' | 'excited' | 'thinking' | 'sad' | 'surprised';
  size?: number;
  className?: string;
}

export const MascotOwl: React.FC<MascotOwlProps> = ({
  mood = 'happy',
  size = 72,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center transition-transform hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Body */}
        <circle cx="50" cy="50" r="44" fill="#58CC02" />
        <path
          d="M20 54C20 68 34 82 50 82C66 82 80 68 80 54"
          fill="#46A302"
        />

        {/* Belly */}
        <ellipse cx="50" cy="62" rx="26" ry="20" fill="#8CE834" />

        {/* Glasses frames (nerdy coder owl) */}
        <circle cx="34" cy="42" r="17" stroke="#131F24" strokeWidth="4" fill="#FFFFFF" />
        <circle cx="66" cy="42" r="17" stroke="#131F24" strokeWidth="4" fill="#FFFFFF" />
        <line x1="47" y1="42" x2="53" y2="42" stroke="#131F24" strokeWidth="4" />

        {/* Eyes based on mood */}
        {mood === 'happy' && (
          <>
            <circle cx="36" cy="42" r="7" fill="#131F24" />
            <circle cx="64" cy="42" r="7" fill="#131F24" />
            <circle cx="38" cy="40" r="2.5" fill="#FFFFFF" />
            <circle cx="66" cy="40" r="2.5" fill="#FFFFFF" />
          </>
        )}

        {mood === 'excited' && (
          <>
            <circle cx="36" cy="42" r="9" fill="#1CB0F6" />
            <circle cx="64" cy="42" r="9" fill="#1CB0F6" />
            <circle cx="36" cy="42" r="5" fill="#131F24" />
            <circle cx="64" cy="42" r="5" fill="#131F24" />
            <circle cx="39" cy="39" r="3" fill="#FFFFFF" />
            <circle cx="67" cy="39" r="3" fill="#FFFFFF" />
          </>
        )}

        {mood === 'thinking' && (
          <>
            <circle cx="38" cy="38" r="6" fill="#131F24" />
            <circle cx="66" cy="38" r="6" fill="#131F24" />
            <circle cx="40" cy="36" r="2" fill="#FFFFFF" />
            <circle cx="68" cy="36" r="2" fill="#FFFFFF" />
          </>
        )}

        {mood === 'sad' && (
          <>
            <ellipse cx="36" cy="44" rx="6" ry="4" fill="#131F24" />
            <ellipse cx="64" cy="44" rx="6" ry="4" fill="#131F24" />
            <path d="M 28 32 Q 36 36 42 34" stroke="#131F24" strokeWidth="3" strokeLinecap="round" />
            <path d="M 72 32 Q 64 36 58 34" stroke="#131F24" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {mood === 'surprised' && (
          <>
            <circle cx="34" cy="42" r="10" fill="#131F24" />
            <circle cx="66" cy="42" r="10" fill="#131F24" />
            <circle cx="37" cy="39" r="3.5" fill="#FFFFFF" />
            <circle cx="69" cy="39" r="3.5" fill="#FFFFFF" />
          </>
        )}

        {/* Beak */}
        <polygon points="50,48 42,60 58,60" fill="#FF9600" stroke="#E58500" strokeWidth="1.5" />

        {/* Mini JS Badge on forehead / cap */}
        <rect x="70" y="12" width="22" height="20" rx="4" fill="#F7DF1E" stroke="#131F24" strokeWidth="2" />
        <text
          x="73"
          y="27"
          fontFamily="monospace"
          fontWeight="900"
          fontSize="11"
          fill="#000000"
        >
          JS
        </text>

        {/* Cheeks */}
        <ellipse cx="23" cy="55" rx="5" ry="3" fill="#FF4B4B" opacity="0.6" />
        <ellipse cx="77" cy="55" rx="5" ry="3" fill="#FF4B4B" opacity="0.6" />
      </svg>
    </div>
  );
};
