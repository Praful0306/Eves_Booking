import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        seat: {
          available: '#22c55e',
          locked: '#eab308',
          booked: '#ef4444',
          mine: '#3b82f6',
        },
      },
    },
  },
  plugins: [],
};

export default config;
