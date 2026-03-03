import React from 'react';

type IconStrokeProps = {
  stroke?: string;
};

type ThemeIconProps = IconStrokeProps & {
  isDark?: boolean;
};

export const LanguageIconBase = ({ stroke = 'currentColor' }: IconStrokeProps) => (
  <svg viewBox="0 0 32 32" width="20" height="20" fill="none" stroke={stroke} strokeWidth="2">
    <circle cx="16" cy="16" r="12" />
    <line x1="4" y1="16" x2="28" y2="16" />
    <path d="M16 4 C 20 4, 22 10, 22 16 C 22 22, 20 28, 16 28 C 12 28, 10 22, 10 16 C 10 10, 12 4, 16 4" />
  </svg>
);

export const ThemeIconBase = ({ stroke = 'currentColor', isDark = true }: ThemeIconProps) =>
  isDark ? (
    <svg viewBox="0 0 32 32" width="20" height="20" fill="none" stroke={stroke} strokeWidth="2">
      <path d="M26 18 A 10 10 0 1 1 14 6 A 10 10 0 0 0 26 18 Z" fill="none" />
    </svg>
  ) : (
    <svg viewBox="0 0 32 32" width="20" height="20" fill="none" stroke={stroke} strokeWidth="2">
      <circle cx="16" cy="16" r="7" />
      <line x1="16" y1="2" x2="16" y2="5" />
      <line x1="16" y1="27" x2="16" y2="30" />
      <line x1="2" y1="16" x2="5" y2="16" />
      <line x1="27" y1="16" x2="30" y2="16" />
      <line x1="6.1" y1="6.1" x2="8.2" y2="8.2" />
      <line x1="23.8" y1="23.8" x2="25.9" y2="25.9" />
      <line x1="6.1" y1="25.9" x2="8.2" y2="23.8" />
      <line x1="23.8" y1="8.2" x2="25.9" y2="6.1" />
    </svg>
  );
