/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'core-bg': '#070B17',
        'core-purple': '#6D5DFB',
        'core-blue': '#5B8CFF',
        'core-cyan': '#22D3EE',
        'core-violet': '#A855F7',
        'core-green': '#22C55E',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'sans-serif'],
      },
      boxShadow: {
        'glass-glow': '0 0 30px rgba(91,140,255,0.12)',
      },
    },
  },
  plugins: [],
}
