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
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#e53935',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
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
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '8px',
        xl: '12px',
        '2xl': '12px',
        '3xl': '12px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        md: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        lg: '0 4px 6px -2px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        xl: '0 6px 10px -3px rgba(0, 0, 0, 0.07), 0 3px 5px -3px rgba(0, 0, 0, 0.04)',
        none: 'none',
      },
      transitionDuration: {
        DEFAULT: '150ms',
        fast: '150ms',
        normal: '200ms',
      },
      fontFamily: {
        display: [
          'Manrope',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        sans: [
          'Manrope',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"DM Mono"',
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
