/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12100d',
        coal: '#171410',
        taupe: '#2d2720',
        'taupe-soft': '#3a3128',
        cream: '#f7efe4',
        muted: '#cfc1ad',
        gold: '#c5a46a',
        'gold-soft': '#ead09a'
      },
      fontFamily: {
        display: ['Bodoni Moda', 'Didot', 'Times New Roman', 'serif'],
        sans: ['Montserrat', 'Avenir Next', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        glow: '0 24px 80px rgba(0, 0, 0, 0.35)',
        gold: '0 18px 50px rgba(197, 164, 106, 0.18)'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        softPulse: {
          '0%, 100%': { opacity: '0.72' },
          '50%': { opacity: '1' }
        }
      },
      animation: {
        fadeUp: 'fadeUp 620ms ease-out both',
        softPulse: 'softPulse 3.8s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
