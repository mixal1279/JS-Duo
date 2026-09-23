import React from 'react';

interface CyberCatLogoProps {
  size?: number;
  className?: string;
}

export const CyberCatLogo: React.FC<CyberCatLogoProps> = ({
  size = 40,
  className = '',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl overflow-hidden shadow-lg border border-purple-500/40 select-none ${className}`}
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 50% 40%, #1E163B 0%, #0E1126 55%, #05060E 100%)',
      }}
    >
      <img
        src="/favicon.svg"
        alt="JS Duo Cyber Icon"
        className="w-full h-full object-cover transform scale-110 pointer-events-none drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
      />
    </div>
  );
};
