/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        ink: {
          900: '#0b1120',
          800: '#0f172a',
          700: '#1e293b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Hanken Grotesk"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(99, 102, 241, 0.35)',
        glow: '0 0 0 1px rgba(99, 102, 241, 0.25), 0 8px 40px -12px rgba(99, 102, 241, 0.45)',
      },
    },
  },
  plugins: [],
};
