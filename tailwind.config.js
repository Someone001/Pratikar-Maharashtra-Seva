/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        foreground: 'var(--color-fg)',
        surface: 'var(--color-surface)',
        muted: 'var(--color-muted)',
        'muted-foreground': 'var(--color-muted-fg)',
        card: 'var(--color-card)',
        'card-foreground': 'var(--color-card-fg)',
        border: 'var(--color-border)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-fg)',
          hover: 'var(--color-primary-hover)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-fg)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-fg)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          foreground: 'var(--color-warning-fg)',
          surface: 'var(--color-warning-surface)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          foreground: 'var(--color-danger-fg)',
          surface: 'var(--color-danger-surface)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          foreground: 'var(--color-success-fg)',
          surface: 'var(--color-success-surface)',
        },
      },
      fontFamily: {
        sans: ['Noto Sans', 'Noto Sans Devanagari', 'system-ui', '-apple-system', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'Noto Sans', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

