/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#0f0f0f',
          secondary: '#161616',
          tertiary: '#212121',
        },
        accent: {
          DEFAULT: '#ff0033',
          hover: '#d6002b',
          soft: 'rgba(255, 0, 51, 0.12)',
        },
        line: '#2a2a2a',
        muted: '#9a9a9a',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)',
        glow: '0 0 24px rgba(255, 0, 51, 0.35)',
      },
      borderRadius: {
        xl: '14px',
      },
    },
  },
  plugins: [],
};
