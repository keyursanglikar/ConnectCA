/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6eaf0',
          100: '#cdd4e0',
          200: '#9ba9c1',
          300: '#6a7ea2',
          400: '#385383',
          500: '#1B2A4A',
          600: '#16223b',
          700: '#10192c',
          800: '#0b111e',
          900: '#05080f',
        },
        secondary: {
          50: '#eaf5ef',
          100: '#d5ebdf',
          200: '#abd7bf',
          300: '#81c39f',
          400: '#57af7f',
          500: '#2E8B57',
          600: '#256f46',
          700: '#1c5334',
          800: '#123823',
          900: '#091c11',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}