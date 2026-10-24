/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#000000', // Pure pitch black
          900: '#060608', // Deepest background
          850: '#0A0A0E', // Surface background
          800: '#101015', // Card background
          750: '#16161D', // Hover / elevated surface
          700: '#1F1F28', // Subtle border
          600: '#2A2A36', // Muted border
        },
        terminal: {
          emerald: '#10B981', // Clean wind green
          'emerald-dim': '#064E3B',
          cyan: '#38BDF8', // Day-ahead forecast blue
          'cyan-dim': '#0C4A6E',
          amber: '#F59E0B', // Forecast error / warning
          'amber-dim': '#451A03',
          rose: '#F43F5E', // Risk / extreme discrepancy
          muted: '#71717A',
          subtle: '#A1A1AA',
          text: '#F4F4F5',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.02em',
      }
    },
  },
  plugins: [],
}
