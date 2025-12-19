/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#64b5f6',
          DEFAULT: '#2196f3',
          dark: '#1976d2',
        },
        secondary: {
          light: '#ff4081',
          DEFAULT: '#f50057',
          dark: '#c51162',
        },
        dark: {
          DEFAULT: '#121212',
          paper: '#1e1e1e',
        },
        light: {
          DEFAULT: '#f5f5f5',
          paper: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        card: '0 8px 16px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 16px 24px rgba(0, 0, 0, 0.15)',
        'card-dark': '0 8px 16px rgba(0, 0, 0, 0.4)',
        'card-dark-hover': '0 12px 20px rgba(0, 0, 0, 0.6)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}