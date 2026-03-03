export const designTokens = {
  color: {
    bg: 'var(--mf-color-bg)',
    bgSoft: 'var(--mf-color-bg-soft)',
    surface: 'var(--mf-color-surface)',
    surfaceSoft: 'var(--mf-color-surface-soft)',
    border: 'var(--mf-color-border)',
    borderStrong: 'var(--mf-color-border-strong)',
    text: 'var(--mf-color-text)',
    textMuted: 'var(--mf-color-text-muted)',
    primary: 'var(--mf-color-primary)',
    primaryStrong: 'var(--mf-color-primary-strong)',
    success: 'var(--mf-color-success)',
    warning: 'var(--mf-color-warning)',
    danger: 'var(--mf-color-danger)',
  },
  radius: {
    sm: 'var(--mf-radius-sm)',
    md: 'var(--mf-radius-md)',
    lg: 'var(--mf-radius-lg)',
    xl: 'var(--mf-radius-xl)',
  },
  shadow: {
    sm: 'var(--mf-shadow-sm)',
    md: 'var(--mf-shadow-md)',
    lg: 'var(--mf-shadow-lg)',
  },
  spacing: {
    1: 'var(--mf-space-1)',
    2: 'var(--mf-space-2)',
    3: 'var(--mf-space-3)',
    4: 'var(--mf-space-4)',
    5: 'var(--mf-space-5)',
    6: 'var(--mf-space-6)',
    7: 'var(--mf-space-7)',
    8: 'var(--mf-space-8)',
    9: 'var(--mf-space-9)',
    10: 'var(--mf-space-10)',
    11: 'var(--mf-space-11)',
    12: 'var(--mf-space-12)',
  },
  font: {
    sans: 'var(--mf-font-sans)',
    mono: 'var(--mf-font-mono)',
  },
} as const;

export type DesignTokens = typeof designTokens;
