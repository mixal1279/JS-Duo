import React from 'react';

interface CyberCatLogoProps {
  size?: number;
  className?: string;
}

/** Shared Codexa brand mark used by the web, PWA and app navigation. */
export const CyberCatLogo: React.FC<CyberCatLogoProps> = ({
  size = 40,
  className = '',
}) => (
  <div
    className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl overflow-hidden border border-cyan-300/25 select-none shadow-[0_8px_24px_rgba(66,232,212,0.12)] ${className}`}
    style={{ width: size, height: size, background: 'linear-gradient(145deg, #151B2A, #090D18)' }}
  >
    <img src="/favicon.svg" alt="Codexa" className="w-full h-full object-cover pointer-events-none" />
  </div>
);
