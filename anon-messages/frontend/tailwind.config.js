/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0B',       // near-black background
        panel: '#131316',     // card surface
        line: 'rgba(255,255,255,0.08)',
        paper: '#F7F7F8',     // light-mode background
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'slide-up': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'pop': { '0%': { transform: 'scale(0.9)' }, '60%': { transform: 'scale(1.05)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'pop': 'pop 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
