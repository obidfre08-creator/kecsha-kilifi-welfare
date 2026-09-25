import React from 'react';

interface CrestProps {
  size?: number;
  logo?: string | null;
}

export const Crest: React.FC<CrestProps> = ({ size = 48, logo }) => {
  if (logo) {
    return (
      <img
        src={logo}
        alt="Association logo"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '12px',
          objectFit: 'contain',
          background: '#fff',
          padding: '3px',
          boxShadow: '0 4px 12px #00000066',
        }}
      />
    );
  }

  return (
    <span
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        filter: 'drop-shadow(0 4px 12px #00000066)',
      }}
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <circle cx="32" cy="32" r="31" fill="#E7A83A" />
        <circle cx="32" cy="32" r="27.5" fill="#062A1F" />
        <circle cx="45" cy="19" r="6.5" fill="#E7A83A" />
        <g stroke="#E7A83A" strokeLinecap="round" fill="none">
          <path d="M31 50 V33" strokeWidth="5" />
          <path d="M31 34 L21 24 M31 34 L27 20 M31 34 L35 20 M31 34 L41 24" strokeWidth="3" />
          <path d="M14 54 q4.5 -4 9 0 t9 0 t9 0 t9 0" strokeWidth="2.4" stroke="#7FD1C4" />
        </g>
      </svg>
    </span>
  );
};
