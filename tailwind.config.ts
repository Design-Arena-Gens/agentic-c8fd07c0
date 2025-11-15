import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#b9d9ff',
          300: '#8cc0ff',
          400: '#5a9fff',
          500: '#2f7dff',
          600: '#1e5fe6',
          700: '#184bb8',
          800: '#153f93',
          900: '#143877'
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
