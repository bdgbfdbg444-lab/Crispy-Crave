/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ef4444', // Nashville Hot Red/Orange
        dark: '#1f2937', // Charcoal Black
        light: '#f9fafb', // Warm beige/cream
      },
      fontFamily: {
        sans: ['Cairo', 'system-ui', 'sans-serif'],
        display: ['Ultra', 'Changa', 'system-ui', 'serif'],
      }
    },
  },
  plugins: [],
}

