import uiSharedPreset from '../../ui-shared/tailwind.preset.js';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [uiSharedPreset],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', '../../ui-shared/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
