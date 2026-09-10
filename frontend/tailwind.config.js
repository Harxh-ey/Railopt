/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          // Primary blue palette — Indian Railways deep blue
          blue: '#0B3B60',
          'blue-dark': '#002D62',
          'blue-mid': '#1E3A8A',
          'blue-light': '#1D4ED8',
          'blue-pale': '#DBEAFE',
          // Backgrounds
          bg: '#F1F5F9',
          'bg-white': '#FFFFFF',
          'bg-card': '#F8FAFC',
          // Text
          text: '#0F172A',
          'text-muted': '#334155',
          'text-subtle': '#64748B',
          // Department accents
          eng: '#1D4ED8',        // Engineering — classic blue
          'eng-bg': '#EFF6FF',
          trd: '#B45309',        // Traction Distribution — amber
          'trd-bg': '#FFFBEB',
          snt: '#0E7490',        // S&T — teal/cyan
          'snt-bg': '#ECFEFF',
          // Status
          success: '#15803D',
          'success-bg': '#F0FDF4',
          warning: '#B45309',
          'warning-bg': '#FFFBEB',
          danger: '#B91C1C',
          'danger-bg': '#FEF2F2',
          // Border
          border: '#CBD5E1',
          'border-light': '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
