import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          foreground: 'hsl(var(--success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
          foreground: 'hsl(var(--warning-foreground) / <alpha-value>)',
        },
        cobalt: {
          DEFAULT: 'hsl(var(--cobalt) / <alpha-value>)',
          foreground: 'hsl(var(--cobalt-foreground) / <alpha-value>)',
        },
        vermillion: {
          DEFAULT: 'hsl(var(--vermillion) / <alpha-value>)',
          foreground: 'hsl(var(--vermillion-foreground) / <alpha-value>)',
        },
        emerald: {
          DEFAULT: 'hsl(var(--emerald) / <alpha-value>)',
          foreground: 'hsl(var(--emerald-foreground) / <alpha-value>)',
        },
        amber: {
          DEFAULT: 'hsl(var(--amber) / <alpha-value>)',
          foreground: 'hsl(var(--amber-foreground) / <alpha-value>)',
        },
        violet: {
          DEFAULT: 'hsl(var(--violet) / <alpha-value>)',
          foreground: 'hsl(var(--violet-foreground) / <alpha-value>)',
        },
        coral: {
          DEFAULT: 'hsl(var(--coral) / <alpha-value>)',
          foreground: 'hsl(var(--coral-foreground) / <alpha-value>)',
        },
        teal: {
          DEFAULT: 'hsl(var(--teal) / <alpha-value>)',
          foreground: 'hsl(var(--teal-foreground) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: [
          '"Space Grotesk"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"IBM Plex Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
