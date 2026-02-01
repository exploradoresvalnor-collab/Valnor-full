/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores del tema Valnor (RPG Medieval)
        valnor: {
          gold: '#ffd700',
          'gold-dark': '#b8860b',
          bronze: '#cd7f32',
          silver: '#c0c0c0',
          copper: '#b87333',
        },
        rpg: {
          common: '#9d9d9d',
          uncommon: '#1eff00',
          rare: '#0070dd',
          epic: '#a335ee',
          legendary: '#ff8000',
          mythic: '#e6cc80',
        },
        ui: {
          dark: '#1a1a2e',
          darker: '#0f0f1a',
          accent: '#4a1942',
          border: '#3d3d5c',
        }
      },
      fontFamily: {
        medieval: ['MedievalSharp', 'serif'],
        game: ['Cinzel', 'serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 215, 0, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #ffd700, #b8860b)',
        'gradient-dark': 'linear-gradient(180deg, #1a1a2e, #0f0f1a)',
      }
    },
  },
  plugins: [],
}
