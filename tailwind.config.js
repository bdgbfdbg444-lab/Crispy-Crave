/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'black-primary': '#0D0D0D',
        'black-surface': '#1A1815',
        'brand-red': '#E63946',
        'wood': '#A8622F',
        'brand-red-dark': '#9A1F28',
        'text-light': '#F2EDE4',
        'text-muted': '#9C9691',
        
        // Aliases to avoid breaking current components immediately
        primary: '#A8622F', 
        dark: '#0D0D0D', 
        light: '#1A1815', // 'light' is now a dark surface in this theme to override bg-light
      },
      fontFamily: {
        sans: ['Poppins', 'Cairo', 'system-ui', 'sans-serif'],
        display: ['Ultra', 'Changa', 'system-ui', 'serif'],
      }
    },
  },
  plugins: [],
}

