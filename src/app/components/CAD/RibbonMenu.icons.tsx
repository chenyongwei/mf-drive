import React from "react";
import { LanguageIconBase, ThemeIconBase } from './components/AppearanceIcons';

export const DimensionIcon = ({ stroke = "#333" }) => (
  <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke={stroke} strokeWidth="1.5">
    <rect x="6" y="6" width="20" height="20" strokeDasharray="3,2" />
    <line x1="4" y1="8" x2="4" y2="24" />
    <line x1="2" y1="8" x2="6" y2="8" />
    <line x1="2" y1="24" x2="6" y2="24" />
    <path d="M10 16 L16 10 L22 16" strokeLinejoin="round" />
  </svg>
);

export const OptimizeIcon = ({ stroke = "#333" }) => (
  <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke={stroke} strokeWidth="1.5">
    <rect x="6" y="6" width="20" height="20" rx="2" stroke="#FFC107" fill="rgba(255, 193, 7, 0.2)" />
    <path d="M10 10 L14 10 L12 8 M10 10 L10 14 L8 12" stroke="#1E88E5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 10 L18 10 L20 8 M22 10 L22 14 L24 12" stroke="#1E88E5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 22 L18 22 L20 24 M22 22 L22 18 L24 20" stroke="#1E88E5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 22 L14 22 L12 24 M10 22 L10 18 L8 20" stroke="#1E88E5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TransformIcon = ({ stroke = "#333" }) => (
  <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke={stroke} strokeWidth="1.5">
    <rect x="4" y="4" width="14" height="14" />
    <rect x="14" y="14" width="14" height="14" strokeDasharray="3,2" />
    <path d="M22 8 L26 12 L22 16" strokeLinejoin="round" fill="none" />
    <line x1="18" y1="12" x2="26" y2="12" />
  </svg>
);

export const SelectIcon = ({ stroke = "#333" }) => (
  <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke={stroke} strokeWidth="1.5">
    <path d="M7 7 L17 17 M7 17 L17 7" stroke="none" />
    <path d="M12 4 L20 20 L16 20 L14 28 L10 26 L12 18 L4 16 L12 4 Z" fill="#FFC107" stroke={stroke} strokeLinejoin="round" />
    <rect x="20" y="20" width="8" height="8" strokeDasharray="2,2" />
  </svg>
);

export const LanguageIcon = ({ stroke = "#333" }) => <LanguageIconBase stroke={stroke} />;

export const ThemeIcon = ({
  stroke = "#333",
  isDark = true,
}: {
  stroke?: string;
  isDark?: boolean;
}) => <ThemeIconBase stroke={stroke} isDark={isDark} />;
