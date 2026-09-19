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
        duo: {
          green: '#58cc02',
          greenDark: '#46a302',
          blue: '#1cb0f6',
          blueDark: '#1899d6',
          yellow: '#ffc800',
          yellowDark: '#e5a500',
          orange: '#ff9600',
          red: '#ff4b4b',
          redDark: '#ea2b2b',
          gray: '#e5e5e5',
          darkGray: '#4b4b4b',
          card: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Nunito', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', 'Consolas', 'monospace'],
      },
      animation: {
        'bounce-short': 'bounce 0.6s ease-in-out 1',
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
