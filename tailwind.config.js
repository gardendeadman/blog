/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-pretendard)', 'Pretendard', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        display: ['var(--font-display)', 'Noto Serif KR', 'serif'],
      },
      colors: {
        ink: {
          50: '#f8f7f4',
          100: '#eeebe3',
          200: '#ddd8cb',
          300: '#c5bfb0',
          400: '#a9a094',
          500: '#8c8276',
          600: '#726860',
          700: '#5c524b',
          800: '#4a4039',
          900: '#3a3028',
          950: '#1e1a14',
        },
        accent: {
          DEFAULT: '#d4622a',
          light: '#e8845a',
          dark: '#b84f1f',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [],
};
