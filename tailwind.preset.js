const palette = (name) => ({
  50: `var(--mf-color-${name}-50)`,
  100: `var(--mf-color-${name}-100)`,
  200: `var(--mf-color-${name}-200)`,
  300: `var(--mf-color-${name}-300)`,
  400: `var(--mf-color-${name}-400)`,
  500: `var(--mf-color-${name}-500)`,
  600: `var(--mf-color-${name}-600)`,
  700: `var(--mf-color-${name}-700)`,
  800: `var(--mf-color-${name}-800)`,
  900: `var(--mf-color-${name}-900)`,
});

export default {
  theme: {
    extend: {
      colors: {
        'mf-bg': 'var(--mf-color-bg)',
        'mf-bg-soft': 'var(--mf-color-bg-soft)',
        'mf-surface': 'var(--mf-color-surface)',
        'mf-surface-soft': 'var(--mf-color-surface-soft)',
        'mf-border': 'var(--mf-color-border)',
        'mf-border-strong': 'var(--mf-color-border-strong)',
        'mf-text': 'var(--mf-color-text)',
        'mf-muted': 'var(--mf-color-text-muted)',
        'mf-primary': 'var(--mf-color-primary)',
        'mf-primary-strong': 'var(--mf-color-primary-strong)',
        'mf-success': 'var(--mf-color-success)',
        'mf-warning': 'var(--mf-color-warning)',
        'mf-danger': 'var(--mf-color-danger)',
        slate: palette('slate'),
        sky: palette('sky'),
        red: palette('red'),
        amber: palette('amber'),
        emerald: palette('emerald'),
        rose: palette('rose'),
      },
      borderRadius: {
        sm: 'var(--mf-radius-sm)',
        md: 'var(--mf-radius-md)',
        lg: 'var(--mf-radius-lg)',
        xl: 'var(--mf-radius-xl)',
      },
      boxShadow: {
        sm: 'var(--mf-shadow-sm)',
        md: 'var(--mf-shadow-md)',
        lg: 'var(--mf-shadow-lg)',
      },
      spacing: {
        18: '72px',
      },
      fontFamily: {
        sans: ['var(--mf-font-sans)'],
        mono: ['var(--mf-font-mono)'],
      },
      maxWidth: {
        content: '1280px',
      },
    },
  },
};
