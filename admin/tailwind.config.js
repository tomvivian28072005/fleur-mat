/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        vert: { DEFAULT: '#4a7c5a', clair: '#e8f2eb', fonce: '#3a6248' },
      },
    },
  },
  plugins: [],
};
