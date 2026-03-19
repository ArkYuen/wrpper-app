/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f0ff',
          100: '#e0e0fe',
          200: '#c7c5fd',
          300: '#a89bf9',
          400: '#8b6ff4',
          500: '#7c52ed',
          600: '#6d38e0',
          700: '#5d28c7',
          800: '#4e24a3',
          900: '#3f1f82',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  },
  plugins: []
}
