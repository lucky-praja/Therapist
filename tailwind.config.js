/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      spacing: {
        '4.5': '1.125rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        sage: {
          50: '#f4f7f5',
          100: '#e8efe9',
          200: '#d1dfd6',
          300: '#a8c0b0',
          400: '#7a9a83',
          500: '#5a7a66',
          600: '#466b54',
          700: '#3d5a4a',
          800: '#334a3e',
          900: '#2a3d33',
          950: '#1a2922',
        },
        ink: {
          50: '#f6f7f7',
          100: '#ebedee',
          200: '#d4d8db',
          300: '#aeb6bc',
          400: '#828e97',
          500: '#64717b',
          600: '#4f5a63',
          700: '#414950',
          800: '#373e44',
          900: '#2d3338',
          950: '#1c2024',
        },
        gold: {
          50: '#fbf7ed',
          100: '#f6ecd0',
          200: '#ecd79c',
          300: '#e1bd5f',
          400: '#d9a73c',
          500: '#c68a26',
          600: '#a96c1f',
          700: '#874f1e',
          800: '#6f401f',
          900: '#5d361e',
          950: '#3d2410',
        },
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        card: '0 2px 8px -2px rgb(0 0 0 / 0.08), 0 4px 16px -4px rgb(0 0 0 / 0.06)',
        float: '0 8px 24px -8px rgb(0 0 0 / 0.12), 0 16px 48px -12px rgb(0 0 0 / 0.08)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
