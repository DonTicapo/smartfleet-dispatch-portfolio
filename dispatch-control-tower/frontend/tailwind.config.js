/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sf: {
          orange: '#D6512A',
          'orange-hover': '#8B251C',
          'orange-light': '#FDF0EC',
          'orange-mid': '#F0B8A4',
          navy: '#243053',
          'text-900': '#243053',
          'text-700': '#465A78',
          'text-500': '#6B7585',
          'text-300': '#B8C0CC',
          border: '#DFE4ED',
          'bg-gray': '#F7F8FA',
          success: '#2DA87A',
          warning: '#E89D0C',
          danger: '#E04848',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'ui-serif', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
